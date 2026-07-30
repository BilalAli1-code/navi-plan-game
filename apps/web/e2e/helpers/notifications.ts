import { expect, type Page } from "@playwright/test";
import { E2E_API_BASE_URL, E2E_SEAM_SECRET } from "./env";
import type { E2eIdentity } from "./auth";
import { expectWorkplaceShell } from "./workplace";

export const workplaceNotificationsRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/notifications`;

export const openNotificationsPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceNotificationsRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Notifications$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentNotifications = async (
  page: Page,
): Promise<void> => {
  await expect(page.getByTestId("notifications-freshness")).toHaveText(
    "Current",
    { timeout: 20_000 },
  );
};

export const fetchNotifications = async (
  accessToken: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly projectionType: string;
    readonly projectionSchemaVersion: number;
    readonly notifications: readonly {
      readonly notificationId: string;
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
      readonly totalNotifications: number;
      readonly isEmpty: boolean;
    };
  };
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/notifications`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": `e2e-notifications-${Date.now()}`,
      },
    },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<
    ReturnType<typeof fetchNotifications>
  >;
};

export const initializeNotificationViaE2e = async (
  identity: E2eIdentity,
  input?: {
    readonly notificationId?: string;
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
  const notificationId = input?.notificationId ?? "notification_1";
  const commandId =
    input?.commandId ?? `cmd_notification_${notificationId}_${Date.now()}`;
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/e2e/commands/notification`,
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
        commandType: "InitializeNotification",
        notificationId,
        commandId,
        title: input?.title ?? "Simulation milestone reached",
        summary:
          input?.summary ?? "Your simulation has reached a key milestone.",
        body: input?.body ?? null,
        sourceKind: input?.sourceKind ?? "simulation",
        sourceId: input?.sourceId ?? null,
        sourceReason: input?.sourceReason ?? null,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `initializeNotificationViaE2e failed (${response.status}): ${await response.text()}`,
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

export const assertNotificationsHiddenDataAbsent = async (
  page: Page,
): Promise<void> => {
  const content = await page.content();
  expect(content).not.toContain("semanticHash");
  expect(content).not.toContain("originatingCommandId");
  expect(content).not.toContain("consequenceDefinitions");
  expect(content).not.toContain("FIXTURE_BUDGET_DELTA");
};
