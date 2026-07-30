import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  authenticateBrowserPage,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import {
  cleanupAllE2eFixtures,
  createDecisionLifecycleFixture,
  redeliverLastOutboxEvent,
  tickOutboxRelay,
} from "./helpers/api";
import {
  assertActivitiesHiddenDataAbsent,
  completeActivityViaE2e,
  fetchActivities,
  fetchCompletedHistory,
  initializeActivityViaE2e,
  openActivitiesPage,
  openCompletedHistoryPage,
  waitForCurrentActivities,
  waitForCurrentCompletedHistory,
} from "./helpers/activities";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceNavDestinations,
  navigateWorkplaceToActivities,
  navigateWorkplaceToCompletedHistory,
  navigateWorkplaceToMissionControl,
} from "./helpers/workplace";

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

test("given_an_authenticated_learner_when_opening_activities_then_empty_available_list_renders", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("activities-empty");
  await createDecisionLifecycleFixture(identity);
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
  await openActivitiesPage(page, identity.simulationRunId);
  await waitForCurrentActivities(page);
  await expectWorkplaceNavDestinations(page);

  await expect(page.getByTestId("activities-empty")).toBeVisible();
  await assertActivitiesHiddenDataAbsent(page);

  const api = await fetchActivities(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.projectionType).toBe("activities");
  expect(api.data.projectionSchemaVersion).toBe(1);
  expect(api.data.activities).toEqual([]);
  expect(api.data.summary.isEmpty).toBe(true);
  expect(JSON.stringify(api)).not.toContain("semanticHash");
  expect(JSON.stringify(api)).not.toContain("completingCommandId");

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("given_initialize_activity_when_relayed_then_activity_visible_complete_moves_to_history", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("activities-happy");
  await createDecisionLifecycleFixture(identity);
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

  // 1. Open Activities → empty
  await openActivitiesPage(page, identity.simulationRunId);
  await waitForCurrentActivities(page);
  await expect(page.getByTestId("activities-empty")).toBeVisible();

  // 2. Initialize an activity via E2E seam
  const first = await initializeActivityViaE2e(identity, {
    activityId: "activity_1",
    title: "Review project scope",
    summary: "Review and confirm the project scope document.",
    body: "Please review by end of week.",
    sourceKind: "simulation",
    commandId: "cmd_act_activity_1",
  });
  await initializeActivityViaE2e(identity, {
    activityId: "activity_2",
    title: "Schedule kickoff meeting",
    summary: "Arrange a kickoff meeting with stakeholders.",
    sourceKind: "meeting",
    commandId: "cmd_act_activity_2",
  });
  await tickOutboxRelay(identity.tenantId);

  // 3. Reload Activities and verify both active activities appear
  await openActivitiesPage(page, identity.simulationRunId);
  await waitForCurrentActivities(page);
  await expect(page.getByTestId("activities-empty")).toHaveCount(0);

  const items = page.getByTestId("activities-item");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0).getByTestId("activities-item-title")).toContainText(
    "Review project scope",
  );
  await expect(
    items.nth(0).getByTestId("activities-item-summary"),
  ).toContainText("Review and confirm the project scope document.");
  await expect(items.nth(0).getByTestId("activities-item-body")).toContainText(
    "Please review by end of week.",
  );
  await expect(items.nth(1).getByTestId("activities-item-title")).toContainText(
    "Schedule kickoff meeting",
  );

  const activitiesApi = await fetchActivities(token, identity.simulationRunId);
  expect(activitiesApi.data.activities).toHaveLength(2);
  expect(activitiesApi.data.activities[0]?.activityId).toBe("activity_1");
  expect(activitiesApi.data.activities[0]?.creationSequence).toBe(1);
  expect(activitiesApi.data.activities[0]?.body).toBe(
    "Please review by end of week.",
  );
  expect(activitiesApi.data.activities[0]?.source.kind).toBe("simulation");
  expect(activitiesApi.data.activities[0]?.status).toBe("active");
  expect(activitiesApi.data.activities[1]?.activityId).toBe("activity_2");
  expect(activitiesApi.data.activities[1]?.creationSequence).toBe(2);
  expect(activitiesApi.meta.sourceAggregateVersion).toBeGreaterThanOrEqual(
    first.aggregateVersion,
  );

  // 4. Navigate away and back
  await navigateWorkplaceToMissionControl(page);
  await navigateWorkplaceToActivities(page);
  await waitForCurrentActivities(page);
  await expect(page.getByTestId("activities-item")).toHaveCount(2);

  // 5. Complete activity_1 via E2E seam
  const completed = await completeActivityViaE2e(identity, {
    activityId: "activity_1",
    commandId: "cmd_act_complete_activity_1",
  });
  await tickOutboxRelay(identity.tenantId);

  // 6. Verify activity_1 disappears from Activities (only active remain)
  await openActivitiesPage(page, identity.simulationRunId);
  await waitForCurrentActivities(page);
  const remainingItems = page.getByTestId("activities-item");
  await expect(remainingItems).toHaveCount(1);
  await expect(
    remainingItems.nth(0).getByTestId("activities-item-title"),
  ).toContainText("Schedule kickoff meeting");

  const activitiesAfterComplete = await fetchActivities(
    token,
    identity.simulationRunId,
  );
  expect(activitiesAfterComplete.data.activities).toHaveLength(1);
  expect(activitiesAfterComplete.data.activities[0]?.activityId).toBe(
    "activity_2",
  );

  // 7. Open Completed History → activity_1 appears
  await navigateWorkplaceToCompletedHistory(page);
  await waitForCurrentCompletedHistory(page);
  await expect(page.getByTestId("completed-history-empty")).toHaveCount(0);

  const historyItems = page.getByTestId("completed-history-item");
  await expect(historyItems).toHaveCount(1);
  await expect(
    historyItems.nth(0).getByTestId("completed-history-item-title"),
  ).toContainText("Review project scope");

  const historyApi = await fetchCompletedHistory(
    token,
    identity.simulationRunId,
  );
  expect(historyApi.data.items).toHaveLength(1);
  expect(historyApi.data.items[0]?.activityId).toBe("activity_1");
  expect(historyApi.data.items[0]?.completionSequence).toBe(1);
  expect(historyApi.data.items[0]?.status).toBe("completed");
  expect(historyApi.meta.sourceAggregateVersion).toBeGreaterThanOrEqual(
    completed.aggregateVersion,
  );
  expect(JSON.stringify(historyApi)).not.toContain("completingCommandId");

  // 8. Redelivery idempotency check
  await redeliverLastOutboxEvent({
    tenantId: identity.tenantId,
    simulationRunId: identity.simulationRunId,
  });
  await openCompletedHistoryPage(page, identity.simulationRunId);
  await waitForCurrentCompletedHistory(page);
  await expect(page.getByTestId("completed-history-item")).toHaveCount(1);

  // 9. Axe accessibility check
  await assertActivitiesHiddenDataAbsent(page);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
