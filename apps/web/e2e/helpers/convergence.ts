/**
 * PS-ROADMAP-024 — Unified Workplace Convergence Suite helpers (Playwright).
 *
 * Composable helpers for production-like API + relay-tick + browser assertion.
 * Does not start a continuous worker process; uses the E2E relay tick seam.
 */
import { expect, type Page } from "@playwright/test";
import { E2E_API_BASE_URL, E2E_SEAM_SECRET } from "./env";
import type { E2eIdentity } from "./auth";
import { tickOutboxRelay } from "./api";
import {
  expectWorkplaceNavDestinations,
  expectWorkplaceShell,
  navigateWorkplaceToActivities,
  navigateWorkplaceToCompletedHistory,
  navigateWorkplaceToDecisionLog,
  navigateWorkplaceToDocuments,
  navigateWorkplaceToInbox,
  navigateWorkplaceToMeetings,
  navigateWorkplaceToMissionControl,
  navigateWorkplaceToNotifications,
  navigateWorkplaceToStakeholders,
  workplaceDecisionLogRoute,
  workplaceDocumentsRoute,
  workplaceInboxRoute,
  workplaceMeetingsRoute,
  workplaceMissionControlRoute,
  workplaceNotificationsRoute,
  workplacePerformanceRoute,
  workplaceProgressRoute,
  workplaceAchievementsRoute,
  workplaceMasteryRoute,
  workplaceCoachingRoute,
  workplaceStakeholdersRoute,
} from "./workplace";
import { waitForCurrentMissionControl } from "./mission-control";
import { waitForCurrentInbox } from "./inbox";
import { waitForCurrentMeetings } from "./meetings";
import { waitForCurrentStakeholders } from "./stakeholders";
import { waitForCurrentDocuments } from "./documents";
import { waitForCurrentNotifications } from "./notifications";
import {
  waitForCurrentActivities,
  waitForCurrentCompletedHistory,
  workplaceActivitiesRoute,
  workplaceCompletedHistoryRoute,
} from "./activities";
import { waitForCurrentDecisionLog } from "./decision-log";
import { waitForCurrentPerformance } from "./performance";
import { waitForCurrentLearnerProgression } from "./learner-progression";
import { waitForCurrentAchievements } from "./achievements";
import { waitForCurrentMastery } from "./mastery";
import { waitForCurrentCoaching } from "./coaching";

/** Product shell navigation order (must match WorkplaceShell). */
export const CONVERGENCE_SHELL_NAV_ORDER = [
  "Mission Control",
  "Inbox",
  "Meetings",
  "Stakeholders",
  "Documents",
  "Notifications",
  "Activities",
  "Completed History",
  "Decision Log",
  "Performance",
  "Progress",
  "Achievements",
  "Mastery",
  "Coaching",
] as const;

export const CONVERGENCE_SHELL_ROUTES = [
  {
    label: "Mission Control",
    route: workplaceMissionControlRoute,
    heading: /^Mission Control$/i,
    wait: waitForCurrentMissionControl,
  },
  {
    label: "Inbox",
    route: workplaceInboxRoute,
    heading: /^Inbox$/i,
    wait: waitForCurrentInbox,
  },
  {
    label: "Meetings",
    route: workplaceMeetingsRoute,
    heading: /^Meetings$/i,
    wait: waitForCurrentMeetings,
  },
  {
    label: "Stakeholders",
    route: workplaceStakeholdersRoute,
    heading: /^Stakeholders$/i,
    wait: waitForCurrentStakeholders,
  },
  {
    label: "Documents",
    route: workplaceDocumentsRoute,
    heading: /^Documents$/i,
    wait: waitForCurrentDocuments,
  },
  {
    label: "Notifications",
    route: workplaceNotificationsRoute,
    heading: /^Notifications$/i,
    wait: waitForCurrentNotifications,
  },
  {
    label: "Activities",
    route: workplaceActivitiesRoute,
    heading: /^Activities$/i,
    wait: waitForCurrentActivities,
  },
  {
    label: "Completed History",
    route: workplaceCompletedHistoryRoute,
    heading: /^Completed History$/i,
    wait: waitForCurrentCompletedHistory,
  },
  {
    label: "Decision Log",
    route: workplaceDecisionLogRoute,
    heading: /^Decision Log$/i,
    wait: waitForCurrentDecisionLog,
  },
  {
    label: "Performance",
    route: workplacePerformanceRoute,
    heading: /^Performance$/i,
    wait: waitForCurrentPerformance,
  },
  {
    label: "Progress",
    route: workplaceProgressRoute,
    heading: /^Progress$/i,
    wait: waitForCurrentLearnerProgression,
  },
  {
    label: "Achievements",
    route: workplaceAchievementsRoute,
    heading: /^Achievements$/i,
    wait: waitForCurrentAchievements,
  },
  {
    label: "Mastery",
    route: workplaceMasteryRoute,
    heading: /^Mastery$/i,
    wait: waitForCurrentMastery,
  },
  {
    label: "Coaching",
    route: workplaceCoachingRoute,
    heading: /^Coaching$/i,
    wait: waitForCurrentCoaching,
  },
] as const;

