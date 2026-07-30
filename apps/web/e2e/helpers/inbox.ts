import { expect, type Page } from "@playwright/test";
import { expectWorkplaceShell } from "./workplace";

const apiBaseUrl =
  process.env.E2E_API_BASE_URL?.trim() || "http://127.0.0.1:8787";

export const workplaceInboxRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/inbox`;

export const openInboxPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceInboxRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Inbox$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentInbox = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("inbox-freshness")).toHaveText("Current", {
    timeout: 20_000,
  });
};

export const fetchInbox = async (
  accessToken: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly projectionType: string;
    readonly projectionSchemaVersion: number;
    readonly messages: readonly {
      readonly messageId: string;
      readonly subject: string;
      readonly body: string;
      readonly sequence: number;
      readonly sender: { readonly displayName: string };
      readonly classification:
        "informational" | "action_required" | "decision_bearing";
    }[];
    readonly summary: {
      readonly totalMessages: number;
      readonly isEmpty: boolean;
      readonly classificationCounts: {
        readonly informational: number;
        readonly action_required: number;
        readonly decision_bearing: number;
      };
    };
    readonly capabilities: {
      readonly readState: string;
      readonly archive: string;
      readonly reply: string;
      readonly compose: string;
    };
  };
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
  };
}> => {
  const response = await fetch(
    `${apiBaseUrl}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/inbox`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": `e2e-inbox-${Date.now()}`,
      },
    },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<ReturnType<typeof fetchInbox>>;
};

export const assertInboxHiddenDataAbsent = async (
  page: Page,
): Promise<void> => {
  const content = await page.content();
  expect(content).not.toContain("FIXTURE_BUDGET_DELTA");
  expect(content).not.toContain("facilitator");
  expect(content).not.toContain("consequenceDefinitions");
  expect(content).not.toContain("semanticHash");
  expect(content).not.toMatch(/\bunread\b/i);
  expect(content).not.toMatch(/\barchived\b/i);
};
