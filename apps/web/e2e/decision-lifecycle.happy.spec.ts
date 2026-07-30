import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
  redeliverLastOutboxEvent,
  tickOutboxRelay,
} from "./helpers/api";
import {
  assertHiddenDataAbsent,
  enterRationale,
  openDecisionPage,
  reviewAndSubmit,
  reviewButton,
  selectBalancedOption,
  waitForCurrentProjection,
  waitForResolvedDecision,
  waitForResolvedPhase,
} from "./helpers/ui";
import {
  assertSharedSequenceUniqueEventIds,
  countCrossTenantLeaks,
  countProjectionInboxRows,
  inspectAuthoritativeDecisionState,
  listOutboxEventTypes,
  waitForAuthoritativeCondition,
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

test("given_an_authenticated_learner_when_completing_a_decision_then_authoritative_lifecycle_converges", async ({
  page,
  browser,
}, testInfo) => {
  const identity = uniqueIdentity("happy");
  const fixture = await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);

  testInfo.annotations.push({
    type: "fixture",
    description: `${identity.tenantId}/${identity.simulationRunId}`,
  });

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForCurrentProjection(page);

  await expect(page.getByText(/Scaffold Decision/i)).toHaveCount(1);
  await expect(page.getByRole("radio")).toHaveCount(2);
  await expect(page.getByRole("radio").nth(0)).toHaveAccessibleName(
    /Conservative option/i,
  );
  await expect(page.getByRole("radio").nth(1)).toHaveAccessibleName(
    /Balanced option/i,
  );
  await expect(reviewButton(page)).toBeDisabled();
  await assertHiddenDataAbsent(page);

  await selectBalancedOption(page);
  await enterRationale(page, "Prefer a balanced path for the demo case.");
  await expect(reviewButton(page)).toBeEnabled();
  await reviewAndSubmit(page);

  await expect(page.locator(".ps-decision-status")).toContainText(
    /Submitting decision|accepted|Refreshing authoritative projection|Decision resolved/i,
  );

  await waitForResolvedPhase(page);
  await waitForResolvedDecision(page);
  await assertHiddenDataAbsent(page);

  await waitForAuthoritativeCondition(async () => {
    const state = await inspectAuthoritativeDecisionState(identity);
    return (
      state.decisionCount === 1 &&
      state.resolvedDecisionCount === 1 &&
      state.outcomeCount === 1 &&
      state.consequenceCount === fixture.expected.consequenceDefinitionCount &&
      state.scheduledEventCount === 1 &&
      state.learnerMessageCount === 1 &&
      state.learnerMessageDeliveredOutboxCount === 1 &&
      state.budget === fixture.expected.budget &&
      state.projectStatus === fixture.expected.projectStatus &&
      state.idempotencyReceiptCount === 1 &&
      state.projectionCount === 1 &&
      state.projectionHistoryCount === 1
    );
  });

  const authoritative = await inspectAuthoritativeDecisionState(identity);
  expect(authoritative.distinctConsequenceApplicationKeys).toBe(
    fixture.expected.consequenceDefinitionCount,
  );
  expect(authoritative.learnerMessageCount).toBe(1);
  expect(authoritative.learnerMessageDeliveredOutboxCount).toBe(1);
  expect(authoritative.outboxEventCount).toBeGreaterThan(0);
  expect(await countCrossTenantLeaks(identity)).toBe(0);

  await tickOutboxRelay(identity.tenantId);
  await waitForAuthoritativeCondition(async () => {
    const state = await inspectAuthoritativeDecisionState(identity);
    return (
      state.missionControlProjectionCount === 1 &&
      state.decisionLogProjectionCount === 1
    );
  });
  const eventTypes = await listOutboxEventTypes(identity);
  expect(eventTypes.length).toBeGreaterThan(0);
  await assertSharedSequenceUniqueEventIds(identity);

  // Refresh persistence
  await page.reload();
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForResolvedDecision(page);
  await expect(page.getByText(/No decisions available/i)).toBeVisible();

  // Reopen in a fresh authenticated browser context
  const reopened = await createAuthenticatedContext(browser, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
    baseURL: testInfo.project.use.baseURL ?? "http://127.0.0.1:4173",
  });
  try {
    await openDecisionPage(reopened.page, identity.simulationRunId);
    await waitForResolvedDecision(reopened.page);
    await assertHiddenDataAbsent(reopened.page);
  } finally {
    await reopened.context.close();
  }

  // Duplicate event delivery must not corrupt projection
  const inboxBefore = await countProjectionInboxRows({
    tenantId: identity.tenantId,
  });
  await redeliverLastOutboxEvent(identity);
  const inboxAfter = await countProjectionInboxRows({
    tenantId: identity.tenantId,
  });
  expect(inboxAfter).toBeGreaterThanOrEqual(inboxBefore);
  const afterRedelivery = await inspectAuthoritativeDecisionState(identity);
  expect(afterRedelivery.decisionCount).toBe(1);
  expect(afterRedelivery.projectionCount).toBe(1);
  expect(afterRedelivery.missionControlProjectionCount).toBe(1);
  expect(afterRedelivery.decisionLogProjectionCount).toBe(1);
  expect(afterRedelivery.projectionHistoryCount).toBe(1);
  expect(afterRedelivery.budget).toBe(fixture.expected.budget);

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "critical" || violation.impact === "serious",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("given_keyboard_only_learner_when_submitting_then_decision_resolves", async ({
  page,
}) => {
  const identity = uniqueIdentity("keyboard");
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

  await page.getByRole("radio", { name: /Balanced option/i }).focus();
  await page.keyboard.press("Space");
  await page.getByLabel(/Rationale \(optional\)/i).fill("Keyboard path");
  await page.getByRole("button", { name: /Review and submit/i }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: /Confirm submission/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Submit decision$/i }).focus();
  await page.keyboard.press("Enter");
  await waitForResolvedDecision(page);

  await expect(page.locator(".ps-decision-status")).toBeFocused();
});

test("given_unauthenticated_browser_when_opening_decision_then_auth_required", async ({
  page,
}) => {
  const identity = uniqueIdentity("unauth");
  await createDecisionLifecycleFixture(identity);

  await openDecisionPage(page, identity.simulationRunId);
  await expect(page.getByRole("alert")).toContainText(
    /Authentication required/i,
  );
  const api = await fetchProjection({
    accessToken: "invalid",
    simulationRunId: identity.simulationRunId,
  });
  expect(api.status).toBe(401);
  const state = await inspectAuthoritativeDecisionState(identity);
  expect(state.decisionCount).toBe(0);
});