/**
 * Bounded relay drain via E2E tick seam (no arbitrary sleep).
 * Stops when a tick claims nothing or maxTicks reached.
 */
export const drainRelayUntilIdle = async (
  tenantId: string,
  maxTicks = 30,
): Promise<{ readonly ticks: number }> => {
  let ticks = 0;
  for (let i = 0; i < maxTicks; i += 1) {
    ticks += 1;
    const response = await fetch(`${E2E_API_BASE_URL}/api/v1/e2e/relay/tick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ProjectSim-E2E-Seam": E2E_SEAM_SECRET,
      },
      body: JSON.stringify({ tenantId }),
    });
    if (!response.ok) {
      throw new Error(
        `Relay tick failed (${response.status}): ${await response.text()}`,
      );
    }
    const json = (await response.json()) as {
      data?: { claimed?: number; published?: number };
    };
    const claimed = json.data?.claimed ?? 0;
    if (claimed === 0) {
      break;
    }
  }
  return { ticks };
};

/** Prefer drainRelayUntilIdle; thin wrapper retained for call-site clarity. */
export const convergeRelay = async (tenantId: string): Promise<void> => {
  await drainRelayUntilIdle(tenantId);
  // One extra tick after idle is a no-op safety for late materialization.
  await tickOutboxRelay(tenantId);
};

export const eventually = async <T>(
  label: string,
  probe: () => Promise<T>,
  predicate: (value: T) => boolean,
  options?: {
    readonly timeoutMs?: number;
    readonly intervalMs?: number;
  },
): Promise<T> => {
  const timeoutMs = options?.timeoutMs ?? 20_000;
  const intervalMs = options?.intervalMs ?? 200;
  const started = Date.now();
  let last: T | undefined;
  let attempts = 0;
  while (Date.now() - started < timeoutMs) {
    attempts += 1;
    last = await probe();
    if (predicate(last)) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(
    `eventually(${label}) timed out after ${timeoutMs}ms ` +
      `(attempts=${attempts}, last=${JSON.stringify(last)})`,
  );
};

export const fetchLearnerProjection = async (input: {
  readonly accessToken: string;
  readonly simulationRunId: string;
  readonly pathSuffix: string;
}): Promise<{ status: number; body: unknown }> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/simulation-runs/${encodeURIComponent(input.simulationRunId)}/${input.pathSuffix}`,
    {
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "X-Correlation-ID": `e2e-conv-${input.pathSuffix}-${Date.now()}`,
      },
    },
  );
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
};

