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
  assertNotificationsHiddenDataAbsent,
  fetchNotifications,
  initializeNotificationViaE2e,
  openNotificationsPage,
  waitForCurrentNotifications,
} from "./helpers/notifications";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceNavDestinations,
  navigateWorkplaceToMissionControl,
  navigateWorkplaceToNotifications,
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

test("given_an_authenticated_learner_when_opening_notifications_then_empty_available_list_renders", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("notifications-empty");
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
  await openNotificationsPage(page, identity.simulationRunId);
  await waitForCurrentNotifications(page);
  await expectWorkplaceNavDestinations(page);

  await expect(page.getByTestId("notifications-empty")).toBeVisible();
  await assertNotificationsHiddenDataAbsent(page);

  const api = await fetchNotifications(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.projectionType).toBe("notifications");
  expect(api.data.projectionSchemaVersion).toBe(1);
  expect(api.data.notifications).toEqual([]);
  expect(api.data.summary.isEmpty).toBe(true);
  expect(JSON.stringify(api)).not.toContain("semanticHash");
  expect(JSON.stringify(api)).not.toContain("originatingCommandId");

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("given_initialize_notifications_when_relayed_then_notifications_converge", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("notifications-happy");
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

  await openNotificationsPage(page, identity.simulationRunId);
  await waitForCurrentNotifications(page);
  await expect(page.getByTestId("notifications-empty")).toBeVisible();

  const first = await initializeNotificationViaE2e(identity, {
    notificationId: "notification_1",
    title: "Milestone reached",
    summary: "Your project has hit a key milestone.",
    body: "Well done! Keep going.",
    sourceKind: "simulation",
    commandId: "cmd_notif_notification_1",
  });
  await initializeNotificationViaE2e(identity, {
    notificationId: "notification_2",
    title: "Meeting scheduled",
    summary: "A new stakeholder meeting has been added.",
    sourceKind: "meeting",
    commandId: "cmd_notif_notification_2",
  });
  await tickOutboxRelay(identity.tenantId);

  await openNotificationsPage(page, identity.simulationRunId);
  await waitForCurrentNotifications(page);
  await expect(page.getByTestId("notifications-empty")).toHaveCount(0);

  const items = page.getByTestId("notifications-item");
  await expect(items).toHaveCount(2);
  await expect(
    items.nth(0).getByTestId("notifications-item-title"),
  ).toContainText("Milestone reached");
  await expect(
    items.nth(0).getByTestId("notifications-item-summary"),
  ).toContainText("Your project has hit a key milestone.");
  await expect(
    items.nth(0).getByTestId("notifications-item-body"),
  ).toContainText("Well done! Keep going.");
  await expect(
    items.nth(1).getByTestId("notifications-item-title"),
  ).toContainText("Meeting scheduled");

  const api = await fetchNotifications(token, identity.simulationRunId);
  expect(api.data.notifications).toHaveLength(2);
  expect(api.data.notifications[0]?.notificationId).toBe("notification_1");
  expect(api.data.notifications[0]?.creationSequence).toBe(1);
  expect(api.data.notifications[0]?.body).toBe("Well done! Keep going.");
  expect(api.data.notifications[0]?.source.kind).toBe("simulation");
  expect(api.data.notifications[1]?.notificationId).toBe("notification_2");
  expect(api.data.notifications[1]?.creationSequence).toBe(2);
  expect(api.meta.sourceAggregateVersion).toBeGreaterThanOrEqual(
    first.aggregateVersion,
  );

  await page.reload();
  await waitForCurrentNotifications(page);
  await expect(page.getByTestId("notifications-item")).toHaveCount(2);

  await navigateWorkplaceToMissionControl(page);
  await navigateWorkplaceToNotifications(page);
  await waitForCurrentNotifications(page);
  await expect(page.getByTestId("notifications-item")).toHaveCount(2);

  await redeliverLastOutboxEvent({
    tenantId: identity.tenantId,
    simulationRunId: identity.simulationRunId,
  });
  await openNotificationsPage(page, identity.simulationRunId);
  await waitForCurrentNotifications(page);
  await expect(page.getByTestId("notifications-item")).toHaveCount(2);

  await assertNotificationsHiddenDataAbsent(page);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
