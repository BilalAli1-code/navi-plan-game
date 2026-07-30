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
  tickOutboxRelay,
} from "./helpers/api";
import {
  enterRationale,
  reviewAndSubmit,
  selectBalancedOption,
  waitForCurrentProjection,
  waitForResolvedPhase,
} from "./helpers/ui";
import {
  assertMissionControlHiddenDataAbsent,
  fetchMissionControl,
  openMissionControlPage,
  waitForCurrentMissionControl,
} from "./helpers/mission-control";
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

test("given_an_authenticated_learner_when_opening_mission_control_then_learner_safe_overview_renders", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("mc-happy");
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
  await openMissionControlPage(page, identity.simulationRunId);
  await waitForCurrentMissionControl(page);

  await expect(
    page.getByText("Pending decisions", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^1$/).first()).toBeVisible();
  await expect(page.getByText(/Unavailable/i)).toHaveCount(1);
  await expect(page.getByText(/Upcoming meetings/i)).toBeVisible();
  await expect(
    page
      .locator("li")
      .filter({ hasText: /Upcoming meetings/i })
      .getByText("0", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Scaffold Decision/i }),
  ).toBeVisible();
  await expect(page.getByText(/No revealed outcomes yet/i)).toBeVisible();
  await assertMissionControlHiddenDataAbsent(page);

  const api = await fetchMissionControl(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.projectionType).toBe("mission_control");
  expect(api.data.projectionSchemaVersion).toBe(1);
  const counts = api.data.counts as {
    readonly upcomingMeetings: {
      readonly availability: string;
      readonly count?: number;
      readonly reason?: string;
    };
    readonly unreadActionRequiredInboxItems: {
      readonly availability: string;
      readonly count?: number;
      readonly reason?: string;
    };
  };
  expect(counts.upcomingMeetings).toEqual({
    availability: "available",
    count: 0,
  });
  expect(counts.unreadActionRequiredInboxItems).toEqual({
    availability: "unavailable",
    reason: "channel_not_implemented",
  });
  expect(JSON.stringify(api)).not.toContain("semanticHash");
  expect(JSON.stringify(api)).not.toContain("consequenceDefinitions");

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);

  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      throw new Error(`Console error: ${message.text()}`);
    }
  });
});

test("given_a_decision_submission_when_returning_to_mission_control_then_projection_converges", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("mc-conv");
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

  await openMissionControlPage(page, identity.simulationRunId);
  await waitForCurrentMissionControl(page);
  await page.getByRole("link", { name: /Scaffold Decision/i }).click();
  await expect(page.getByRole("heading", { name: /^Decision$/i })).toBeVisible({
    timeout: 15_000,
  });
  await waitForCurrentProjection(page);
  await selectBalancedOption(page);
  await enterRationale(page, "Mission Control convergence");
  await reviewAndSubmit(page);
  await waitForResolvedPhase(page);
  await tickOutboxRelay(identity.tenantId);

  await page.getByRole("link", { name: /Back to Mission Control/i }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Mission Control$/i }),
  ).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText(/No recommended actions right now/i)).toBeVisible(
    {
      timeout: 20_000,
    },
  );
  await expect(page.getByText(/You chose a balanced path/i)).toBeVisible({
    timeout: 20_000,
  });
  await waitForCurrentMissionControl(page);
  await assertMissionControlHiddenDataAbsent(page);

  const api = await fetchMissionControl(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(
    (api.data.counts as { pendingDecisions: { count: number } })
      .pendingDecisions.count,
  ).toBe(0);
  expect(api.data.recentRevealedOutcome).not.toBeNull();
});

test("given_wrong_tenant_when_requesting_mission_control_then_access_is_denied", async ({
  page,
}, testInfo) => {
  const owner = uniqueIdentity("mc-owner");
  const other = uniqueIdentity("mc-other");
  await createDecisionLifecycleFixture(owner);
  await createDecisionLifecycleFixture(other);
  const otherToken = await createE2eAccessToken(other);
  testInfo.annotations.push({
    type: "fixture",
    description: `${owner.tenantId}/${owner.simulationRunId}`,
  });

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: other.actorId,
    tenantId: other.tenantId,
    accessToken: otherToken,
  });
  await openMissionControlPage(page, owner.simulationRunId);
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("mc-freshness")).toHaveCount(0);
});
