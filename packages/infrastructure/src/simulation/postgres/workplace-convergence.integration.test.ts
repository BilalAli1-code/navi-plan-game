/**
 * PS-ROADMAP-024 — Unified Workplace Convergence Suite (PostgreSQL).
 *
 * Proves Domain → outbox → production relay path → projections → GET catch-up /
 * rebuild / retained-target replay under real PostgreSQL + RLS, without adding
 * product behavior.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import {
  asActivityId,
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asDocumentId,
  asIsoTimestamp,
  asLearnerId,
  asMeetingId,
  asNotificationId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  createScaffoldDecisionDefinition,
  isAccepted,
  type CompleteActivityCommand,
  type DecisionDefinition,
  type InitializeActivityCommand,
  type InitializeDocumentCommand,
  type InitializeNotificationCommand,
  type InitializeStakeholderCommand,
  type ScheduleMeetingCommand,
  type SubmitDecisionCommand,
  ACTIVITIES_PROJECTION_TYPE,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  WORKPLACE_PROJECTION_TYPES,
} from "@projectsim/domain";
import {
  evaluateWorkplaceConvergenceCompleteness,
  WORKPLACE_CONVERGENCE_MANIFEST,
} from "@projectsim/application";
import { createInMemoryMembershipStore } from "../authorization/membership";
import { createInMemoryDecisionDefinitionProvider } from "../decision-definition-provider";
import {
  createInMemoryDecisionProjectionContentProvider,
  createScaffoldProjectionContentRecord,
} from "../projection/projection-content-provider";
import {
  createInMemoryLearningProjectionContentProvider,
  createScaffoldLearningContentRecord,
} from "../projection/learning-projection-content-provider";
import { createPostgresDatabase } from "./database";
import {
  createPostgresSimulationCommandModule,
  type PostgresSimulationCommandModule,
} from "./postgres-composition-root";
import { deletePostgresTenantsRows } from "./test-db-cleanup";

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
const describeIf =
  DATABASE_URL && DATABASE_ADMIN_URL ? describe : describe.skip;

const TENANT_A = "tenant_ps024_a";
const TENANT_B = "tenant_ps024_b";
const ACTOR_A = "actor_ps024_a";
const ACTOR_B = "actor_ps024_b";
const RUN_A = "run_ps024_a";
const contentPackageVersionId = asContentPackageVersionId("cpv_1");

const OPS_CAPS = [
  "simulation.run.view",
  "simulation.run.start",
  "simulation.projection.ops",
] as const;

const LEARNER_CAPS = ["simulation.run.view", "simulation.run.start"] as const;

const definition: DecisionDefinition = createScaffoldDecisionDefinition({
  id: asDecisionId("decision_1"),
  contentPackageVersionId,
});

const drainRelay = async (
  module: PostgresSimulationCommandModule,
  maxTicks = 40,
): Promise<{ published: number; claimed: number }> => {
  let published = 0;
  let claimed = 0;
  for (let i = 0; i < maxTicks; i += 1) {
    const tick = await module.outboxRelay.tick();
    published += tick.published;
    claimed += tick.claimed;
    if (tick.claimed === 0) {
      break;
    }
  }
  return { published, claimed };
};

const countProjection = async (
  admin: pg.Client,
  input: {
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly projectionType: string;
  },
): Promise<number> => {
  const result = await admin.query<{ n: number }>(
    `select count(*)::int as n
       from simulation_projection
      where tenant_id = $1
        and simulation_run_id = $2
        and projection_type = $3`,
    [input.tenantId, input.simulationRunId, input.projectionType],
  );
  return result.rows[0]?.n ?? 0;
};

const projectionHash = async (
  admin: pg.Client,
  input: {
    readonly tenantId: string;
    readonly simulationRunId: string;
    readonly projectionType: string;
  },
): Promise<string | null> => {
  const result = await admin.query<{ projection_hash: string }>(
    `select projection_hash
       from simulation_projection
      where tenant_id = $1
        and simulation_run_id = $2
        and projection_type = $3`,
    [input.tenantId, input.simulationRunId, input.projectionType],
  );
  return result.rows[0]?.projection_hash ?? null;
};

const opsActor = (
  actorId: string,
  tenantId: string,
  caps: readonly string[],
) => ({
  actorId: asActorId(actorId),
  tenantId: asTenantId(tenantId),
  capabilities: [...caps],
});

describeIf("PS-024 workplace convergence (postgres)", () => {
  let admin: pg.Client;

  beforeAll(async () => {
    admin = new pg.Client({ connectionString: DATABASE_ADMIN_URL });
    await admin.connect();
  });

  afterAll(async () => {
    await admin.end();
  });

  beforeEach(async () => {
    await deletePostgresTenantsRows(admin, [TENANT_A, TENANT_B]);
    await admin.query(
      `insert into tenant_memberships (tenant_id, actor_id, roles, capabilities)
       values ($1, $2, $3, $4), ($5, $6, $7, $8)`,
      [
        TENANT_A,
        ACTOR_A,
        ["operator"],
        [...OPS_CAPS],
        TENANT_B,
        ACTOR_B,
        ["learner"],
        [...LEARNER_CAPS],
      ],
    );
  });

  const openModule = (
    tenantId: string,
    actorId: string,
    caps: readonly string[],
  ) =>
    createPostgresSimulationCommandModule({
      database: createPostgresDatabase({ connectionString: DATABASE_URL! }),
      tenantId,
      membershipStore: createInMemoryMembershipStore([
        {
          actorId: asActorId(actorId),
          tenantId,
          roles: caps.includes("simulation.projection.ops")
            ? ["operator"]
            : ["learner"],
          capabilities: [...caps],
        },
      ]),
      decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
        { tenantId: asTenantId(tenantId), definition },
      ]),
      projectionContentProvider:
        createInMemoryDecisionProjectionContentProvider([
          createScaffoldProjectionContentRecord({
            tenantId: asTenantId(tenantId),
            contentPackageVersionId,
            decisionId: asDecisionId("decision_1"),
          }),
        ]),
      learningContentProvider: createInMemoryLearningProjectionContentProvider([
        createScaffoldLearningContentRecord({
          tenantId: asTenantId(tenantId),
          contentPackageVersionId,
        }),
      ]),
      relayWorkerId: `ps024-${tenantId}`,
    });

  const seedRun = async (
    module: PostgresSimulationCommandModule,
    runId: string,
    actorId: string,
  ): Promise<void> => {
    const created = await module.lifecycleService.create({
      simulationRunId: asSimulationRunId(runId),
      actorId: asActorId(actorId),
      learnerId: asLearnerId(`learner_${runId}`),
      businessCaseId: asBusinessCaseId(`case_${runId}`),
      correlationId: asCorrelationId(`corr_create_${runId}`),
      causationId: null,
      contentPackageVersionId,
      runtimeVersion: "runtime-1",
    });
    expect(created.ok).toBe(true);
    const started = await module.lifecycleService.start({
      simulationRunId: asSimulationRunId(runId),
      actorId: asActorId(actorId),
      correlationId: asCorrelationId(`corr_start_${runId}`),
      causationId: null,
      expectedAggregateVersion: null,
    });
    expect(started.ok).toBe(true);
  };

  it("registry completeness matches production composition", async () => {
    const module = openModule(TENANT_A, ACTOR_A, OPS_CAPS);
    try {
      const result = evaluateWorkplaceConvergenceCompleteness({
        registry: module.projectionEventConsumer.registry,
      });
      expect(result.ok, result.diagnostics).toBe(true);
      expect(
        module.projectionEventConsumer.registry.registeredTypes.length,
      ).toBe(WORKPLACE_PROJECTION_TYPES.length);
      expect(WORKPLACE_CONVERGENCE_MANIFEST).toHaveLength(
        WORKPLACE_PROJECTION_TYPES.length,
      );
    } finally {
      await module.close();
    }
  });

  it("fresh run drains relay and rebuild-all covers registered projections", async () => {
    const module = openModule(TENANT_A, ACTOR_A, OPS_CAPS);
    try {
      await seedRun(module, RUN_A, ACTOR_A);
      const drained = await drainRelay(module);
      expect(drained.published).toBeGreaterThan(0);

      const summary = await module.projectionOperationsService.getQueueSummary(
        opsActor(ACTOR_A, TENANT_A, OPS_CAPS),
      );
      expect(summary.ok).toBe(true);
      if (summary.ok) {
        expect(summary.value.exhausted + summary.value.retrying).toBe(0);
        expect(summary.value.succeeded).toBeGreaterThan(0);
      }

      const rebuild = await module.projectionOperationsService.rebuildAllForRun(
        opsActor(ACTOR_A, TENANT_A, OPS_CAPS),
        { simulationRunId: RUN_A, correlationId: "corr_rebuild_all_fresh" },
      );
      expect(rebuild.ok).toBe(true);
      if (rebuild.ok) {
        expect(rebuild.value.results.length).toBe(
          WORKPLACE_PROJECTION_TYPES.length,
        );
        for (const type of WORKPLACE_PROJECTION_TYPES) {
          const row = rebuild.value.results.find(
            (item) => item.projectionType === type,
          );
          expect(row, `missing rebuild result for ${type}`).toBeDefined();
          expect(["rebuilt", "already_current"]).toContain(row?.result);
        }
      }

      // Learner without ops capability cannot rebuild.
      const denied = await module.projectionOperationsService.rebuildAllForRun(
        opsActor(ACTOR_A, TENANT_A, LEARNER_CAPS),
        { simulationRunId: RUN_A, correlationId: "corr_rebuild_denied" },
      );
      expect(denied.ok).toBe(false);
    } finally {
      await module.close();
    }
  });

  it("multi-feature authoritative setup converges projections without duplicates", async () => {
    const module = openModule(TENANT_A, ACTOR_A, OPS_CAPS);
    try {
      await seedRun(module, RUN_A, ACTOR_A);

      const schedule: ScheduleMeetingCommand = {
        commandId: asCommandId("cmd_ps024_meeting"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T12:00:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_meeting"),
        causationId: null,
        expectedVersion: null,
        commandType: "ScheduleMeeting",
        payload: {
          meetingId: asMeetingId("meeting_ps024"),
          title: "Convergence kickoff",
          scheduledFor: asIsoTimestamp("2026-07-27T09:00:00.000Z"),
          participantIds: [asStakeholderId("stakeholder_ps024")],
          agenda: "Align on convergence",
          definitionVersion: "1",
          durationMinutes: 30,
          channel: "Room A",
          participantDisplayNames: {
            stakeholder_ps024: "Alex Sponsor",
          },
        },
      };
      const stakeholder: InitializeStakeholderCommand = {
        commandId: asCommandId("cmd_ps024_stakeholder"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T12:01:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_stakeholder"),
        causationId: null,
        expectedVersion: null,
        commandType: "InitializeStakeholder",
        payload: {
          stakeholderId: asStakeholderId("stakeholder_ps024"),
          displayName: "Alex Sponsor",
          roleLabel: "Executive Sponsor",
          definitionVersion: "1",
        },
      };
      const document: InitializeDocumentCommand = {
        commandId: asCommandId("cmd_ps024_document"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T12:02:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_document"),
        causationId: null,
        expectedVersion: null,
        commandType: "InitializeDocument",
        payload: {
          documentId: asDocumentId("document_ps024"),
          title: "Convergence brief",
          body: "Learner-safe document body.",
        },
      };
      const notification: InitializeNotificationCommand = {
        commandId: asCommandId("cmd_ps024_notification"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T12:03:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_notification"),
        causationId: null,
        expectedVersion: null,
        commandType: "InitializeNotification",
        payload: {
          notificationId: asNotificationId("notification_ps024"),
          title: "Attention: kickoff",
          summary: "Kickoff meeting needs confirmation.",
          sourceKind: "simulation",
        },
      };
      const activity: InitializeActivityCommand = {
        commandId: asCommandId("cmd_ps024_activity"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T12:04:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_activity"),
        causationId: null,
        expectedVersion: null,
        commandType: "InitializeActivity",
        payload: {
          activityId: asActivityId("activity_ps024"),
          title: "Review convergence brief",
          summary: "Confirm the brief before kickoff.",
          sourceKind: "simulation",
        },
      };
      const decision: SubmitDecisionCommand = {
        commandId: asCommandId("cmd_ps024_decision"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T12:05:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_decision"),
        causationId: null,
        expectedVersion: null,
        commandType: "SubmitDecision",
        payload: {
          decisionId: asDecisionId("decision_1"),
          optionId: asDecisionOptionId("option_b"),
          rationale: "Balances stakeholder and risk impact.",
        },
      };

      for (const command of [
        schedule,
        stakeholder,
        document,
        notification,
        decision,
      ]) {
        const result = await module.applicationService.process(command);
        expect(isAccepted(result), command.commandType).toBe(true);
      }

      // Duplicate command receipt: same commandId replays without new events.
      const firstActivity = await module.applicationService.process(activity);
      expect(isAccepted(firstActivity)).toBe(true);
      const duplicateActivity =
        await module.applicationService.process(activity);
      expect(duplicateActivity).toEqual(firstActivity);

      await drainRelay(module);

      const run = await module.runRepository.getById(
        asTenantId(TENANT_A),
        asSimulationRunId(RUN_A),
      );
      expect(run?.state.meetings).toHaveLength(1);
      expect(run?.state.stakeholders).toHaveLength(1);
      expect(run?.state.documents).toHaveLength(1);
      expect(run?.state.notifications).toHaveLength(1);
      expect(
        run?.state.activities.filter((a) => a.status === "active"),
      ).toHaveLength(1);
      expect(run?.state.learnerMessages).toHaveLength(1);
      expect(run?.state.decisions).toHaveLength(1);

      const meetings = await module.getMeetingsProjectionService.get({
        actorId: asActorId(ACTOR_A),
        simulationRunId: asSimulationRunId(RUN_A),
        correlationId: asCorrelationId("corr_get_meetings"),
        causationId: null,
      });
      expect(meetings.ok).toBe(true);
      if (meetings.ok) {
        expect(meetings.value.projection.meetings).toHaveLength(1);
        expect(meetings.value.freshness).toBe("current");
      }

      const inbox = await module.getInboxProjectionService.get({
        actorId: asActorId(ACTOR_A),
        simulationRunId: asSimulationRunId(RUN_A),
        correlationId: asCorrelationId("corr_get_inbox"),
        causationId: null,
      });
      expect(inbox.ok).toBe(true);
      if (inbox.ok) {
        expect(inbox.value.projection.messages).toHaveLength(1);
      }

      const activities = await module.getActivitiesProjectionService.get({
        actorId: asActorId(ACTOR_A),
        simulationRunId: asSimulationRunId(RUN_A),
        correlationId: asCorrelationId("corr_get_activities"),
        causationId: null,
      });
      expect(activities.ok).toBe(true);
      if (activities.ok) {
        expect(activities.value.projection.activities).toHaveLength(1);
        expect(activities.value.projection.activities[0]?.activityId).toBe(
          "activity_ps024",
        );
      }

      const historyBefore =
        await module.getCompletedHistoryProjectionService.get({
          actorId: asActorId(ACTOR_A),
          simulationRunId: asSimulationRunId(RUN_A),
          correlationId: asCorrelationId("corr_get_history_before"),
          causationId: null,
        });
      expect(historyBefore.ok).toBe(true);
      if (historyBefore.ok) {
        expect(historyBefore.value.projection.completedItems).toHaveLength(0);
      }

      const complete: CompleteActivityCommand = {
        commandId: asCommandId("cmd_ps024_complete"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T12:06:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_complete"),
        causationId: null,
        expectedVersion: null,
        commandType: "CompleteActivity",
        payload: { activityId: asActivityId("activity_ps024") },
      };
      const completed = await module.applicationService.process(complete);
      expect(isAccepted(completed)).toBe(true);
      await drainRelay(module);

      const activitiesAfter = await module.getActivitiesProjectionService.get({
        actorId: asActorId(ACTOR_A),
        simulationRunId: asSimulationRunId(RUN_A),
        correlationId: asCorrelationId("corr_get_activities_after"),
        causationId: null,
      });
      expect(activitiesAfter.ok).toBe(true);
      if (activitiesAfter.ok) {
        expect(activitiesAfter.value.projection.activities).toHaveLength(0);
      }

      const historyAfter =
        await module.getCompletedHistoryProjectionService.get({
          actorId: asActorId(ACTOR_A),
          simulationRunId: asSimulationRunId(RUN_A),
          correlationId: asCorrelationId("corr_get_history_after"),
          causationId: null,
        });
      expect(historyAfter.ok).toBe(true);
      if (!historyAfter.ok) {
        return;
      }
      expect(
        historyAfter.value.projection,
        JSON.stringify(historyAfter.value.projection),
      ).toMatchObject({
        projectionType: "completed_history",
        summary: { totalCompleted: 1, isEmpty: false },
      });
      expect(historyAfter.value.projection.completedItems).toEqual([
        expect.objectContaining({ activityId: "activity_ps024" }),
      ]);

      // Partial fan-out targets exist for ActivityCompleted.
      const targets = await admin.query<{
        projection_type: string;
        status: string;
      }>(
        `select projection_type, status
           from projection_processing_target
          where tenant_id = $1
            and simulation_run_id = $2
            and event_type = 'ActivityCompleted'
          order by projection_type`,
        [TENANT_A, RUN_A],
      );
      expect(targets.rows.map((row) => row.projection_type)).toEqual([
        ACTIVITIES_PROJECTION_TYPE,
        COMPLETED_HISTORY_PROJECTION_TYPE,
      ]);
      expect(targets.rows.every((row) => row.status === "succeeded")).toBe(
        true,
      );

      const activitiesHash = await projectionHash(admin, {
        tenantId: TENANT_A,
        simulationRunId: RUN_A,
        projectionType: ACTIVITIES_PROJECTION_TYPE,
      });
      const historyHash = await projectionHash(admin, {
        tenantId: TENANT_A,
        simulationRunId: RUN_A,
        projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
      });
      expect(activitiesHash).toBeTruthy();
      expect(historyHash).toBeTruthy();

      // Rebuild from authoritative state preserves semantic hashes (no drift).
      const rebuild = await module.projectionOperationsService.rebuildAllForRun(
        opsActor(ACTOR_A, TENANT_A, OPS_CAPS),
        { simulationRunId: RUN_A, correlationId: "corr_rebuild_after" },
      );
      expect(rebuild.ok).toBe(true);
      expect(
        await projectionHash(admin, {
          tenantId: TENANT_A,
          simulationRunId: RUN_A,
          projectionType: ACTIVITIES_PROJECTION_TYPE,
        }),
      ).toBe(activitiesHash);
      expect(
        await projectionHash(admin, {
          tenantId: TENANT_A,
          simulationRunId: RUN_A,
          projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
        }),
      ).toBe(historyHash);

      // Supported replay (PS-023): re-queue exhausted/retrying retained targets only.
      // Succeeded targets are not replayable via ops — document & assert denial.
      const eventIdRow = await admin.query<{
        event_id: string;
        projection_type: string;
      }>(
        `select event_id, projection_type
           from projection_processing_target
          where tenant_id = $1
            and simulation_run_id = $2
            and event_type = 'ActivityCompleted'
            and projection_type = $3
          limit 1`,
        [TENANT_A, RUN_A, COMPLETED_HISTORY_PROJECTION_TYPE],
      );
      const eventId = eventIdRow.rows[0]?.event_id;
      expect(eventId).toBeTruthy();
      const replaySucceeded =
        await module.projectionOperationsService.replayTarget(
          opsActor(ACTOR_A, TENANT_A, OPS_CAPS),
          {
            eventId: eventId!,
            projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
          },
        );
      expect(replaySucceeded.ok).toBe(false);

      // Force exhaustion (test-only mutation of operational state) then replay.
      await admin.query(
        `update projection_processing_target
            set status = 'exhausted',
                exhausted_at = now(),
                next_attempt_at = now(),
                claimed_by = null,
                claimed_at = null,
                claim_expires_at = null
          where tenant_id = $1
            and event_id = $2
            and projection_type = $3`,
        [TENANT_A, eventId, COMPLETED_HISTORY_PROJECTION_TYPE],
      );
      const replayExhausted =
        await module.projectionOperationsService.replayTarget(
          opsActor(ACTOR_A, TENANT_A, OPS_CAPS),
          {
            eventId: eventId!,
            projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
          },
        );
      expect(replayExhausted.ok).toBe(true);
      await drainRelay(module);
      expect(
        await projectionHash(admin, {
          tenantId: TENANT_A,
          simulationRunId: RUN_A,
          projectionType: ACTIVITIES_PROJECTION_TYPE,
        }),
      ).toBe(activitiesHash);
      expect(
        await countProjection(admin, {
          tenantId: TENANT_A,
          simulationRunId: RUN_A,
          projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
        }),
      ).toBe(1);
      expect(
        await projectionHash(admin, {
          tenantId: TENANT_A,
          simulationRunId: RUN_A,
          projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
        }),
      ).toBe(historyHash);
    } finally {
      await module.close();
    }
  });

  it("denies cross-tenant projection reads and ops side effects", async () => {
    const moduleA = openModule(TENANT_A, ACTOR_A, OPS_CAPS);
    const moduleB = openModule(TENANT_B, ACTOR_B, LEARNER_CAPS);
    try {
      await seedRun(moduleA, RUN_A, ACTOR_A);
      await drainRelay(moduleA);

      const foreignRead = await moduleB.getMeetingsProjectionService.get({
        actorId: asActorId(ACTOR_B),
        simulationRunId: asSimulationRunId(RUN_A),
        correlationId: asCorrelationId("corr_cross_tenant"),
        causationId: null,
      });
      // Run lives in tenant A; tenant B module cannot see it (missing / denied).
      expect(foreignRead.ok).toBe(false);

      const foreignRebuild =
        await moduleB.projectionOperationsService.rebuildOne(
          opsActor(ACTOR_B, TENANT_B, LEARNER_CAPS),
          {
            simulationRunId: RUN_A,
            projectionType: "meetings",
            correlationId: "corr_cross_rebuild",
          },
        );
      expect(foreignRebuild.ok).toBe(false);

      const meetingsInB = await moduleB.database.withTenantTransaction(
        TENANT_B,
        async (client) => {
          const result = await client.query<{ n: number }>(
            `select count(*)::int as n from simulation_projection
              where simulation_run_id = $1 and projection_type = 'meetings'`,
            [RUN_A],
          );
          return result.rows[0]?.n ?? 0;
        },
      );
      expect(meetingsInB).toBe(0);
    } finally {
      await moduleA.close();
      await moduleB.close();
    }
  });

  it("two workers claim distinct targets without duplicate durable rows", async () => {
    const database = createPostgresDatabase({
      connectionString: DATABASE_URL!,
    });
    const moduleA = createPostgresSimulationCommandModule({
      database,
      tenantId: TENANT_A,
      membershipStore: createInMemoryMembershipStore([
        {
          actorId: asActorId(ACTOR_A),
          tenantId: TENANT_A,
          roles: ["operator"],
          capabilities: [...OPS_CAPS],
        },
      ]),
      relayWorkerId: "ps024-worker-a",
    });
    const moduleB = createPostgresSimulationCommandModule({
      database,
      tenantId: TENANT_A,
      membershipStore: createInMemoryMembershipStore([
        {
          actorId: asActorId(ACTOR_A),
          tenantId: TENANT_A,
          roles: ["operator"],
          capabilities: [...OPS_CAPS],
        },
      ]),
      relayWorkerId: "ps024-worker-b",
    });
    try {
      await seedRun(moduleA, RUN_A, ACTOR_A);
      // Seed two independent domain events so each worker can claim work.
      await moduleA.applicationService.process({
        commandId: asCommandId("cmd_ps024_doc_w"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T13:00:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_doc_w"),
        causationId: null,
        expectedVersion: null,
        commandType: "InitializeDocument",
        payload: {
          documentId: asDocumentId("document_w"),
          title: "Worker doc",
          body: "Body",
        },
      } satisfies InitializeDocumentCommand);
      await moduleA.applicationService.process({
        commandId: asCommandId("cmd_ps024_note_w"),
        simulationRunId: asSimulationRunId(RUN_A),
        actorId: asActorId(ACTOR_A),
        occurredAt: asIsoTimestamp("2026-07-26T13:01:00.000Z"),
        correlationId: asCorrelationId("corr_ps024_note_w"),
        causationId: null,
        expectedVersion: null,
        commandType: "InitializeNotification",
        payload: {
          notificationId: asNotificationId("notification_w"),
          title: "Worker note",
          summary: "Summary",
          sourceKind: "simulation",
        },
      } satisfies InitializeNotificationCommand);

      // Publish outbox via worker A; process targets via both claimers.
      await drainRelay(moduleA);
      await drainRelay(moduleB);

      const uniqueTargets = await admin.query<{ n: number }>(
        `select count(*)::int as n from (
           select distinct event_id, projection_type
             from projection_processing_target
            where tenant_id = $1 and simulation_run_id = $2
         ) t`,
        [TENANT_A, RUN_A],
      );
      const totalTargets = await admin.query<{ n: number }>(
        `select count(*)::int as n
           from projection_processing_target
          where tenant_id = $1 and simulation_run_id = $2`,
        [TENANT_A, RUN_A],
      );
      expect(totalTargets.rows[0]?.n).toBe(uniqueTargets.rows[0]?.n);
      expect(totalTargets.rows[0]?.n).toBeGreaterThan(0);

      const docs = await moduleA.getDocumentsProjectionService.get({
        actorId: asActorId(ACTOR_A),
        simulationRunId: asSimulationRunId(RUN_A),
        correlationId: asCorrelationId("corr_get_docs_w"),
        causationId: null,
      });
      expect(docs.ok).toBe(true);
      if (docs.ok) {
        expect(docs.value.projection.documents).toHaveLength(1);
      }
    } finally {
      await moduleA.close();
      await moduleB.close();
      await database.close();
    }
  });
});
