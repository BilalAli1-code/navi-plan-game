/**
 * PS-ROADMAP-024 — Unified Workplace Convergence Suite (browser journey).
 *
 * Full learner Workplace path with authoritative E2E command seams, relay tick
 * convergence, deep links, refresh/history, responsive smoke, and axe.
 */
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
} from "./helpers/api";
import {
  completeActivityViaE2e,
  fetchActivities,
  fetchCompletedHistory,
  initializeActivityViaE2e,
} from "./helpers/activities";
import { initializeDocumentViaE2e } from "./helpers/documents";
import { initializeNotificationViaE2e } from "./helpers/notifications";
import { scheduleMeetingViaE2e } from "./helpers/meetings";
import { initializeStakeholderViaE2e } from "./helpers/stakeholders";
import { fetchInbox } from "./helpers/inbox";
import { fetchMeetings } from "./helpers/meetings";
import {
  enterRationale,
  reviewAndSubmit,
  selectBalancedOption,
  waitForCurrentProjection,
  waitForResolvedPhase,
} from "./helpers/ui";
import { requireE2eDatabase } from "./helpers/env";
import {
  assertNoHiddenOperationalLeakage,
  CONVERGENCE_SHELL_NAV_ORDER,
  CONVERGENCE_SHELL_ROUTES,
  convergeRelay,
  fetchLearnerProjection,
  openShellSurface,
  rebuildAllProjectionsViaOps,
  seedUnifiedWorkplaceState,
  walkWorkplaceNavigationOrder,
} from "./helpers/convergence";
import {
  expectWorkplaceNavDestinations,
  expectWorkplaceShell,
  workplaceMissionControlRoute,
  workplaceRunRoute,
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

test("given_fresh_run_when_opening_workplace_then_shell_empty_states_and_nav_order_converge", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("conv-fresh");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);
  testInfo.annotations.push({
    type: "fixture",
    description: `${identity.tenantId}/${identity.simulationRunId}`,
  });

  page.on("pageerror", (error) => {
    throw error;
  });

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });

  await page.goto(workplaceRunRoute(identity.simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Mission Control$/i }),
  ).toBeVisible({ timeout: 15_000 });
  await expectWorkplaceNavDestinations(page);

  for (const surface of CONVERGENCE_SHELL_ROUTES) {
    await openShellSurface(page, identity.simulationRunId, surface.label);
    await expect(page.getByTestId("workplace-run-id")).toContainText(
      identity.simulationRunId,
    );
    await assertNoHiddenOperationalLeakage(page);
  }

  expect([...CONVERGENCE_SHELL_NAV_ORDER]).toHaveLength(14);
});

