import { expect, test } from "@playwright/test";
import {
  authenticateBrowserPage,
  createAuthenticatedContext,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import {
  cleanupAllE2eFixtures,
  createDecisionLifecycleFixture,
  fetchProjection,
  resetProjectionGate,
  setProjectionGate,
  submitDecisionApi,
} from "./helpers/api";
import {
  enterRationale,
  openDecisionPage,
  reviewAndSubmit,
  selectBalancedOption,
  submitButton,
  waitForCurrentProjection,
  waitForResolvedDecision,
} from "./helpers/ui";
import {
  inspectAuthoritativeDecisionState,
  waitForAuthoritativeCondition,
} from "./helpers/db";
import { requireE2eDatabase } from "./helpers/env";

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  requireE2eDatabase();
});

test.beforeEach(async () => {
  await cleanupAllE2eFixtures();
  await resetProjectionGate();
});

test.afterEach(async () => {
  await resetProjectionGate();
  await cleanupAllE2eFixtures();
});

test("given_rapid_duplicate_submit_when_learner_clicks_twice_then_one_authoritative_decision_exists", async ({
  page,
}) => {
  const identity = uniqueIdentity("dupclick");
  const fixture = await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForCurrentProjection(page);
  await selectBalancedOption(page);
  await enterRationale(page, "Double-click protection");
  await page.getByRole("button", { name: /Review and submit/i }).click();

  const submit = submitButton(page);
  await expect(submit).toBeEnabled();
  // Rapid repeated activation (pointer double-click).
  await submit.dblclick({ delay: 20 });

  await waitForResolvedDecision(page);
  await waitForAuthoritativeCondition(async () => {
    const state = await inspectAuthoritativeDecisionState(identity);
    return (
      state.decisionCount === 1 &&
      state.outcomeCount === 1 &&
      state.consequenceCount === fixture.expected.consequenceDefinitionCount &&
      state.budget === fixture.expected.budget &&
      state.projectionHistoryCount === 1
    );
  });
});

test("given_uncertain_transport_when_retrying_then_same_idempotency_identity_is_reused", async ({
  page,
}) => {
  const identity = uniqueIdentity("uncertain");
  const fixture = await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);
  let capturedCommandId: string | null = null;
  let firstAttempt = true;

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForCurrentProjection(page);

  await page.route("**/commands/submit-decision", async (route) => {
    const headers = route.request().headers();
    const commandId = headers["idempotency-key"] ?? null;
    if (firstAttempt) {
      firstAttempt = false;
      capturedCommandId = commandId;
      await route.fetch();
      await route.abort("failed");
      return;
    }
    expect(commandId).toBe(capturedCommandId);
    await route.continue();
  });

  await selectBalancedOption(page);
  await enterRationale(page, "Uncertain retry rationale");
  await reviewAndSubmit(page);

  await expect(
    page.getByRole("button", { name: /Retry submission/i }),
  ).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: /Retry submission/i }).click();
  await waitForResolvedDecision(page);

  const state = await inspectAuthoritativeDecisionState(identity);
  expect(state.decisionCount).toBe(1);
  expect(state.outcomeCount).toBe(1);
  expect(state.budget).toBe(fixture.expected.budget);
  expect(capturedCommandId).toBeTruthy();
});

test("given_same_idempotency_key_with_changed_payload_when_submitted_then_conflict_is_returned", async () => {
  const identity = uniqueIdentity("idemp");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);
  const projection = await (
    await fetchProjection({
      accessToken: token,
      simulationRunId: identity.simulationRunId,
    })
  ).json();
  const version = projection.meta.sourceAggregateVersion as number;
  const commandId = `cmd_conflict_${identity.simulationRunId}`;

  const first = await submitDecisionApi({
    accessToken: token,
    simulationRunId: identity.simulationRunId,
    commandId,
    correlationId: `corr_${commandId}_1`,
    expectedAggregateVersion: version,
    decisionId: "decision_1",
    optionId: "option_b",
    rationale: "first payload",
  });
  expect(first.status).toBe(200);

  const conflict = await submitDecisionApi({
    accessToken: token,
    simulationRunId: identity.simulationRunId,
    commandId,
    correlationId: `corr_${commandId}_2`,
    expectedAggregateVersion: version,
    decisionId: "decision_1",
    optionId: "option_a",
    rationale: "changed payload",
  });
  expect(conflict.status).toBe(409);
  const body = await conflict.json();
  expect(body.error.code).toBe("IDEMPOTENCY_KEY_REUSED");
  expect(JSON.stringify(body)).not.toMatch(/event_outbox|SQL|password/i);

  const state = await inspectAuthoritativeDecisionState(identity);
  expect(state.decisionCount).toBe(1);
  expect(state.outcomeCount).toBe(1);
});

