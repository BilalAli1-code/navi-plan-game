import { expect, type Page } from "@playwright/test";
import { E2E_API_BASE_URL, E2E_SEAM_SECRET } from "./env";
import type { E2eIdentity } from "./auth";
import { expectWorkplaceShell } from "./workplace";

export const workplaceActivitiesRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/activities`;

export const workplaceCompletedHistoryRoute = (
  simulationRunId: string,
): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/completed-history`;

export const openActivitiesPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceActivitiesRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Activities$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const openCompletedHistoryPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceCompletedHistoryRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Completed History$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentActivities = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("activities-freshness")).toHaveText("Current", {
    timeout: 20_000,
  });
};

export const waitForCurrentCompletedHistory = async (
  page: Page,
): Promise<void> => {
  await expect(page.getByTestId("completed-history-freshness")).toHaveText(
    "Current",
    { timeout: 20_000 },
  );
};

export const fetchActivities = async (
  accessToken: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly projectionType: string;
    readonly projectionSchemaVersion: number;
    readonly activities: readonly {
      readonly activityId: string;
      readonly creationSequence: number;
      readonly title: string;
      readonly summary: string;
      readonly body: string | null;
      readonly source: {
        readonly kind: string;
        readonly sourceId: string | null;
        readonly reason: string | null;
      };
      readonly status: string;
      readonly createdAt: string;
    }[];
    readonly summary: {
      readonly totalActivities: number;
      readonly isEmpty: boolean;
    };
  };
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/activities`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": `e2e-activities-${Date.now()}`,
      },
    },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<ReturnType<typeof fetchActivities>>;
};

export const fetchCompletedHistory = async (
  accessToken: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly projectionType: string;
    readonly projectionSchemaVersion: number;
    readonly items: readonly {
      readonly activityId: string;
      readonly creationSequence: number;
      readonly completionSequence: number;
      readonly title: string;
      readonly summary: string;
      readonly body: string | null;
      readonly source: {
        readonly kind: string;
        readonly sourceId: string | null;
        readonly reason: string | null;
      };
      readonly status: string;
      readonly createdAt: string;
      readonly completedAt: string;
    }[];
    readonly summary: {
      readonly totalCompleted: number;
      readonly isEmpty: boolean;
    };
  };
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/completed-history`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": `e2e-completed-history-${Date.now()}`,
      },
    },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<
    ReturnType<typeof fetchCompletedHistory>
  >;
};

export const initializeActivityViaE2e = async (
  identity: E2eIdentity,
  input?: {
    readonly activityId?: string;
    readonly title?: string;
    readonly summary?: string;
    readonly body?: string;
    readonly sourceKind?: string;
    readonly sourceId?: string;
    readonly sourceReason?: string;
    readonly commandId?: string;
  },
): Promise<{
  readonly aggregateVersion: number;
  readonly commandId: string;
}> => {
  const activityId = input?.activityId ?? "activity_1";
  const commandId =
    input?.commandId ?? `cmd_activity_${activityId}_${Date.now()}`;
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/e2e/commands/activity`,
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
        commandType: "InitializeActivity",
        activityId,
        commandId,
        title: input?.title ?? "Review project scope",
        summary:
          input?.summary ?? "Review and confirm the project scope document.",
        body: input?.body ?? null,
        sourceKind: input?.sourceKind ?? "simulation",
        sourceId: input?.sourceId ?? null,
        sourceReason: input?.sourceReason ?? null,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `initializeActivityViaE2e failed (${response.status}): ${await response.text()}`,
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

export const completeActivityViaE2e = async (
  identity: E2eIdentity,
  input: {
    readonly activityId: string;
    readonly commandId?: string;
  },
): Promise<{
  readonly aggregateVersion: number;
  readonly commandId: string;
}> => {
  const commandId =
    input.commandId ??
    `cmd_activity_complete_${input.activityId}_${Date.now()}`;
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/e2e/commands/activity/complete`,
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
        activityId: input.activityId,
        commandId,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `completeActivityViaE2e failed (${response.status}): ${await response.text()}`,
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

export const assertActivitiesHiddenDataAbsent = async (
  page: Page,
): Promise<void> => {
  const content = await page.content();
  expect(content).not.toContain("semanticHash");
  expect(content).not.toContain("completingCommandId");
  expect(content).not.toContain("originatingCommandId");
};
