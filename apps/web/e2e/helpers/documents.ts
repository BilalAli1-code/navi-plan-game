import { expect, type Page } from "@playwright/test";
import { E2E_API_BASE_URL, E2E_SEAM_SECRET } from "./env";
import type { E2eIdentity } from "./auth";
import { expectWorkplaceShell } from "./workplace";

export const workplaceDocumentsRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/documents`;

export const openDocumentsPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceDocumentsRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Documents$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentDocuments = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("documents-freshness")).toHaveText("Current", {
    timeout: 20_000,
  });
};

export const fetchDocuments = async (
  accessToken: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly projectionType: string;
    readonly projectionSchemaVersion: number;
    readonly documents: readonly {
      readonly documentId: string;
      readonly creationSequence: number;
      readonly title: string;
      readonly category: string | null;
      readonly body: string;
      readonly status: string;
    }[];
    readonly summary: {
      readonly totalDocuments: number;
      readonly isEmpty: boolean;
    };
  };
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/documents`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": `e2e-documents-${Date.now()}`,
      },
    },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<ReturnType<typeof fetchDocuments>>;
};

export const initializeDocumentViaE2e = async (
  identity: E2eIdentity,
  input?: {
    readonly documentId?: string;
    readonly title?: string;
    readonly category?: string;
    readonly description?: string;
    readonly body?: string;
    readonly commandId?: string;
  },
): Promise<{
  readonly aggregateVersion: number;
  readonly commandId: string;
}> => {
  const documentId = input?.documentId ?? "document_1";
  const commandId = input?.commandId ?? `cmd_doc_${documentId}_${Date.now()}`;
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/e2e/commands/document`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ProjectSim-E2E-Seam": E2E_SEAM_SECRET,
      },
      body: JSON.stringify({
        tenantId: identity.tenantId,
        actorId: identity.actorId,
        simulationRunId: identity.simulationRunId,
        commandType: "InitializeDocument",
        documentId,
        commandId,
        title: input?.title ?? "Project brief",
        category: input?.category ?? "Briefing",
        description: input?.description ?? "Read before kickoff.",
        body: input?.body ?? "Line one\nLine two",
        definitionVersion: "1",
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `initializeDocumentViaE2e failed (${response.status}): ${await response.text()}`,
    );
  }
  const json = (await response.json()) as {
    data: { aggregateVersion: number; commandId: string };
  };
  return {
    aggregateVersion: json.data.aggregateVersion,
    commandId: json.data.commandId,
  };
};

export const assertDocumentsHiddenDataAbsent = async (
  page: Page,
): Promise<void> => {
  const content = await page.content();
  expect(content).not.toContain("FIXTURE_BUDGET_DELTA");
  expect(content).not.toContain("facilitator");
  expect(content).not.toContain("consequenceDefinitions");
  expect(content).not.toContain("semanticHash");
  expect(content).not.toContain("originatingCommandId");
  expect(content).not.toContain("textarea");
  expect(content).not.toMatch(/<button[^>]*>\s*(upload|edit|comment)/i);
  expect(content).not.toMatch(/edit document|add comment/i);
};