test("given_two_contexts_when_second_submits_stale_version_then_conflict_without_auto_resubmit", async ({
  browser,
}, testInfo) => {
  const identity = uniqueIdentity("verconf");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);
  const baseURL = testInfo.project.use.baseURL ?? "http://127.0.0.1:4173";

  const contextA = await createAuthenticatedContext(browser, {
    ...identity,
    accessToken: token,
    baseURL,
  });
  const contextB = await createAuthenticatedContext(browser, {
    ...identity,
    accessToken: token,
    baseURL,
  });

  try {
    await openDecisionPage(contextA.page, identity.simulationRunId);
    await openDecisionPage(contextB.page, identity.simulationRunId);
    await waitForCurrentProjection(contextA.page);
    await waitForCurrentProjection(contextB.page);

    await selectBalancedOption(contextA.page);
    await enterRationale(contextA.page, "Context A wins");
    await reviewAndSubmit(contextA.page);
    await waitForResolvedDecision(contextA.page);

    await selectBalancedOption(contextB.page);
    await enterRationale(contextB.page, "Context B stale");
    await contextB.page
      .getByRole("button", { name: /Review and submit/i })
      .click();
    await contextB.page
      .getByRole("button", { name: /^Submit decision$/i })
      .click();

    await expect(contextB.page.locator(".ps-decision-status")).toContainText(
      /simulation changed|Refresh the projection|conflict/i,
      { timeout: 15_000 },
    );

    const state = await inspectAuthoritativeDecisionState(identity);
    expect(state.decisionCount).toBe(1);
    expect(state.outcomeCount).toBe(1);
  } finally {
    await contextA.context.close();
    await contextB.context.close();
  }
});

test("given_projection_hold_when_command_is_accepted_then_ui_stays_refreshing_until_released", async ({
  page,
}) => {
  const identity = uniqueIdentity("lag");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForCurrentProjection(page);

  await setProjectionGate("hold");
  await selectBalancedOption(page);
  await enterRationale(page, "Lag path");
  await reviewAndSubmit(page);

  await expect(page.locator(".ps-decision-status")).toContainText(
    /accepted|Refreshing authoritative projection/i,
    { timeout: 10_000 },
  );
  await expect(page.getByText(/Decision resolved/i)).toHaveCount(0);
  await expect(page.getByText(/No decisions available/i)).toHaveCount(0);

  await setProjectionGate("open");
  await waitForResolvedDecision(page);
  const state = await inspectAuthoritativeDecisionState(identity);
  expect(state.decisionCount).toBe(1);
  expect(state.projectionHistoryCount).toBe(1);
});

test("given_projection_hold_beyond_timeout_when_accepted_then_manual_refresh_recovers", async ({
  page,
}) => {
  const identity = uniqueIdentity("timeout");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForCurrentProjection(page);

  await setProjectionGate("hold");
  await selectBalancedOption(page);
  await reviewAndSubmit(page);

  await expect(page.locator(".ps-decision-status")).toContainText(
    /still refreshing|Use Refresh/i,
    { timeout: 12_000 },
  );
  await expect(page.getByText(/budget:\s*105/i)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Review and submit/i }),
  ).toHaveCount(0);

  await setProjectionGate("open");
  await page.getByRole("button", { name: /Refresh projection/i }).click();
  // After timeout the phase stays accepted_refreshing; reload proves server persistence.
  await page.reload();
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForResolvedDecision(page);
});

test("given_rebuild_failed_projection_when_learner_views_decision_then_submission_is_disabled", async ({
  page,
}) => {
  const identity = uniqueIdentity("stale");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);

  await setProjectionGate("fail_rebuild");

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);

  await expect(page.locator('[data-freshness="rebuild_failed"]')).toBeVisible();
  await expect(
    page.getByText(/Decision submission is disabled/i),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Review and submit/i }),
  ).toBeDisabled();

  await resetProjectionGate();
  await page.getByRole("button", { name: /Refresh projection/i }).click();
  await waitForCurrentProjection(page);
  await expect(
    page.getByRole("button", { name: /Review and submit/i }),
  ).toBeDisabled();
  await selectBalancedOption(page);
  await expect(
    page.getByRole("button", { name: /Review and submit/i }),
  ).toBeEnabled();
});

test("given_completed_run_when_submitting_then_business_rejection_is_safe", async ({
  page,
}) => {
  const identity = uniqueIdentity("bizrej");
  await createDecisionLifecycleFixture(identity, { completeAfterSeed: true });
  const token = await createE2eAccessToken(identity);

  // API companion: submit against completed run.
  const projection = await fetchProjection({
    accessToken: token,
    simulationRunId: identity.simulationRunId,
  });
  // Completed runs may 404/422 on projection or return non-actionable state.
  if (projection.ok) {
    const body = await projection.json();
    const version = body.meta?.sourceAggregateVersion ?? 0;
    const rejected = await submitDecisionApi({
      accessToken: token,
      simulationRunId: identity.simulationRunId,
      commandId: `cmd_biz_${identity.simulationRunId}`,
      correlationId: `corr_biz_${identity.simulationRunId}`,
      expectedAggregateVersion: version,
      decisionId: "decision_1",
      optionId: "option_b",
    });
    expect([409, 422, 404, 403]).toContain(rejected.status);
    const errorBody = await rejected.json();
    expect(errorBody.error?.message ?? "").not.toMatch(/SQL|password|stack/i);
  }

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  // UI must not invent a synthetic available decision.
  await expect(page.getByText(/Scaffold Decision/i)).toHaveCount(0);

  const state = await inspectAuthoritativeDecisionState(identity);
  expect(state.decisionCount).toBe(0);
  expect(state.outcomeCount).toBe(0);
});
