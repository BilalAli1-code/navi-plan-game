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
  assertStakeholdersHiddenDataAbsent,
  fetchStakeholders,
  initializeStakeholderViaE2e,
  openStakeholdersPage,
  sendStakeholderMessageViaE2e,
  waitForCurrentStakeholders,
} from "./helpers/stakeholders";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceNavDestinations,
  navigateWorkplaceToMissionControl,
  navigateWorkplaceToStakeholders,
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

test("given_an_authenticated_learner_when_opening_stakeholders_then_empty_available_list_renders", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("stakeholders-empty");
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
  await openStakeholdersPage(page, identity.simulationRunId);
  await waitForCurrentStakeholders(page);
  await expectWorkplaceNavDestinations(page);

  await expect(page.getByTestId("stakeholders-empty")).toBeVisible();
  await assertStakeholdersHiddenDataAbsent(page);

  const api = await fetchStakeholders(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.projectionType).toBe("stakeholders");
  expect(api.data.projectionSchemaVersion).toBe(1);
  expect(api.data.stakeholders).toEqual([]);
  expect(api.data.summary.isEmpty).toBe(true);
  expect(JSON.stringify(api)).not.toContain("semanticHash");
  expect(JSON.stringify(api)).not.toContain("originatingCommandId");
  expect(JSON.stringify(api)).not.toContain("authorActorId");

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("given_initialize_and_messages_when_relayed_then_stakeholders_converge", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("stakeholders-conv");
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

  await openStakeholdersPage(page, identity.simulationRunId);
  await waitForCurrentStakeholders(page);
  await expect(page.getByTestId("stakeholders-empty")).toBeVisible();

  await initializeStakeholderViaE2e(identity, {
    stakeholderId: "stakeholder_1",
    displayName: "Alex Sponsor",
  });
  await initializeStakeholderViaE2e(identity, {
    stakeholderId: "stakeholder_2",
    displayName: "Blake Partner",
    roleLabel: "Delivery Partner",
  });
  await tickOutboxRelay(identity.tenantId);

  const firstMessage = await sendStakeholderMessageViaE2e(identity, {
    stakeholderId: "stakeholder_1",
    body: "Hello Alex",
    commandId: "cmd_msg_stakeholder_1_a",
  });
  await sendStakeholderMessageViaE2e(identity, {
    stakeholderId: "stakeholder_1",
    body: "Following up",
    commandId: "cmd_msg_stakeholder_1_b",
  });
  await tickOutboxRelay(identity.tenantId);

  await openStakeholdersPage(page, identity.simulationRunId);
  await waitForCurrentStakeholders(page);
  await expect(page.getByTestId("stakeholders-empty")).toHaveCount(0);

  const listButtons = page.getByTestId("stakeholders-list-button");
  await expect(listButtons).toHaveCount(2);
  await expect(listButtons.nth(0)).toContainText("Alex Sponsor");
  await expect(listButtons.nth(1)).toContainText("Blake Partner");

  await expect(page.getByTestId("stakeholders-detail")).toContainText(
    "Alex Sponsor",
  );
  await expect(page.getByTestId("stakeholders-detail")).toContainText(
    "Executive Sponsor",
  );
  await expect(page.getByTestId("stakeholders-messages")).toBeVisible();
  const messages = page.getByTestId("stakeholders-message");
  await expect(messages).toHaveCount(2);
  await expect(messages.nth(0)).toContainText("Hello Alex");
  await expect(messages.nth(0)).toContainText("You");
  await expect(messages.nth(0)).toContainText("You to stakeholder");
  await expect(messages.nth(1)).toContainText("Following up");

  await listButtons.nth(1).click();
  await expect(page.getByTestId("stakeholders-detail")).toContainText(
    "Blake Partner",
  );
  await expect(
    page.getByTestId("stakeholders-conversation-empty"),
  ).toBeVisible();

  const api = await fetchStakeholders(token, identity.simulationRunId);
  expect(api.data.stakeholders).toHaveLength(2);
  expect(api.data.stakeholders[0]?.stakeholderId).toBe("stakeholder_1");
  expect(api.data.stakeholders[0]?.initializationSequence).toBe(1);
  expect(api.data.stakeholders[1]?.stakeholderId).toBe("stakeholder_2");
  expect(api.data.stakeholders[1]?.initializationSequence).toBe(2);
  expect(api.data.stakeholders[0]?.conversation?.conversationId).toBe(
    "conversation:stakeholder_1",
  );
  expect(api.data.stakeholders[0]?.conversation?.messages).toHaveLength(2);
  expect(api.data.stakeholders[0]?.conversation?.messages[0]?.messageId).toBe(
    "stakeholder_message:cmd_msg_stakeholder_1_a",
  );
  expect(api.data.stakeholders[0]?.conversation?.messages[1]?.messageId).toBe(
    "stakeholder_message:cmd_msg_stakeholder_1_b",
  );
  expect(api.data.stakeholders[0]?.conversation?.messages[0]?.author).toEqual({
    kind: "learner",
    label: "You",
  });
  expect(api.data.stakeholders[1]?.conversation).toBeNull();
  expect(api.meta.sourceAggregateVersion).toBeGreaterThanOrEqual(
    firstMessage.aggregateVersion,
  );

  await page.reload();
  await waitForCurrentStakeholders(page);
  await expect(page.getByTestId("stakeholders-list-button")).toHaveCount(2);
  await expect(page.getByTestId("stakeholders-message")).toHaveCount(2);

  await navigateWorkplaceToMissionControl(page);
  await navigateWorkplaceToStakeholders(page);
  await waitForCurrentStakeholders(page);
  await expect(page.getByTestId("stakeholders-list-button")).toHaveCount(2);

  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Mission Control$/i }),
  ).toBeVisible({ timeout: 15_000 });
  await page.goForward();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Stakeholders$/i }),
  ).toBeVisible({ timeout: 15_000 });

  await redeliverLastOutboxEvent({
    tenantId: identity.tenantId,
    simulationRunId: identity.simulationRunId,
  });
  await openStakeholdersPage(page, identity.simulationRunId);
  await waitForCurrentStakeholders(page);
  await expect(page.getByTestId("stakeholders-list-button")).toHaveCount(2);
  await expect(page.getByTestId("stakeholders-message")).toHaveCount(2);

  await assertStakeholdersHiddenDataAbsent(page);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});

