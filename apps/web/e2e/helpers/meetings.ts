import { expect, type Page } from "@playwright/test";
import { E2E_API_BASE_URL, E2E_SEAM_SECRET } from "./env";
import type { E2eIdentity } from "./auth";
import { expectWorkplaceShell } from "./workplace";

export const workplaceMeetingsRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/meetings`;

export const openMeetingsPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceMeetingsRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Meetings$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentMeetings = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("meetings-freshness")).toHaveText("Current", {
    timeout: 20_000,
  });
};

export const fetchMeetings = async (
  accessToken: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly projectionType: string;
    readonly projectionSchemaVersion: number;
    readonly meetings: readonly {
      readonly meetingOccurrenceId: string;
      readonly scheduleSequence: number;
      readonly title: string;
      readonly status: string;
    }[];
    readonly summary: {
      readonly totalMeetings: number;
      readonly upcomingCount: number;
      readonly activeCount: number;
      readonly completedCount: number;
      readonly cancelledCount: number;
      readonly isEmpty: boolean;
    };
  };
  readonly meta: {
    readonly freshness: string;
    readonly sourceAggregateVersion: number;
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/meetings`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": `e2e-meetings-${Date.now()}`,
      },
    },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<ReturnType<typeof fetchMeetings>>;
};

export const fetchMissionControl = async (
  accessToken: string,
  simulationRunId: string,
): Promise<{
  readonly data: {
    readonly counts: {
      readonly upcomingMeetings: {
        readonly availability: string;
        readonly count?: number;
        readonly reason?: string;
      };
    };
  };
}> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(simulationRunId)}/mission-control`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Correlation-ID": `e2e-mc-meetings-${Date.now()}`,
      },
    },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as Awaited<
    ReturnType<typeof fetchMissionControl>
  >;
};

export const scheduleMeetingViaE2e = async (
  identity: E2eIdentity,
  input?: {
    readonly meetingId?: string;
    readonly title?: string;
    readonly scheduledFor?: string;
  },
): Promise<{ readonly aggregateVersion: number }> => {
  const meetingId = input?.meetingId ?? "meeting_1";
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/e2e/commands/meeting`,
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
        commandType: "ScheduleMeeting",
        meetingId,
        title: input?.title ?? "Risk review",
        scheduledFor: input?.scheduledFor ?? "2026-07-27T09:00:00.000Z",
        participantIds: ["stakeholder_1"],
        agenda: "Discuss risks",
        durationMinutes: 30,
        channel: "Room A",
        location: "HQ",
        definitionVersion: "1",
        participantDisplayNames: {
          stakeholder_1: "Alex Sponsor",
        },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `scheduleMeetingViaE2e failed (${response.status}): ${await response.text()}`,
    );
  }
  const json = (await response.json()) as {
    data: { aggregateVersion: number };
  };
  return { aggregateVersion: json.data.aggregateVersion };
};

export const transitionMeetingViaE2e = async (
  identity: E2eIdentity,
  commandType:
    | "MakeMeetingAvailable"
    | "StartMeeting"
    | "CompleteMeeting"
    | "CancelMeeting",
  meetingId = "meeting_1",
): Promise<{ readonly aggregateVersion: number }> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/e2e/commands/meeting`,
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
        commandType,
        meetingId,
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `transitionMeetingViaE2e(${commandType}) failed (${response.status}): ${await response.text()}`,
    );
  }
  const json = (await response.json()) as {
    data: { aggregateVersion: number };
  };
  return { aggregateVersion: json.data.aggregateVersion };
};

export const assertMeetingsHiddenDataAbsent = async (
  page: Page,
): Promise<void> => {
  const content = await page.content();
  expect(content).not.toContain("FIXTURE_BUDGET_DELTA");
  expect(content).not.toContain("facilitator");
  expect(content).not.toContain("consequenceDefinitions");
  expect(content).not.toContain("semanticHash");
  expect(content).not.toContain("originatingCommandId");
};
