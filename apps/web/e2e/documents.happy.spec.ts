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
  assertDocumentsHiddenDataAbsent,
  fetchDocuments,
  initializeDocumentViaE2e,
  openDocumentsPage,
  waitForCurrentDocuments,
} from "./helpers/documents";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceNavDestinations,
  navigateWorkplaceToDocuments,
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

test("given_an_authenticated_learner_when_opening_documents_then_empty_available_list_renders", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("documents-empty");
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
  await openDocumentsPage(page, identity.simulationRunId);
  await waitForCurrentDocuments(page);
  await expectWorkplaceNavDestinations(page);

  await expect(page.getByTestId("documents-empty")).toBeVisible();
  await assertDocumentsHiddenDataAbsent(page);

  const api = await fetchDocuments(token, identity.simulationRunId);
  expect(api.meta.freshness).toBe("current");
  expect(api.data.projectionType).toBe("documents");
  expect(api.data.projectionSchemaVersion).toBe(1);
  expect(api.data.documents).toEqual([]);
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

test("given_initialize_documents_when_relayed_then_documents_converge", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("documents-happy");
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

  await openDocumentsPage(page, identity.simulationRunId);
  await waitForCurrentDocuments(page);
  await expect(page.getByTestId("documents-empty")).toBeVisible();

  const first = await initializeDocumentViaE2e(identity, {
    documentId: "document_1",
    title: "Project brief",
    body: "Line one\nLine two",
    commandId: "cmd_doc_document_1",
  });
  await initializeDocumentViaE2e(identity, {
    documentId: "document_2",
    title: "Decision memo",
    category: "Memo",
    body: "Decision memo body",
    commandId: "cmd_doc_document_2",
  });
  await tickOutboxRelay(identity.tenantId);

  await openDocumentsPage(page, identity.simulationRunId);
  await waitForCurrentDocuments(page);
  await expect(page.getByTestId("documents-empty")).toHaveCount(0);

  const listButtons = page.getByTestId("documents-list-button");
  await expect(listButtons).toHaveCount(2);
  await expect(listButtons.nth(0)).toContainText("Project brief");
  await expect(listButtons.nth(1)).toContainText("Decision memo");

  await expect(page.getByTestId("documents-detail")).toContainText(
    "Project brief",
  );
  await expect(page.getByTestId("documents-detail")).toContainText("Briefing");
  await expect(page.getByTestId("documents-body")).toContainText("Line one");
  await expect(page.getByTestId("documents-body")).toContainText("Line two");
  await expect(page.getByTestId("documents-detail")).toContainText(
    "Upload, edit, and comments are not supported",
  );

  await listButtons.nth(1).click();
  await expect(page.getByTestId("documents-detail")).toContainText(
    "Decision memo",
  );
  await expect(page.getByTestId("documents-body")).toContainText(
    "Decision memo body",
  );

  const api = await fetchDocuments(token, identity.simulationRunId);
  expect(api.data.documents).toHaveLength(2);
  expect(api.data.documents[0]?.documentId).toBe("document_1");
  expect(api.data.documents[0]?.creationSequence).toBe(1);
  expect(api.data.documents[0]?.body).toBe("Line one\nLine two");
  expect(api.data.documents[1]?.documentId).toBe("document_2");
  expect(api.data.documents[1]?.creationSequence).toBe(2);
  expect(api.meta.sourceAggregateVersion).toBeGreaterThanOrEqual(
    first.aggregateVersion,
  );

  await page.reload();
  await waitForCurrentDocuments(page);
  await expect(page.getByTestId("documents-list-button")).toHaveCount(2);

  await navigateWorkplaceToMissionControl(page);
  await navigateWorkplaceToDocuments(page);
  await waitForCurrentDocuments(page);
  await expect(page.getByTestId("documents-list-button")).toHaveCount(2);

  await redeliverLastOutboxEvent({
    tenantId: identity.tenantId,
    simulationRunId: identity.simulationRunId,
  });
  await openDocumentsPage(page, identity.simulationRunId);
  await waitForCurrentDocuments(page);
  await expect(page.getByTestId("documents-list-button")).toHaveCount(2);

  await assertDocumentsHiddenDataAbsent(page);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
