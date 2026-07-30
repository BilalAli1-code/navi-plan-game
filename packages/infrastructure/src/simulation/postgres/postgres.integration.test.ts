import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asIsoTimestamp,
  asLearnerId,
  asMeetingId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  createScaffoldDecisionDefinition,
  isAccepted,
  isRejected,
  type DecisionDefinition,
  type InitializeStakeholderCommand,
  type ScheduleMeetingCommand,
  type SendStakeholderMessageCommand,
  type SubmitDecisionCommand,
} from "@projectsim/domain";
import pkg from "pg";
import { createPermitAllAuthorizer } from "../authorizer";
import { createPermitAllLifecycleAuthorizer } from "../authorization/lifecycle-authorizer";
import { createInMemoryDecisionDefinitionProvider } from "../decision-definition-provider";
import { createPostgresSimulationCommandModule } from "./postgres-composition-root";
import type { PostgresSimulationCommandModule } from "./postgres-composition-root";
import { cleanupPostgresTenants } from "./test-db-cleanup";

const { Client } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL ??
  process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//postgres:postgres@");

const describeIfDb = DATABASE_URL ? describe : describe.skip;

const TENANT_A = "tenant_a";
const TENANT_B = "tenant_b";
const SUITE_TENANTS = [TENANT_A, TENANT_B] as const;
const contentPackageVersionId = asContentPackageVersionId("cpv_1");

const definitionFor = (_tenantId: string): DecisionDefinition =>
  createScaffoldDecisionDefinition({
    id: asDecisionId("decision_1"),
    contentPackageVersionId,
  });

