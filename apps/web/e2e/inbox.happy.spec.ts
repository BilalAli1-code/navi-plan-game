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
  assertInboxHiddenDataAbsent,
  fetchInbox,
  openInboxPage,
  waitForCurrentInbox,
} from "./helpers/inbox";
import { openMissionControlPage } from "./helpers/mission-control";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceNavDestinations,
  navigateWorkplaceToDecisionLog,
  navigateWorkplaceToInbox,
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

test("given_an_authenticated_learner_when_opening_inbox_then_empty_available_inbox_renders", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("inbox-empty");
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
  await openInboxPage(page, identity.simulationRunId);
  await waitForCurrentInbox(page);
  await expectWorkplaceNavDestinations(page);

  await expect(page.getByTestId("inbox-empty")).toBeVisible();
  await assertInboxHiddenDataAbsent(page);

  const api = await fetchInbox(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.projectionType).toBe("inbox");
  expect(api.data.projectionSchemaVersion).toBe(1);
  expect(api.data.messages).toEqual([]);
  expect(api.data.summary).toEqual({
    totalMessages: 0,
    isEmpty: true,
    classificationCounts: {
      informational: 0,
      action_required: 0,
      decision_bearing: 0,
    },
  });
  expect(api.data.capabilities.readState).toBe("unsupported");
  expect(JSON.stringify(api)).not.toContain("semanticHash");
  expect(JSON.stringify(api)).not.toContain('"unread"');

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

test("given_a_decision_submission_when_opening_inbox_then_message_converges_without_optimism", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("inbox-conv");
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

  await openInboxPage(page, identity.simulationRunId);
  await waitForCurrentInbox(page);
  await expect(page.getByTestId("inbox-empty")).toBeVisible();
  await expect(page.getByTestId("inbox-messages")).toHaveCount(0);

  await openMissionControlPage(page, identity.simulationRunId);
  await page.getByRole("link", { name: /Scaffold Decision/i }).click();
  await expect(page.getByRole("heading", { name: /^Decision$/i })).toBeVisible({
    timeout: 15_000,
  });
  await waitForCurrentProjection(page);
  await selectBalancedOption(page);
  await enterRationale(page, "Inbox convergence rationale.");
  await reviewAndSubmit(page);
  await waitForResolvedPhase(page);
  await tickOutboxRelay(identity.tenantId);

  await openInboxPage(page, identity.simulationRunId);
  await waitForCurrentInbox(page);
  await expect(page.getByTestId("inbox-empty")).toHaveCount(0);
  const messages = page.getByTestId("inbox-message");
  await expect(messages).toHaveCount(1);
  await expect(messages.first()).toContainText("Decision recorded");
  await expect(messages.first()).toContainText("Project Office");

  await page.getByRole("button", { name: /Show message/i }).click();
  await expect(page.getByTestId("inbox-message-body")).toBeVisible();

  const api = await fetchInbox(token, identity.simulationRunId);
  expect(api.data.messages).toHaveLength(1);
  expect(api.data.summary).toEqual({
    totalMessages: 1,
    isEmpty: false,
    classificationCounts: {
      informational: 1,
      action_required: 0,
      decision_bearing: 0,
    },
  });
  expect(api.data.messages[0]?.classification).toBe("informational");
  expect(api.data.messages[0]?.messageId).toMatch(/^learner_message:/);
  expect(api.data.messages[0]?.sequence).toBe(1);
  expect(api.data.messages[0]?.subject.length).toBeGreaterThan(0);
  expect(api.data.messages[0]?.body.length).toBeGreaterThan(0);

  await page.reload();
  await waitForCurrentInbox(page);
  await expect(page.getByTestId("inbox-message")).toHaveCount(1);

  // Mission Control unread inbox count remains unavailable (read state unsupported).
  await navigateWorkplaceToMissionControl(page);
  await expect(page.getByText(/Unavailable/i).first()).toBeVisible();

  await navigateWorkplaceToInbox(page);
  await waitForCurrentInbox(page);
  await navigateWorkplaceToDecisionLog(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Decision Log$/i }),
  ).toBeVisible();

  await assertInboxHiddenDataAbsent(page);
});