test("given_unified_authoritative_state_when_walking_workplace_then_all_surfaces_converge", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("conv-unified");
  await createDecisionLifecycleFixture(identity, {
    capabilities: [
      "simulation.run.view",
      "simulation.run.start",
      "simulation.projection.ops",
    ],
  });
  const token = await createE2eAccessToken(identity);
  testInfo.annotations.push({
    type: "fixture",
    description: `${identity.tenantId}/${identity.simulationRunId}`,
  });

  page.on("pageerror", (error) => {
    throw error;
  });

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });

  // Decision → Inbox + Decision Log + Mission Control
  await page.goto(workplaceMissionControlRoute(identity.simulationRunId));
  await page.getByRole("link", { name: /Scaffold Decision/i }).click();
  await expect(page.getByRole("heading", { name: /^Decision$/i })).toBeVisible({
    timeout: 15_000,
  });
  await waitForCurrentProjection(page);
  await selectBalancedOption(page);
  await enterRationale(page, "Unified workplace convergence rationale.");
  await reviewAndSubmit(page);
  await waitForResolvedPhase(page);
  await convergeRelay(identity.tenantId);

  const seeded = await seedUnifiedWorkplaceState(identity, {
    scheduleMeetingViaE2e,
    initializeStakeholderViaE2e,
    initializeDocumentViaE2e,
    initializeNotificationViaE2e,
    initializeActivityViaE2e,
    completeActivityViaE2e,
  });

  // API convergence checks
  const inbox = await fetchInbox(token, identity.simulationRunId);
  expect(inbox.data.messages.length).toBeGreaterThanOrEqual(1);
  expect(JSON.stringify(inbox)).not.toContain("semanticHash");

  const meetings = await fetchMeetings(token, identity.simulationRunId);
  expect(
    meetings.data.meetings.some((m) => m.title === "Convergence kickoff"),
  ).toBe(true);

  const activities = await fetchActivities(token, identity.simulationRunId);
  expect(
    activities.data.activities.some(
      (item) => item.activityId === seeded.activeActivityId,
    ),
  ).toBe(true);
  expect(
    activities.data.activities.some(
      (item) => item.activityId === seeded.completedActivityId,
    ),
  ).toBe(false);

  const history = await fetchCompletedHistory(token, identity.simulationRunId);
  expect(
    history.data.items.some(
      (item) => item.activityId === seeded.completedActivityId,
    ),
  ).toBe(true);
  expect(
    history.data.items.some(
      (item) => item.activityId === seeded.activeActivityId,
    ),
  ).toBe(false);

  // Walk full nav order and assert learner-visible content
  await page.goto(workplaceMissionControlRoute(identity.simulationRunId));
  await expectWorkplaceShell(page);
  await walkWorkplaceNavigationOrder(page);

  await openShellSurface(page, identity.simulationRunId, "Inbox");
  await expect(page.getByTestId("inbox-message").first()).toBeVisible();

  await openShellSurface(page, identity.simulationRunId, "Meetings");
  await expect(page.getByTestId("meetings-item").first()).toContainText(
    "Convergence kickoff",
  );

  await openShellSurface(page, identity.simulationRunId, "Stakeholders");
  await expect(
    page.getByTestId("stakeholders-list-button").first(),
  ).toContainText("Alex Sponsor");

  await openShellSurface(page, identity.simulationRunId, "Documents");
  await expect(page.getByTestId("documents-list-button").first()).toContainText(
    "Convergence brief",
  );

  await openShellSurface(page, identity.simulationRunId, "Notifications");
  await expect(page.getByTestId("notifications-item").first()).toContainText(
    "Kickoff reminder",
  );

  await openShellSurface(page, identity.simulationRunId, "Activities");
  await expect(page.getByTestId("activities-item")).toHaveCount(1);
  await expect(page.getByTestId("activities-item").first()).toContainText(
    "Prepare kickoff questions",
  );

  await openShellSurface(page, identity.simulationRunId, "Completed History");
  await expect(page.getByTestId("completed-history-item")).toHaveCount(1);
  await expect(
    page.getByTestId("completed-history-item").first(),
  ).toContainText("Read convergence brief");

  await openShellSurface(page, identity.simulationRunId, "Decision Log");
  await expect(
    page.getByTestId("dlog-entries").locator("li").first(),
  ).toBeVisible();

  // Rebuild-all (ops) then verify no drift
  const rebuild = await rebuildAllProjectionsViaOps({
    accessToken: token,
    simulationRunId: identity.simulationRunId,
  });
  expect(rebuild.status).toBe(200);
  await convergeRelay(identity.tenantId);

  await openShellSurface(page, identity.simulationRunId, "Activities");
  await expect(page.getByTestId("activities-item")).toHaveCount(1);
  await openShellSurface(page, identity.simulationRunId, "Completed History");
  await expect(page.getByTestId("completed-history-item")).toHaveCount(1);

  // Deep link + refresh
  await page.goto(
    `/app/runs/${encodeURIComponent(identity.simulationRunId)}/documents`,
  );
  await expect(
    page.getByRole("heading", { level: 1, name: /^Documents$/i }),
  ).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByTestId("documents-list-button").first()).toContainText(
    "Convergence brief",
  );
  await expect(page.getByTestId("workplace-run-id")).toContainText(
    identity.simulationRunId,
  );

  // Back / forward
  await openShellSurface(page, identity.simulationRunId, "Notifications");
  await openShellSurface(page, identity.simulationRunId, "Activities");
  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Notifications$/i }),
  ).toBeVisible({ timeout: 15_000 });
  await page.goForward();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Activities$/i }),
  ).toBeVisible({ timeout: 15_000 });

  // Learner denial on ops is not applicable here (token has ops). Wrong-tenant
  // denial covered in postgres suite; learner denial:
  const learnerIdentity = uniqueIdentity("conv-learner-deny");
  await createDecisionLifecycleFixture(learnerIdentity);
  const learnerToken = await createE2eAccessToken(learnerIdentity);
  const denied = await rebuildAllProjectionsViaOps({
    accessToken: learnerToken,
    simulationRunId: learnerIdentity.simulationRunId,
  });
  expect(denied.status).toBeGreaterThanOrEqual(403);

  // Accessibility on Activities (representative populated surface)
  await openShellSurface(page, identity.simulationRunId, "Activities");
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  await assertNoHiddenOperationalLeakage(page);

  // Cache / empty contract smoke for simulation identity projection
  const simulation = await fetchLearnerProjection({
    accessToken: token,
    simulationRunId: identity.simulationRunId,
    pathSuffix: "projection",
  });
  expect(simulation.status).toBe(200);
});

test("given_mobile_viewport_when_opening_unified_workplace_then_nav_and_content_remain_usable", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const identity = uniqueIdentity("conv-mobile");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);
  testInfo.annotations.push({
    type: "fixture",
    description: `${identity.tenantId}/${identity.simulationRunId}`,
  });

  await seedUnifiedWorkplaceState(identity, {
    scheduleMeetingViaE2e,
    initializeStakeholderViaE2e,
    initializeDocumentViaE2e,
    initializeNotificationViaE2e,
    initializeActivityViaE2e,
    completeActivityViaE2e,
  });

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });

  await openShellSurface(page, identity.simulationRunId, "Meetings");
  await expectWorkplaceNavDestinations(page);
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 1;
  });
  expect(overflow).toBe(false);
  await expect(page.getByTestId("meetings-item").first()).toBeVisible();
});
