import { expect, type Page } from "@playwright/test";
import { E2E_API_BASE_URL } from "./env";

export const decisionLogRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/decision-log`;

export const openDecisionLogPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(decisionLogRoute(simulationRunId));
  await expect(
    page.getByRole("heading", { level: 1, name: /^Decision Log$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentDecisionLog = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("dlog-freshness")).toHaveText(/Current/i, {
    timeout: 20_000,
  });
};

export const fetchDecisionLog = async (
  token: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly projectionType: string;
    readonly projectionSchemaVersion: number;
    readonly entries: readonly {
      readonly entryId: string;
      readonly title: string;
      readonly selectedOption: {
        readonly optionId: string;
        readonly label: string | null;
      };
      readonly status: string;
      readonly revealedOutcome: { readonly summary: string } | null;
    }[];
    readonly summary: {
      readonly totalEntries: number;
      readonly isEmpty: boolean;
    };
  };
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
    readonly projectionSchemaVersion: number;
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/decision-log`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Correlation-ID": `corr_dlog_${crypto.randomUUID()}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Decision Log fetch failed (${response.status}): ${await response.text()}`,
    );
  }
  return (await response.json()) as {
    readonly data: {
      readonly projectionType: string;
      readonly projectionSchemaVersion: number;
      readonly entries: readonly {
        readonly entryId: string;
        readonly title: string;
        readonly selectedOption: {
          readonly optionId: string;
          readonly label: string | null;
        };
        readonly status: string;
        readonly revealedOutcome: { readonly summary: string } | null;
      }[];
      readonly summary: {
        readonly totalEntries: number;
        readonly isEmpty: boolean;
      };
    };
    readonly meta: {
      readonly freshness: string;
      readonly sourceAggregateVersion: number;
      readonly projectionSchemaVersion: number;
    };
  };
};

export const assertDecisionLogHiddenDataAbsent = async (
  page: Page,
): Promise<void> => {
  const html = await page.content();
  const forbidden = [
    "consequenceDefinitions",
    "applicationKey",
    "resolverVersion",
    "learning_signal",
    "stakeholder_signal",
    "analytics_signal",
    "schedule_event",
    "FIXTURE_DELAYED_REVIEW",
    "qualityClassification",
    "semanticHash",
    "sourceEventId",
    "service_role",
    "event_outbox",
    "projection_event_inbox",
    "facilitator",
  ];
  for (const token of forbidden) {
    expect(html, `Decision Log must not expose ${token}`).not.toContain(token);
  }
};
