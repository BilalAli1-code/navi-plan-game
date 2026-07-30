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
  assertDecisionLogHiddenDataAbsent,
  fetchDecisionLog,
  openDecisionLogPage,
  waitForCurrentDecisionLog,
} from "./helpers/decision-log";
import { openMissionControlPage } from "./helpers/mission-control";
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

test("given_an_authenticated_learner_when_opening_decision_log_then_empty_available_log_renders", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("dlog-empty");
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
  await waitForCurrentDecisionLog(page);

  await expect(page.getByTestId("dlog-empty")).toBeVisible();
  await assertDecisionLogHiddenDataAbsent(page);

  const api = await fetchDecisionLog(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.projectionType).toBe("decision_log");
  expect(api.data.projectionSchemaVersion).toBe(1);
  expect(api.data.entries).toEqual([]);
  expect(api.data.summary).toEqual({ totalEntries: 0, isEmpty: true });
  expect(JSON.stringify(api)).not.toContain("semanticHash");
  expect(JSON.stringify(api)).not.toContain("qualityClassification");

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

test("given_a_decision_submission_when_opening_decision_log_then_entry_converges_without_optimism", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("dlog-conv");
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
  await waitForCurrentDecisionLog(page);
  await expect(page.getByTestId("dlog-empty")).toBeVisible();
  await expect(page.getByTestId("dlog-entries")).toHaveCount(0);

  await openMissionControlPage(page, identity.simulationRunId);
  await page.getByRole("link", { name: /Scaffold Decision/i }).click();
  await expect(page.getByRole("heading", { name: /^Decision$/i })).toBeVisible({
    timeout: 15_000,
  });
  await waitForCurrentProjection(page);
  await selectBalancedOption(page);
  await enterRationale(page, "Decision Log convergence");
  await reviewAndSubmit(page);
  await waitForResolvedPhase(page);
  await tickOutboxRelay(identity.tenantId);

  await page.getByRole("link", { name: /Decision Log/i }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Decision Log$/i }),
  ).toBeVisible({ timeout: 15_000 });

  await expect(page.getByTestId("dlog-entries")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByTestId("dlog-entries").locator("li")).toHaveCount(1);
  await expect(page.getByText(/You chose a balanced path/i)).toBeVisible();
  await waitForCurrentDecisionLog(page);
  await assertDecisionLogHiddenDataAbsent(page);

  const api = await fetchDecisionLog(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.entries).toHaveLength(1);
  expect(api.data.summary).toEqual({ totalEntries: 1, isEmpty: false });
  expect(api.data.entries[0]?.revealedOutcome?.summary).toMatch(
    /balanced path/i,
  );
  expect(api.data.entries[0]?.status).toBe("resolved");
});

test("given_wrong_tenant_when_requesting_decision_log_then_access_is_denied", async ({
  page,
}, testInfo) => {
  const owner = uniqueIdentity("dlog-owner");
  const other = uniqueIdentity("dlog-other");
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
  await openDecisionLogPage(page, owner.simulationRunId);
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("dlog-freshness")).toHaveCount(0);
});