const buildCommand = (
  commandId: string,
  expectedVersion: number | null = null,
): SubmitDecisionCommand => ({
  commandId: asCommandId(commandId),
  simulationRunId: asSimulationRunId("run_1"),
  actorId: asActorId("actor_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  expectedVersion,
  commandType: "SubmitDecision",
  payload: {
    decisionId: asDecisionId("decision_1"),
    optionId: asDecisionOptionId("option_b"),
  },
});

const truncateAll = async (): Promise<void> => {
  await cleanupPostgresTenants({
    adminUrl: DATABASE_ADMIN_URL,
    tenantIds: SUITE_TENANTS,
  });
};

const countOutbox = async (tenantId: string): Promise<number> => {
  if (!DATABASE_ADMIN_URL) {
    return 0;
  }
  const client = new Client({ connectionString: DATABASE_ADMIN_URL });
  await client.connect();
  try {
    const result = await client.query(
      "select count(*)::int as n from event_outbox where tenant_id = $1",
      [tenantId],
    );
    return result.rows[0]?.n ?? 0;
  } finally {
    await client.end();
  }
};

const countOutboxByType = async (
  tenantId: string,
  eventType: string,
): Promise<number> => {
  if (!DATABASE_ADMIN_URL) {
    return 0;
  }
  const client = new Client({ connectionString: DATABASE_ADMIN_URL });
  await client.connect();
  try {
    const result = await client.query(
      "select count(*)::int as n from event_outbox where tenant_id = $1 and event_type = $2",
      [tenantId, eventType],
    );
    return result.rows[0]?.n ?? 0;
  } finally {
    await client.end();
  }
};

const seedActiveRun = async (
  module: PostgresSimulationCommandModule,
  runId = "run_1",
): Promise<void> => {
  const created = await module.lifecycleService.create({
    actorId: asActorId("actor_1"),
    learnerId: asLearnerId("learner_1"),
    businessCaseId: asBusinessCaseId("case_1"),
    contentPackageVersionId,
    runtimeVersion: "runtime-1",
    correlationId: asCorrelationId("corr_seed"),
    causationId: null,
    simulationRunId: asSimulationRunId(runId),
  });
  expect(created.ok).toBe(true);
  const started = await module.lifecycleService.start({
    actorId: asActorId("actor_1"),
    simulationRunId: asSimulationRunId(runId),
    correlationId: asCorrelationId("corr_seed"),
    causationId: null,
    expectedAggregateVersion: null,
  });
  expect(started.ok).toBe(true);
};

describeIfDb("PS-ROADMAP-004 Postgres decision submission (env-gated)", () => {
  let moduleA: PostgresSimulationCommandModule;

  beforeAll(() => {
    moduleA = createPostgresSimulationCommandModule({
      database: { connectionString: DATABASE_URL! },
      tenantId: TENANT_A,
      authorizer: createPermitAllAuthorizer(),
      lifecycleAuthorizer: createPermitAllLifecycleAuthorizer(),
      decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
        {
          tenantId: asTenantId(TENANT_A),
          definition: definitionFor(TENANT_A),
        },
      ]),
    });
  });

  afterAll(async () => {
    await moduleA.close();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  it("given_a_valid_decision_then_it_persists_decision_history_and_outbox_events", async () => {
    await seedActiveRun(moduleA);
    const result = await moduleA.applicationService.process(
      buildCommand("cmd_persist_1"),
    );

    expect(isAccepted(result)).toBe(true);
    if (isAccepted(result)) {
      expect(result.emittedEvents[0]?.eventType).toBe(
        "SimulationActionAccepted",
      );
      expect(result.emittedEvents[1]?.eventType).toBe("DecisionSubmitted");
      expect(result.emittedEvents.at(-1)?.eventType).toBe("DecisionResolved");
    }

    const run = await moduleA.runRepository.getById(
      asTenantId(TENANT_A),
      asSimulationRunId("run_1"),
    );
    expect(run?.status).toBe("active");
    expect(run?.lastProcessedSequence).toBe(1);
    expect(run?.state.decisions).toHaveLength(1);
    expect(run?.state.decisions[0]?.status).toBe("resolved");
    expect(run?.state.decisionOutcomes).toHaveLength(1);
    expect(run?.state.consequences).toHaveLength(7);
    expect(run?.state.learnerMessages).toHaveLength(1);
    expect(run?.state.learnerMessages?.[0]?.deliveryStatus).toBe("delivered");
    expect(run?.state.scheduledEvents).toHaveLength(1);
    expect(run?.state.stateVersion).toBe(1);
    expect(await countOutboxByType(TENANT_A, "DecisionSubmitted")).toBe(1);
    expect(await countOutboxByType(TENANT_A, "DecisionResolved")).toBe(1);
    expect(await countOutboxByType(TENANT_A, "SimulationActionAccepted")).toBe(
      1,
    );
    expect(await countOutboxByType(TENANT_A, "LearnerMessageDelivered")).toBe(
      1,
    );
    // Created + Started + ActionAccepted + DecisionSubmitted + resolution events
    expect(await countOutbox(TENANT_A)).toBeGreaterThanOrEqual(4);
  });

  it("given_a_retried_command_then_the_receipt_is_replayed_without_duplicate_events", async () => {
    await seedActiveRun(moduleA);
    const before = await countOutbox(TENANT_A);
    const command = buildCommand("cmd_idempotent_1");
    const first = await moduleA.applicationService.process(command);
    const afterFirst = await countOutbox(TENANT_A);
    const second = await moduleA.applicationService.process(command);

    expect(second).toEqual(first);
    expect(await countOutbox(TENANT_A)).toBe(afterFirst);
    expect(afterFirst).toBeGreaterThan(before + 2);
  });

  it("given_a_stale_expected_version_then_it_is_rejected_and_no_decision_event_is_written", async () => {
    await seedActiveRun(moduleA);
    const before = await countOutbox(TENANT_A);
    const result = await moduleA.applicationService.process(
      buildCommand("cmd_conflict_1", 5),
    );

    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.code).toBe("AGGREGATE_VERSION_CONFLICT");
    }
    expect(await countOutbox(TENANT_A)).toBe(before);
  });

  it("given_lifecycle_transitions_then_events_are_written_and_state_round_trips", async () => {
    const created = await moduleA.lifecycleService.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId,
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_life"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_life"),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const loaded = await moduleA.runRepository.getById(
      asTenantId(TENANT_A),
      asSimulationRunId("run_life"),
    );
    expect(loaded?.learnerId).toBe("learner_1");
    expect(loaded?.state.schemaVersion).toBe(8);
    expect(loaded?.state.stateVersion).toBe(0);

    const started = await moduleA.lifecycleService.start({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_life"),
      correlationId: asCorrelationId("corr_life"),
      causationId: null,
      expectedAggregateVersion: created.value.run.aggregateVersion,
    });
    expect(started.ok).toBe(true);
    expect(await countOutbox(TENANT_A)).toBe(2);
  });

  it("given_incomplete_legacy_ownership_when_loaded_then_it_fails_closed_with_typed_error", async () => {
    if (!DATABASE_ADMIN_URL) {
      return;
    }
    const admin = new Client({ connectionString: DATABASE_ADMIN_URL });
    await admin.connect();
    try {
      await admin.query(
        `insert into simulation_state (
             tenant_id, simulation_run_id, aggregate_version, last_sequence_number,
             status, created_at, updated_at, authoritative_state, state_schema_version
           ) values (
             $1, $2, 1, 0, 'created', now(), now(),
             '{"schemaVersion":1,"projectMetrics":{},"chapterProgress":[],"dayProgress":[],"activityProgress":[],"decisions":[],"consequences":[]}'::jsonb,
             1
           )`,
        [TENANT_A, "run_legacy"],
      );
    } finally {
      await admin.end();
    }

    await expect(
      moduleA.runRepository.getById(
        asTenantId(TENANT_A),
        asSimulationRunId("run_legacy"),
      ),
    ).rejects.toMatchObject({
      name: "ThrownDomainError",
      domainError: { code: "SIMULATION_RUN_LEGACY_INCOMPLETE" },
    });
  });

  it("given_schedule_meeting_then_persists_meeting_state_and_outbox_event", async () => {
    await seedActiveRun(moduleA, "run_meeting");
    const command: ScheduleMeetingCommand = {
      commandId: asCommandId("cmd_meeting_1"),
      simulationRunId: asSimulationRunId("run_meeting"),
      actorId: asActorId("actor_1"),
      occurredAt: asIsoTimestamp("2026-07-26T12:00:00.000Z"),
      correlationId: asCorrelationId("corr_meeting"),
      causationId: null,
      expectedVersion: null,
      commandType: "ScheduleMeeting",
      payload: {
        meetingId: asMeetingId("meeting_1"),
        title: "Risk review",
        scheduledFor: asIsoTimestamp("2026-07-27T09:00:00.000Z"),
        participantIds: [asStakeholderId("stakeholder_1")],
        agenda: "Discuss risks",
        definitionVersion: "1",
        durationMinutes: 30,
        channel: "Room A",
        participantDisplayNames: {
          stakeholder_1: "Alex Sponsor",
        },
      },
    };

    const result = await moduleA.applicationService.process(command);
    expect(isAccepted(result)).toBe(true);
    if (isAccepted(result)) {
      expect(result.emittedEvents.map((event) => event.eventType)).toEqual([
        "SimulationActionAccepted",
        "MeetingScheduled",
      ]);
    }

    const run = await moduleA.runRepository.getById(
      asTenantId(TENANT_A),
      asSimulationRunId("run_meeting"),
    );
    expect(run?.state.schemaVersion).toBe(8);
    expect(run?.state.meetings).toHaveLength(1);
    expect(run?.state.meetings[0]?.meetingOccurrenceId).toBe(
      "meeting_occurrence:meeting_1",
    );
    expect(run?.state.meetings[0]?.status).toBe("scheduled");
    expect(await countOutboxByType(TENANT_A, "MeetingScheduled")).toBe(1);

    const retry = await moduleA.applicationService.process(command);
    expect(retry).toEqual(result);
    expect(await countOutboxByType(TENANT_A, "MeetingScheduled")).toBe(1);

    const conflict = await moduleA.applicationService.process({
      ...command,
      commandId: asCommandId("cmd_meeting_conflict"),
      payload: {
        ...command.payload,
        title: "Different title",
      },
    });
    expect(isRejected(conflict)).toBe(true);
    if (isRejected(conflict)) {
      expect(conflict.error.code).toBe("MEETING_OCCURRENCE_CONFLICT");
    }
  });

  it("given_stakeholder_commands_then_persists_runtime_state_conversations_and_outbox", async () => {
    await seedActiveRun(moduleA, "run_stakeholder");
    const initialize: InitializeStakeholderCommand = {
      commandId: asCommandId("cmd_stakeholder_init"),
      simulationRunId: asSimulationRunId("run_stakeholder"),
      actorId: asActorId("actor_1"),
      occurredAt: asIsoTimestamp("2026-07-26T12:00:00.000Z"),
      correlationId: asCorrelationId("corr_stakeholder"),
      causationId: null,
      expectedVersion: null,
      commandType: "InitializeStakeholder",
      payload: {
        stakeholderId: asStakeholderId("stakeholder_1"),
        displayName: "Alex Sponsor",
        roleLabel: "Executive Sponsor",
        definitionVersion: "1",
      },
    };
    const send: SendStakeholderMessageCommand = {
      commandId: asCommandId("cmd_stakeholder_msg"),
      simulationRunId: asSimulationRunId("run_stakeholder"),
      actorId: asActorId("actor_1"),
      occurredAt: asIsoTimestamp("2026-07-26T12:01:00.000Z"),
      correlationId: asCorrelationId("corr_stakeholder_msg"),
      causationId: null,
      expectedVersion: null,
      commandType: "SendStakeholderMessage",
      payload: {
        recipientId: asStakeholderId("stakeholder_1"),
        body: "Hello from learner",
      },
    };

    const initResult = await moduleA.applicationService.process(initialize);
    expect(isAccepted(initResult)).toBe(true);
    if (isAccepted(initResult)) {
      expect(initResult.emittedEvents.map((event) => event.eventType)).toEqual([
        "SimulationActionAccepted",
        "StakeholderInitialized",
      ]);
    }

    const sendResult = await moduleA.applicationService.process(send);
    expect(isAccepted(sendResult)).toBe(true);
    if (isAccepted(sendResult)) {
      expect(sendResult.emittedEvents.map((event) => event.eventType)).toEqual([
        "SimulationActionAccepted",
        "StakeholderConversationOpened",
        "StakeholderMessageSent",
      ]);
    }

    const run = await moduleA.runRepository.getById(
      asTenantId(TENANT_A),
      asSimulationRunId("run_stakeholder"),
    );
    expect(run?.state.schemaVersion).toBe(8);
    expect(run?.state.stakeholders).toHaveLength(1);
    expect(run?.state.stakeholders[0]?.profile.displayName).toBe(
      "Alex Sponsor",
    );
    expect(run?.state.stakeholderConversations).toHaveLength(1);
    expect(run?.state.stakeholderConversations[0]?.conversationId).toBe(
      "conversation:stakeholder_1",
    );
    expect(run?.state.stakeholderConversations[0]?.messages).toHaveLength(1);
    expect(run?.state.learnerMessages).toHaveLength(0);
    expect(await countOutboxByType(TENANT_A, "StakeholderInitialized")).toBe(1);
    expect(
      await countOutboxByType(TENANT_A, "StakeholderConversationOpened"),
    ).toBe(1);
    expect(await countOutboxByType(TENANT_A, "StakeholderMessageSent")).toBe(1);

    const retryInit = await moduleA.applicationService.process(initialize);
    expect(retryInit).toEqual(initResult);
    expect(await countOutboxByType(TENANT_A, "StakeholderInitialized")).toBe(1);

    const conflict = await moduleA.applicationService.process({
      ...initialize,
      commandId: asCommandId("cmd_stakeholder_conflict"),
      payload: {
        ...initialize.payload,
        displayName: "Different Name",
      },
    });
    expect(isRejected(conflict)).toBe(true);
    if (isRejected(conflict)) {
      expect(conflict.error.code).toBe("STAKEHOLDER_IDENTITY_CONFLICT");
    }

    const tenantAVisible = await moduleA.database.withTenantTransaction(
      TENANT_A,
      async (client) => {
        const result = await client.query<{ n: number }>(
          `select count(*)::int as n from simulation_state
            where simulation_run_id = $1`,
          ["run_stakeholder"],
        );
        return result.rows[0]?.n ?? 0;
      },
    );
    const tenantBVisible = await moduleA.database.withTenantTransaction(
      TENANT_B,
      async (client) => {
        const result = await client.query<{ n: number }>(
          `select count(*)::int as n from simulation_state
            where simulation_run_id = $1`,
          ["run_stakeholder"],
        );
        return result.rows[0]?.n ?? 0;
      },
    );
    expect(tenantAVisible).toBe(1);
    expect(tenantBVisible).toBe(0);
  });

  it("given_two_tenants_then_RLS_isolates_runs_and_outbox_rows", async () => {
    const moduleB = createPostgresSimulationCommandModule({
      database: { connectionString: DATABASE_URL! },
      tenantId: TENANT_B,
      authorizer: createPermitAllAuthorizer(),
      lifecycleAuthorizer: createPermitAllLifecycleAuthorizer(),
      decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
        {
          tenantId: asTenantId(TENANT_B),
          definition: definitionFor(TENANT_B),
        },
      ]),
    });

    try {
      await seedActiveRun(moduleA);
      await seedActiveRun(moduleB);

      await moduleA.applicationService.process(buildCommand("cmd_tenant_a"));
      await moduleB.applicationService.process(buildCommand("cmd_tenant_b"));

      const stateA = await moduleA.runRepository.getById(
        asTenantId(TENANT_A),
        asSimulationRunId("run_1"),
      );
      const stateB = await moduleB.runRepository.getById(
        asTenantId(TENANT_B),
        asSimulationRunId("run_1"),
      );
      expect(stateA?.lastProcessedSequence).toBe(1);
      expect(stateB?.lastProcessedSequence).toBe(1);
      expect(stateA?.state.decisions).toHaveLength(1);
      expect(stateB?.state.decisions).toHaveLength(1);

      const tenantAVisible = await moduleA.database.withTenantTransaction(
        TENANT_A,
        async (client) => {
          const result = await client.query<{ n: number }>(
            "select count(*)::int as n from simulation_state",
          );
          return result.rows[0]?.n ?? 0;
        },
      );
      expect(tenantAVisible).toBe(1);
    } finally {
      await moduleB.close();
    }
  });
});