export const rebuildAllProjectionsViaOps = async (input: {
  readonly accessToken: string;
  readonly simulationRunId: string;
}): Promise<{ status: number; body: unknown }> => {
  const response = await fetch(
    `${E2E_API_BASE_URL}/api/v1/internal/projection-operations/simulation-runs/${encodeURIComponent(input.simulationRunId)}/projections/rebuild-all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "X-Correlation-ID": `e2e-rebuild-all-${Date.now()}`,
      },
      body: JSON.stringify({
        correlationId: `e2e-rebuild-all-${Date.now()}`,
      }),
    },
  );
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
};

export const assertNoHiddenOperationalLeakage = async (
  page: Page,
): Promise<void> => {
  const content = await page.content();
  for (const needle of [
    "semanticHash",
    "projection_processing_target",
    "claimedBy",
    "claimExpiresAt",
    "nextAttemptAt",
    "completingCommandId",
    "originatingCommandId",
    "consequenceDefinitions",
    "facilitator",
    "FIXTURE_BUDGET_DELTA",
    "DATABASE_URL",
    "Bearer ",
  ]) {
    expect(content, `leakage:${needle}`).not.toContain(needle);
  }
};

export const openShellSurface = async (
  page: Page,
  simulationRunId: string,
  label: (typeof CONVERGENCE_SHELL_NAV_ORDER)[number],
): Promise<void> => {
  const surface = CONVERGENCE_SHELL_ROUTES.find(
    (entry) => entry.label === label,
  );
  if (!surface) {
    throw new Error(`Unknown shell surface: ${label}`);
  }
  await page.goto(surface.route(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: surface.heading }),
  ).toBeVisible({ timeout: 15_000 });
  await surface.wait(page);
};

export const walkWorkplaceNavigationOrder = async (
  page: Page,
): Promise<void> => {
  await expectWorkplaceNavDestinations(page);
  await navigateWorkplaceToMissionControl(page);
  await navigateWorkplaceToInbox(page);
  await navigateWorkplaceToMeetings(page);
  await navigateWorkplaceToStakeholders(page);
  await navigateWorkplaceToDocuments(page);
  await navigateWorkplaceToNotifications(page);
  await navigateWorkplaceToActivities(page);
  await navigateWorkplaceToCompletedHistory(page);
  await navigateWorkplaceToDecisionLog(page);
};

export const seedUnifiedWorkplaceState = async (
  identity: E2eIdentity,
  helpers: {
    readonly scheduleMeetingViaE2e: typeof import("./meetings").scheduleMeetingViaE2e;
    readonly initializeStakeholderViaE2e: typeof import("./stakeholders").initializeStakeholderViaE2e;
    readonly initializeDocumentViaE2e: typeof import("./documents").initializeDocumentViaE2e;
    readonly initializeNotificationViaE2e: typeof import("./notifications").initializeNotificationViaE2e;
    readonly initializeActivityViaE2e: typeof import("./activities").initializeActivityViaE2e;
    readonly completeActivityViaE2e: typeof import("./activities").completeActivityViaE2e;
  },
): Promise<{
  readonly activeActivityId: string;
  readonly completedActivityId: string;
  readonly meetingId: string;
  readonly documentId: string;
  readonly notificationId: string;
  readonly stakeholderId: string;
}> => {
  const meetingId = "meeting_conv_1";
  const stakeholderId = "stakeholder_conv_1";
  const documentId = "document_conv_1";
  const notificationId = "notification_conv_1";
  const activeActivityId = "activity_conv_active";
  const completedActivityId = "activity_conv_done";

  await helpers.scheduleMeetingViaE2e(identity, {
    meetingId,
    title: "Convergence kickoff",
    scheduledFor: "2026-07-27T09:00:00.000Z",
  });
  await helpers.initializeStakeholderViaE2e(identity, {
    stakeholderId,
    displayName: "Alex Sponsor",
    roleLabel: "Executive Sponsor",
  });
  await helpers.initializeDocumentViaE2e(identity, {
    documentId,
    title: "Convergence brief",
    body: "Learner-safe brief for the unified journey.",
  });
  await helpers.initializeNotificationViaE2e(identity, {
    notificationId,
    title: "Kickoff reminder",
    summary: "Confirm attendance for the convergence kickoff.",
  });
  await helpers.initializeActivityViaE2e(identity, {
    activityId: completedActivityId,
    title: "Read convergence brief",
    summary: "Read the brief before kickoff.",
    commandId: "cmd_conv_activity_done",
  });
  await helpers.initializeActivityViaE2e(identity, {
    activityId: activeActivityId,
    title: "Prepare kickoff questions",
    summary: "Prepare questions for the sponsor.",
    commandId: "cmd_conv_activity_active",
  });
  await helpers.completeActivityViaE2e(identity, {
    activityId: completedActivityId,
    commandId: "cmd_conv_complete_done",
  });
  await convergeRelay(identity.tenantId);

  return {
    activeActivityId,
    completedActivityId,
    meetingId,
    documentId,
    notificationId,
    stakeholderId,
  };
};
