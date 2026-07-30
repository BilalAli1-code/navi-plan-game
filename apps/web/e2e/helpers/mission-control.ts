import { expect, type Page } from "@playwright/test";
import { E2E_API_BASE_URL } from "./env";

export const missionControlRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/mission-control`;

export const openMissionControlPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(missionControlRoute(simulationRunId));
  await expect(
    page.getByRole("heading", { level: 1, name: /^Mission Control$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentMissionControl = async (
  page: Page,
): Promise<void> => {
  await expect(page.getByTestId("mc-freshness")).toHaveText(/Current/i, {
    timeout: 20_000,
  });
  await expect(
    page.getByText("Pending decisions", { exact: true }),
  ).toBeVisible();
};

export const fetchMissionControl = async (
  token: string,
  simulationRunId: string,
): Promise<{
  readonly data: Record<string, unknown>;
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
    readonly projectionSchemaVersion: number;
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/mission-control`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Correlation-ID": `corr_mc_${crypto.randomUUID()}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Mission Control fetch failed (${response.status}): ${await response.text()}`,
    );
  }
  return (await response.json()) as {
    readonly data: Record<string, unknown>;
    readonly meta: {
      readonly freshness: string;
      readonly sourceAggregateVersion: number;
      readonly projectionSchemaVersion: number;
    };
  };
};

export const assertMissionControlHiddenDataAbsent = async (
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
    "semanticHash",
    "sourceEventId",
    "service_role",
    "event_outbox",
    "projection_event_inbox",
    "facilitator",
  ];
  for (const token of forbidden) {
    expect(html, `Mission Control must not expose ${token}`).not.toContain(
      token,
    );
  }
};
