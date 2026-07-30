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
  assertMeetingsHiddenDataAbsent,
  fetchMeetings,
  fetchMissionControl,
  openMeetingsPage,
  scheduleMeetingViaE2e,
  transitionMeetingViaE2e,
  waitForCurrentMeetings,
} from "./helpers/meetings";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceNavDestinations,
  navigateWorkplaceToMeetings,
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

test("given_an_authenticated_learner_when_opening_meetings_then_empty_available_list_renders", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("meetings-empty");
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
  await openMeetingsPage(page, identity.simulationRunId);
  await waitForCurrentMeetings(page);
  await expectWorkplaceNavDestinations(page);

  await expect(page.getByTestId("meetings-empty")).toBeVisible();
  await assertMeetingsHiddenDataAbsent(page);

  const api = await fetchMeetings(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.projectionType).toBe("meetings");
  expect(api.data.projectionSchemaVersion).toBe(1);
  expect(api.data.meetings).toEqual([]);
  expect(api.data.summary.isEmpty).toBe(true);
  expect(JSON.stringify(api)).not.toContain("semanticHash");
  expect(JSON.stringify(api)).not.toContain("originatingCommandId");

  const mc = await fetchMissionControl(token, identity.simulationRunId);
  expect(mc.data.counts.upcomingMeetings).toEqual({
    availability: "available",
    count: 0,
  });

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("given_schedule_meeting_when_relayed_then_meetings_and_mission_control_converge", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("meetings-sched");
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

  await openMeetingsPage(page, identity.simulationRunId);
  await waitForCurrentMeetings(page);
  await expect(page.getByTestId("meetings-empty")).toBeVisible();

  await scheduleMeetingViaE2e(identity);
  await tickOutboxRelay(identity.tenantId);

  await openMeetingsPage(page, identity.simulationRunId);
  await waitForCurrentMeetings(page);
  await expect(page.getByTestId("meetings-empty")).toHaveCount(0);
  const items = page.getByTestId("meetings-item");
  await expect(items).toHaveCount(1);
  await expect(items.first()).toContainText("Risk review");
  await expect(items.first()).toContainText("Scheduled");
  await expect(items.first()).toContainText("Alex Sponsor");

  const api = await fetchMeetings(token, identity.simulationRunId);
  expect(api.data.meetings).toHaveLength(1);
  expect(api.data.meetings[0]?.meetingOccurrenceId).toBe(
    "meeting_occurrence:meeting_1",
  );
  expect(api.data.meetings[0]?.scheduleSequence).toBe(1);
  expect(api.data.meetings[0]?.status).toBe("scheduled");
  expect(api.data.summary.upcomingCount).toBe(1);

  await navigateWorkplaceToMissionControl(page);
  const mc = await fetchMissionControl(token, identity.simulationRunId);
  expect(mc.data.counts.upcomingMeetings).toEqual({
    availability: "available",
    count: 1,
  });
  await expect(page.getByText(/Upcoming meetings/i)).toBeVisible();
  const upcomingRow = page
    .locator("li")
    .filter({ hasText: /Upcoming meetings/i });
  await expect(upcomingRow.getByText("1", { exact: true })).toBeVisible();

  await openMeetingsPage(page, identity.simulationRunId);
  await page.reload();
  await waitForCurrentMeetings(page);
  await expect(page.getByTestId("meetings-item")).toHaveCount(1);
  await expect(page.getByTestId("meetings-item").first()).toHaveAttribute(
    "data-meeting-id",
    "meeting_occurrence:meeting_1",
  );
});

test("given_lifecycle_transitions_when_relayed_then_projection_updates_without_duplicates", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("meetings-life");
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

  await scheduleMeetingViaE2e(identity);
  await tickOutboxRelay(identity.tenantId);
  await transitionMeetingViaE2e(identity, "MakeMeetingAvailable");
  await tickOutboxRelay(identity.tenantId);
  await transitionMeetingViaE2e(identity, "StartMeeting");
  await tickOutboxRelay(identity.tenantId);
  await transitionMeetingViaE2e(identity, "CompleteMeeting");
  await tickOutboxRelay(identity.tenantId);

  await openMeetingsPage(page, identity.simulationRunId);
  await waitForCurrentMeetings(page);
  await expect(page.getByTestId("meetings-item")).toHaveCount(1);
  await expect(page.getByTestId("meetings-item").first()).toContainText(
    "Completed",
  );
  await expect(page.getByTestId("meetings-completed")).toBeVisible();

  const api = await fetchMeetings(token, identity.simulationRunId);
  expect(api.data.meetings).toHaveLength(1);
  expect(api.data.meetings[0]?.status).toBe("completed");
  expect(api.data.summary.upcomingCount).toBe(0);
  expect(api.data.summary.completedCount).toBe(1);

  const mc = await fetchMissionControl(token, identity.simulationRunId);
  expect(mc.data.counts.upcomingMeetings).toEqual({
    availability: "available",
    count: 0,
  });

  await redeliverLastOutboxEvent({
    tenantId: identity.tenantId,
    simulationRunId: identity.simulationRunId,
  });
  await openMeetingsPage(page, identity.simulationRunId);
  await waitForCurrentMeetings(page);
  await expect(page.getByTestId("meetings-item")).toHaveCount(1);

  await navigateWorkplaceToMeetings(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Meetings$/i }),
  ).toBeVisible();
});