test("given_missing_projection_when_opening_stakeholders_then_query_time_rebuild_converges", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("stakeholders-rebuild");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);
  testInfo.annotations.push({
    type: "fixture",
    description: `${identity.tenantId}/${identity.simulationRunId}`,
  });

  await initializeStakeholderViaE2e(identity, {
    stakeholderId: "stakeholder_1",
    displayName: "Alex Sponsor",
  });
  await sendStakeholderMessageViaE2e(identity, {
    stakeholderId: "stakeholder_1",
    body: "Need a rebuild path",
    commandId: "cmd_msg_rebuild_1",
  });
  // Intentionally skip relay: GET/catch-up rebuilds from authoritative SimulationRun.

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openStakeholdersPage(page, identity.simulationRunId);
  await waitForCurrentStakeholders(page);
  await expect(page.getByTestId("stakeholders-list-button")).toHaveCount(1);
  await expect(page.getByTestId("stakeholders-message")).toHaveCount(1);
  await expect(page.getByTestId("stakeholders-message").first()).toContainText(
    "Need a rebuild path",
  );

  const api = await fetchStakeholders(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.stakeholders).toHaveLength(1);
  expect(api.data.stakeholders[0]?.conversation?.messages[0]?.messageId).toBe(
    "stakeholder_message:cmd_msg_rebuild_1",
  );
});
