/**
 * BC-005 PATH-001..007 — Northstar Chapter One through Postgres composition.
 * Skips when DATABASE_URL is unset.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { asActorId } from "@projectsim/domain";
import {
  cleanupPostgresTenants,
  upsertPostgresMembership,
  type PostgresSimulationCommandModule,
} from "@projectsim/infrastructure";
import { createContentApiModule } from "./content-module";
import { createApiApp } from "../create-app";
import { createPostgresSimulationModuleRegistry } from "../module-registry";

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ??
  process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//postgres:postgres@");

const describeIfDb = DATABASE_URL ? describe : describe.skip;
const skipReason =
  "DATABASE_URL unavailable — BC-005 Postgres path suite skipped";

const TENANT = "tenant_bc005_pg_a";
const ACTOR = "actor_bc005_pg_a";
const RUN = "run_bc005_pg_a";

const CAPABILITIES = ["simulation.run.view", "simulation.run.start"] as const;

const DECISIONS = [
  {
    decisionId: "decision.define-objective",
    optionId: "option.objective-patient-access",
    commandId: "cmd_bc005_pg_d1",
  },
  {
    decisionId: "decision.select-delivery-approach",
    optionId: "option.delivery-hybrid",
    commandId: "cmd_bc005_pg_d2",
  },
  {
    decisionId: "decision.establish-governance",
    optionId: "option.governance-cross-functional",
    commandId: "cmd_bc005_pg_d3",
  },
] as const;

const ACTIVITY_IDS = [
  "activity.review-authorization",
  "activity.analyze-access-evidence",
  "activity.attend-kickoff",
  "activity.review-stakeholder-concerns",
  "activity.submit-chapter-one-decisions",
  "activity.chapter-one-reflection",
] as const;

const authHeader = (): string =>
  `Bearer dev.${Buffer.from(
    JSON.stringify({ tenantId: TENANT, actorId: ACTOR }),
  ).toString("base64url")}`;

const drainRelay = async (
  module: PostgresSimulationCommandModule,
  maxTicks = 60,
): Promise<void> => {
  for (let i = 0; i < maxTicks; i += 1) {
    const tick = await module.outboxRelay.tick();
    if (tick.claimed === 0) {
      break;
    }
  }
};

const postCommand = async (
  app: ReturnType<typeof createApiApp>,
  path: string,
  body: Record<string, unknown>,
  aggregateVersion: number,
) => {
  const commandId = String(body.commandId);
  return app.request(path, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotency-Key": commandId,
      "If-Match": `"${aggregateVersion}"`,
    },
    body: JSON.stringify(body),
  });
};

describeIfDb("BC-005 Chapter One Postgres path (PATH-001..007)", () => {
  if (!DATABASE_URL) {
    it(skipReason, () => {
      expect(true).toBe(true);
    });
    return;
  }

  const contentModule = createContentApiModule();
  const registry = createPostgresSimulationModuleRegistry({
    connectionString: DATABASE_URL,
    businessCaseRegistry: contentModule.registry,
  });
  const app = createApiApp({
    registry,
    contentModule,
    allowDevAuth: true,
  });

  const cleanup = async (): Promise<void> => {
    await cleanupPostgresTenants({
      adminUrl: DATABASE_ADMIN_URL,
      tenantIds: [TENANT],
    });
  };

  beforeAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
    await upsertPostgresMembership(registry.database, {
      actorId: asActorId(ACTOR),
      tenantId: TENANT,
      roles: ["learner"],
      capabilities: [...CAPABILITIES],
    });
  });

  afterAll(async () => {
    await cleanup();
    await registry.close();
  });

  it("creates, converges, completes Chapter One, and stays duplicate-free on catch-up", async () => {
    const auth = { Authorization: authHeader() };
    const services = registry.get(TENANT);
    const module = services.module as PostgresSimulationCommandModule;

    // PATH-001 — create Northstar run (practitioner)
    const created = await app.request("/api/v1/simulation-runs", {
      method: "POST",
      headers: {
        ...auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessCaseId: "northstar-connected-care",
        experienceLevel: "practitioner",
        simulationRunId: RUN,
      }),
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      data: {
        simulationRunId: string;
        contentPackageVersionId: string;
        chapterId: string;
        experienceLevel: string;
        initialized: {
          stakeholders: number;
          messages: number;
          documents: number;
          meetings: number;
          activities: number;
        };
      };
    };
    expect(createdBody.data.simulationRunId).toBe(RUN);
    expect(createdBody.data.contentPackageVersionId).toBe(
      "cpv:northstar-connected-care:1.0.0",
    );
    expect(createdBody.data.chapterId).toBe("chapter-01");
    expect(createdBody.data.experienceLevel).toBe("practitioner");
    // PATH-002 — initialization inventory present
    expect(createdBody.data.initialized.stakeholders).toBeGreaterThan(0);
    expect(createdBody.data.initialized.meetings).toBeGreaterThanOrEqual(1);
    expect(createdBody.data.initialized.activities).toBeGreaterThanOrEqual(6);
    expect(createdBody.data.initialized.documents).toBeGreaterThanOrEqual(1);
    expect(createdBody.data.initialized.messages).toBeGreaterThanOrEqual(1);

    // PATH-003 — drain relay until idle
    await drainRelay(module);

    const getJson = async (path: string) => {
      const response = await app.request(path, { headers: auth });
      expect(response.status).toBe(200);
      return response.json();
    };

    const missionControl = (await getJson(
      `/api/v1/simulation-runs/${RUN}/mission-control`,
    )) as {
      data: {
        counts: { pendingDecisions: { count: number } };
        runSummary: { currentChapterId: string | null };
      };
    };
    expect(missionControl.data.runSummary.currentChapterId).toBe("chapter-01");
    // Progressive eligibility: only the first required decision is pending initially.
    expect(
      missionControl.data.counts.pendingDecisions.count,
    ).toBeGreaterThanOrEqual(1);
    expect(
      missionControl.data.counts.pendingDecisions.count,
    ).toBeLessThanOrEqual(3);

    const inbox = (await getJson(`/api/v1/simulation-runs/${RUN}/inbox`)) as {
      data: { messages: ReadonlyArray<unknown> };
    };
    expect(inbox.data.messages.length).toBeGreaterThanOrEqual(5);

    const documents = (await getJson(
      `/api/v1/simulation-runs/${RUN}/documents`,
    )) as {
      data: { documents: ReadonlyArray<unknown> };
    };
    expect(documents.data.documents.length).toBeGreaterThanOrEqual(6);

    const stakeholders = (await getJson(
      `/api/v1/simulation-runs/${RUN}/stakeholders`,
    )) as {
      data: { stakeholders: ReadonlyArray<unknown> };
    };
    expect(stakeholders.data.stakeholders.length).toBeGreaterThan(0);

    const meetings = (await getJson(
      `/api/v1/simulation-runs/${RUN}/meetings`,
    )) as {
      data: {
        meetings: ReadonlyArray<{ status: string }>;
        summary: { completedCount: number };
      };
    };
    expect(meetings.data.meetings.length).toBeGreaterThanOrEqual(1);

    const activities = (await getJson(
      `/api/v1/simulation-runs/${RUN}/activities`,
    )) as {
      data: { activities: ReadonlyArray<unknown> };
    };
    expect(activities.data.activities.length).toBeGreaterThanOrEqual(1);

    let version = (
      (await getJson(`/api/v1/simulation-runs/${RUN}/projection`)) as {
        data: { sourceAggregateVersion: number };
      }
    ).data.sourceAggregateVersion;

    // PATH-004 — start + complete meeting
    const startMeeting = await postCommand(
      app,
      `/api/v1/simulation-runs/${RUN}/commands/start-meeting`,
      {
        commandId: "cmd_bc005_pg_start_meeting",
        commandType: "StartMeeting",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { meetingId: "meeting.program-kickoff" },
      },
      version,
    );
    expect(startMeeting.status).toBe(200);
    version = (
      (await startMeeting.json()) as { data: { aggregateVersion: number } }
    ).data.aggregateVersion;

    const completeMeeting = await postCommand(
      app,
      `/api/v1/simulation-runs/${RUN}/commands/complete-meeting`,
      {
        commandId: "cmd_bc005_pg_complete_meeting",
        commandType: "CompleteMeeting",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { meetingId: "meeting.program-kickoff" },
      },
      version,
    );
    expect(completeMeeting.status).toBe(200);
    version = (
      (await completeMeeting.json()) as { data: { aggregateVersion: number } }
    ).data.aggregateVersion;
    await drainRelay(module);

    const meetingsAfter = (await getJson(
      `/api/v1/simulation-runs/${RUN}/meetings`,
    )) as {
      data: { summary: { completedCount: number } };
    };
    expect(meetingsAfter.data.summary.completedCount).toBe(1);

    // PATH-006 — submit three decisions
    for (const decision of DECISIONS) {
      const response = await postCommand(
        app,
        `/api/v1/simulation-runs/${RUN}/commands/submit-decision`,
        {
          commandId: decision.commandId,
          commandType: "SubmitDecision",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: {
            decisionId: decision.decisionId,
            optionId: decision.optionId,
            rationale: "BC-005 Postgres path decision.",
          },
        },
        version,
      );
      expect(response.status).toBe(200);
      version = (
        (await response.json()) as { data: { aggregateVersion: number } }
      ).data.aggregateVersion;
    }
    await drainRelay(module);

    // PATH-005 — complete required activities
    for (const [index, activityId] of ACTIVITY_IDS.entries()) {
      const response = await postCommand(
        app,
        `/api/v1/simulation-runs/${RUN}/commands/complete-activity`,
        {
          commandId: `cmd_bc005_pg_a${index}`,
          commandType: "CompleteActivity",
          commandVersion: 1,
          expectedAggregateVersion: version,
          payload: { activityId },
        },
        version,
      );
      expect(response.status).toBe(200);
      version = (
        (await response.json()) as { data: { aggregateVersion: number } }
      ).data.aggregateVersion;
    }
    await drainRelay(module);

    // PATH-007 — complete chapter
    const completeChapter = await postCommand(
      app,
      `/api/v1/simulation-runs/${RUN}/commands/complete-chapter`,
      {
        commandId: "cmd_bc005_pg_complete_chapter",
        commandType: "CompleteChapter",
        commandVersion: 1,
        expectedAggregateVersion: version,
        payload: { chapterId: "chapter-01" },
      },
      version,
    );
    expect(completeChapter.status).toBe(200);
    const completeBody = (await completeChapter.json()) as {
      data: { endingNotificationId: string | null };
    };
    expect(completeBody.data.endingNotificationId).toBe(
      "notification.chapter-01-complete",
    );
    await drainRelay(module);

    const notifications = (await getJson(
      `/api/v1/simulation-runs/${RUN}/notifications`,
    )) as {
      data: { notifications: ReadonlyArray<{ notificationId: string }> };
    };
    expect(
      notifications.data.notifications.filter(
        (n) => n.notificationId === "notification.chapter-01-complete",
      ),
    ).toHaveLength(1);

    const decisionLog = (await getJson(
      `/api/v1/simulation-runs/${RUN}/decision-log`,
    )) as {
      data: {
        entries: ReadonlyArray<{ decisionDefinitionId: string }>;
        summary: { totalEntries: number };
      };
    };
    expect(decisionLog.data.summary.totalEntries).toBe(3);
    expect(
      new Set(decisionLog.data.entries.map((e) => e.decisionDefinitionId)).size,
    ).toBe(3);

    const finalMc = (await getJson(
      `/api/v1/simulation-runs/${RUN}/mission-control`,
    )) as {
      data: {
        counts: { pendingDecisions: { count: number } };
        runSummary: { currentChapterId: string | null };
      };
    };
    // After Chapter One completion, Chapter Two is initialized (BC-006 W7).
    expect(finalMc.data.counts.pendingDecisions.count).toBeGreaterThan(0);
    expect(finalMc.data.runSummary.currentChapterId).toBe("chapter-02");

    // PATH-008/009 style — catch-up GET / rebuild still same counts
    const snapshot = {
      pendingDecisions: finalMc.data.counts.pendingDecisions.count,
      decisionEntries: decisionLog.data.summary.totalEntries,
      endingNotifications: notifications.data.notifications.filter(
        (n) => n.notificationId === "notification.chapter-01-complete",
      ).length,
      completedMeetings: meetingsAfter.data.summary.completedCount,
    };

    await drainRelay(module);

    const mcAgain = (await getJson(
      `/api/v1/simulation-runs/${RUN}/mission-control`,
    )) as {
      data: { counts: { pendingDecisions: { count: number } } };
    };
    const logAgain = (await getJson(
      `/api/v1/simulation-runs/${RUN}/decision-log`,
    )) as {
      data: { summary: { totalEntries: number } };
    };
    const notesAgain = (await getJson(
      `/api/v1/simulation-runs/${RUN}/notifications`,
    )) as {
      data: { notifications: ReadonlyArray<{ notificationId: string }> };
    };

    expect(mcAgain.data.counts.pendingDecisions.count).toBe(
      snapshot.pendingDecisions,
    );
    expect(logAgain.data.summary.totalEntries).toBe(snapshot.decisionEntries);
    expect(
      notesAgain.data.notifications.filter(
        (n) => n.notificationId === "notification.chapter-01-complete",
      ),
    ).toHaveLength(snapshot.endingNotifications);
  }, 60_000);
});

if (!DATABASE_URL) {
  describe("BC-005 Chapter One Postgres path (skipped)", () => {
    it(skipReason, () => {
      expect(DATABASE_URL).toBeFalsy();
    });
  });
}
