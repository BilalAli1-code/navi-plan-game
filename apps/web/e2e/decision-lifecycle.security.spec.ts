import { expect, test } from "@playwright/test";
import {
  authenticateBrowserPage,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import {
  cleanupAllE2eFixtures,
  createDecisionLifecycleFixture,
  fetchProjection,
  submitDecisionApi,
} from "./helpers/api";
import {
  assertHiddenDataAbsent,
  openDecisionPage,
  waitForCurrentProjection,
} from "./helpers/ui";
import {
  countCrossTenantLeaks,
  inspectAuthoritativeDecisionState,
} from "./helpers/db";
import { requireE2eDatabase } from "./helpers/env";

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  requireE2eDatabase();
});

test.beforeEach(async () => {
  await cleanupAllE2eFixtures();
});

test.afterEach(async () => {
  await cleanupAllE2eFixtures();
});

test("given_wrong_tenant_learner_when_accessing_run_then_content_is_concealed", async ({
  page,
}) => {
  const tenantA = uniqueIdentity("tenA");
  const tenantB = uniqueIdentity("tenB");
  await createDecisionLifecycleFixture(tenantA);
  await createDecisionLifecycleFixture(tenantB);
  const tokenB = await createE2eAccessToken(tenantB);

  const projection = await fetchProjection({
    accessToken: tokenB,
    simulationRunId: tenantA.simulationRunId,
  });
  expect([403, 404]).toContain(projection.status);
  const body = await projection.json();
  expect(JSON.stringify(body)).not.toContain("Scaffold Decision");
  expect(JSON.stringify(body)).not.toContain(tenantA.tenantId);

  const submit = await submitDecisionApi({
    accessToken: tokenB,
    simulationRunId: tenantA.simulationRunId,
    commandId: `cmd_cross_${tenantB.simulationRunId}`,
    correlationId: `corr_cross_${tenantB.simulationRunId}`,
    expectedAggregateVersion: 1,
    decisionId: "decision_1",
    optionId: "option_b",
  });
  expect([403, 404]).toContain(submit.status);

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: tenantB.actorId,
    tenantId: tenantB.tenantId,
    accessToken: tokenB,
  });
  await openDecisionPage(page, tenantA.simulationRunId);
  await expect(page.getByText(/Scaffold Decision/i)).toHaveCount(0);
  await expect(
    page.getByRole("alert").or(page.getByRole("status")),
  ).toBeVisible();

  expect(await countCrossTenantLeaks(tenantA)).toBe(0);
  const stateA = await inspectAuthoritativeDecisionState(tenantA);
  expect(stateA.decisionCount).toBe(0);
});

test("given_learner_without_submit_capability_when_mutating_then_authorization_denies", async () => {
  const identity = uniqueIdentity("unauthz");
  await createDecisionLifecycleFixture(identity, {
    postSeedCapabilities: ["simulation.run.view"],
  });
  const token = await createE2eAccessToken(identity);
  const projection = await fetchProjection({
    accessToken: token,
    simulationRunId: identity.simulationRunId,
  });
  expect(projection.status).toBe(200);
  const body = await projection.json();
  const rejected = await submitDecisionApi({
    accessToken: token,
    simulationRunId: identity.simulationRunId,
    commandId: `cmd_unauthz_${identity.simulationRunId}`,
    correlationId: `corr_unauthz_${identity.simulationRunId}`,
    expectedAggregateVersion: body.meta.sourceAggregateVersion,
    decisionId: "decision_1",
    optionId: "option_b",
  });
  // Capability denial is preferred; conceal with 404 where policy maps that way.
  expect([403, 404, 422]).toContain(rejected.status);
  expect(rejected.status).not.toBe(200);
  const state = await inspectAuthoritativeDecisionState(identity);
  expect(state.decisionCount).toBe(0);
});

test("given_current_projection_when_inspected_then_hidden_authoritative_fields_are_absent", async ({
  page,
}) => {
  const identity = uniqueIdentity("hidden");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);

  const projection = await fetchProjection({
    accessToken: token,
    simulationRunId: identity.simulationRunId,
  });
  expect(projection.status).toBe(200);
  const bodyText = await projection.text();
  for (const tokenName of [
    "semanticHash",
    "consequenceDefinitions",
    "applicationKey",
    "resolverVersion",
    "learning_signal",
    "stakeholder_signal",
    "analytics_signal",
    "schedule_event",
    "service_role",
  ]) {
    expect(bodyText).not.toContain(tokenName);
  }

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForCurrentProjection(page);
  await assertHiddenDataAbsent(page);
});
