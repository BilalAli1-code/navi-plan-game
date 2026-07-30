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
  openDecisionLogPage,
  waitForCurrentDecisionLog,
} from "./helpers/decision-log";
import {
  openMissionControlPage,
  waitForCurrentMissionControl,
} from "./helpers/mission-control";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceNavDestinations,
  expectWorkplaceShell,
  navigateWorkplaceToDecisionLog,
  navigateWorkplaceToMissionControl,
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

test("given_authenticated_learner_when_opening_workplace_surfaces_then_shell_nav_preserves_run", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("wp-nav");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);
  testInfo.annotations.push({
    type: "fixture",
    description: `${identity.tenantId}/${identity.simulationRunId}`,
  });

  page.on("pageerror", (error) => {
    throw error;
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      throw new Error(`Console error: ${message.text()}`);
    }
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
  await waitForCurrentMissionControl(page);
  await expect(page.getByTestId("workplace-run-id")).toContainText(
    identity.simulationRunId,
  );
  await expectWorkplaceNavDestinations(page);
  await expect(
    page
      .getByTestId("workplace-nav")
      .getByRole("link", { name: "Mission Control" }),
  ).toHaveAttribute("aria-current", "page");

  await navigateWorkplaceToDecisionLog(page);
  await waitForCurrentDecisionLog(page);
  await expect(page.getByTestId("workplace-run-id")).toContainText(
    identity.simulationRunId,
  );
  await expect(
    page
      .getByTestId("workplace-nav")
      .getByRole("link", { name: "Decision Log" }),
  ).toHaveAttribute("aria-current", "page");

  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Mission Control$/i }),
  ).toBeVisible({ timeout: 15_000 });
  await page.goForward();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Decision Log$/i }),
  ).toBeVisible({ timeout: 15_000 });

  await navigateWorkplaceToMissionControl(page);
  await waitForCurrentMissionControl(page);

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("given_decision_lifecycle_when_returning_through_shell_then_both_projections_converge", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("wp-conv");
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
  await expectWorkplaceShell(page);
  await waitForCurrentMissionControl(page);
  await page.getByRole("link", { name: /Scaffold Decision/i }).click();
  await expect(page.getByRole("heading", { name: /^Decision$/i })).toBeVisible({
    timeout: 15_000,
  });
  await waitForCurrentProjection(page);
  await selectBalancedOption(page);
  await enterRationale(page, "Workplace shell convergence");
  await reviewAndSubmit(page);
  await waitForResolvedPhase(page);
  await tickOutboxRelay(identity.tenantId);

  await page.getByRole("link", { name: /Back to Mission Control/i }).click();
  await expectWorkplaceShell(page);
  await expect(page.getByText(/You chose a balanced path/i)).toBeVisible({
    timeout: 20_000,
  });
  await waitForCurrentMissionControl(page);

  await navigateWorkplaceToDecisionLog(page);
  await expect(page.getByTestId("dlog-entries")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId("dlog-entries").locator("li")).toHaveCount(1);
  await waitForCurrentDecisionLog(page);
});

test("given_direct_decision_log_route_when_loaded_then_shell_wraps_surface", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("wp-dlog");
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
  await openDecisionLogPage(page, identity.simulationRunId);
  await expectWorkplaceShell(page);
  await waitForCurrentDecisionLog(page);
  await expectWorkplaceNavDestinations(page);
});
