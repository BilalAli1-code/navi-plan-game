import { beforeEach, describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionRecordId,
  asDocumentId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asMeetingId,
  asNotificationId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  concurrencyError,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  err,
  isAccepted,
  isRejected,
  ok,
  serializeSimulationState,
  type AuthorizationError,
  type CommandResult,
  type DecisionDefinition,
  type InitializeDocumentCommand,
  type InitializeNotificationCommand,
  type InitializeStakeholderCommand,
  type ScheduleMeetingCommand,
  type SimulationDomainEvent,
  type SimulationRun,
  type SendStakeholderMessageCommand,
  type SubmitDecisionCommand,
  type TenantId,
} from "@projectsim/domain";
import { createSimulationCommandApplicationService } from "./command-application-service";
import { createSimulationCommandDispatcher } from "./command-dispatcher";
import type { DecisionDefinitionProvider } from "./decision-definition-provider";
import type {
  Clock,
  IdentifierGenerator,
  IdempotencyStore,
  SimulationCommandAuthorizer,
} from "./ports";
import type { SimulationRunRepository } from "./simulation-run-repository";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");

const base = {
  commandId: asCommandId("cmd_1"),
  simulationRunId: asSimulationRunId("run_1"),
  actorId: asActorId("actor_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  expectedVersion: null,
} as const;

const validSubmitDecision: SubmitDecisionCommand = {
  ...base,
  commandType: "SubmitDecision",
  payload: {
    decisionId: asDecisionId("decision_1"),
    optionId: asDecisionOptionId("option_b"),
  },
};

const validInitializeStakeholder: InitializeStakeholderCommand = {
  ...base,
  commandId: asCommandId("cmd_init_stakeholder"),
  commandType: "InitializeStakeholder",
  payload: {
    stakeholderId: asStakeholderId("stakeholder_1"),
    displayName: "Alex Sponsor",
    roleLabel: "Executive Sponsor",
    organization: "Acme",
  },
};

const validSendMessage: SendStakeholderMessageCommand = {
  ...base,
  commandId: asCommandId("cmd_send_message"),
  commandType: "SendStakeholderMessage",
  payload: { recipientId: asStakeholderId("stakeholder_1"), body: "Hello" },
};

const validInitializeDocument: InitializeDocumentCommand = {
  ...base,
  commandId: asCommandId("cmd_init_document"),
  commandType: "InitializeDocument",
  payload: {
    documentId: asDocumentId("doc_1"),
    title: "Project brief",
    category: "Briefing",
    description: "Read before kickoff",
    body: "Line one\nLine two",
  },
};

const validInitializeNotification: InitializeNotificationCommand = {
  ...base,
  commandId: asCommandId("cmd_init_notification"),
  commandType: "InitializeNotification",
  payload: {
    notificationId: asNotificationId("notification_1"),
    title: "Milestone reached",
    summary: "Your project has hit a key milestone.",
    body: "Keep going!",
    sourceKind: "simulation",
  },
};

const validScheduleMeeting: ScheduleMeetingCommand = {
  ...base,
  commandType: "ScheduleMeeting",
  payload: {
    meetingId: asMeetingId("meeting_1"),
    title: "Risk review",
    scheduledFor: asIsoTimestamp("2026-07-25T09:00:00.000Z"),
    participantIds: [asStakeholderId("stakeholder_1")],
    agenda: "Discuss risks",
    participantDisplayNames: {
      stakeholder_1: "Alex Sponsor",
    },
  },
};

const fixedClock: Clock = {
  now: () => asIsoTimestamp("2026-07-24T00:00:00.500Z"),
};

const createIdentifiers = (): IdentifierGenerator => {
  let events = 0;
  let actions = 0;
  let runs = 0;
  let decisions = 0;
  return {
    nextEventId: () => asEventId(`evt_${(events += 1)}`),
    nextActionRecordId: () => asActionRecordId(`action_${(actions += 1)}`),
    nextSimulationRunId: () => asSimulationRunId(`run_${(runs += 1)}`),
    nextDecisionRecordId: () =>
      asDecisionRecordId(`decision_record_${(decisions += 1)}`),
  };
};

const allowAllAuthorizer: SimulationCommandAuthorizer = {
  authorize: async () => ok(undefined),
};

const denyAllAuthorizer: SimulationCommandAuthorizer = {
  authorize: async () =>
    err<AuthorizationError>({
      kind: "authorization",
      code: "PERMISSION_DENIED",
      retryable: false,
      message: "Actor is not permitted to run this command.",
    }),
};

const createIdempotencyStore = (): IdempotencyStore => {
  const store = new Map<string, CommandResult>();
  return {
    recall: async (commandId) => store.get(commandId) ?? null,
    remember: async (commandId, result) => {
      store.set(commandId, result);
    },
  };
};

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_1"),
  tenantId,
  learnerId: asLearnerId("learner_1"),
  businessCaseId: asBusinessCaseId("case_1"),
  contentPackageVersionId,
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 1,
  lastProcessedSequence: 0,
  currentChapterId: null,
  currentDayId: null,
  startedAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  updatedAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  state: createInitialSimulationState(),
  ...overrides,
});

const defaultDefinition: DecisionDefinition = createScaffoldDecisionDefinition({
  id: asDecisionId("decision_1"),
  contentPackageVersionId,
});

const createRunRepository = (
  seed: SimulationRun | null = activeRun(),
): SimulationRunRepository & { readonly events: SimulationDomainEvent[] } => {
  const runs = new Map<string, SimulationRun>();
  const events: SimulationDomainEvent[] = [];
  if (seed) {
    runs.set(`${seed.tenantId}:${seed.id}`, seed);
  }
  return {
    get events() {
      return events;
    },
    async getById(tid: TenantId, id) {
      return runs.get(`${tid}:${id}`) ?? null;
    },
    async save(tid, run, expected, pending) {
      const key = `${tid}:${run.id}`;
      const existing = runs.get(key);
      if (expected === null) {
        if (existing) {
          return err(concurrencyError(0, existing.aggregateVersion));
        }
      } else if (!existing || existing.aggregateVersion !== expected) {
        return err(concurrencyError(expected, existing?.aggregateVersion ?? 0));
      }
      runs.set(key, run);
      events.push(...pending);
      serializeSimulationState(run.state);
      return ok(undefined);
    },
  };
};

const createDefinitionProvider = (
  definition: DecisionDefinition | null = defaultDefinition,
): DecisionDefinitionProvider => ({
  getDecisionDefinition: async () => definition,
});

interface Overrides {
  authorizer?: SimulationCommandAuthorizer;
  runRepository?: ReturnType<typeof createRunRepository>;
  decisionDefinitionProvider?: DecisionDefinitionProvider;
  idempotencyStore?: IdempotencyStore;
}

const createHarness = (overrides: Overrides = {}) => {
  const runRepository = overrides.runRepository ?? createRunRepository();
  const idempotencyStore =
    overrides.idempotencyStore ?? createIdempotencyStore();
  const service = createSimulationCommandApplicationService({
    tenantId,
    dispatcher: createSimulationCommandDispatcher(),
    authorizer: overrides.authorizer ?? allowAllAuthorizer,
    idempotencyStore,
    runRepository,
    decisionDefinitionProvider:
      overrides.decisionDefinitionProvider ?? createDefinitionProvider(),
    clock: fixedClock,
    identifiers: createIdentifiers(),
  });
  return { service, runRepository, idempotencyStore };
};

describe("SimulationCommandApplicationService — accepted path", () => {
  it("given_a_valid_decision_command_then_it_resolves_consequences_atomically", async () => {
    const { service, runRepository } = createHarness();

    const result = await service.process(validSubmitDecision);

    expect(isAccepted(result)).toBe(true);
    if (isAccepted(result)) {
      expect(result.aggregateVersion).toBe(2);
      expect(result.emittedEvents[0]?.eventType).toBe(
        "SimulationActionAccepted",
      );
      expect(result.emittedEvents[1]?.eventType).toBe("DecisionSubmitted");
      expect(result.emittedEvents.at(-1)?.eventType).toBe("DecisionResolved");
      expect(
        new Set(result.emittedEvents.map((event) => event.sequenceNumber)).size,
      ).toBe(1);
      expect(result.emittedEvents.length).toBeGreaterThan(2);
    }
    expect(runRepository.events.length).toBeGreaterThan(2);
    const loaded = await runRepository.getById(
      tenantId,
      asSimulationRunId("run_1"),
    );
    expect(loaded?.state.decisions).toHaveLength(1);
    expect(loaded?.state.decisions[0]?.status).toBe("resolved");
    expect(loaded?.state.decisionOutcomes).toHaveLength(1);
    expect(loaded?.state.consequences).toHaveLength(7);
    expect(loaded?.state.learnerMessages).toHaveLength(1);
    expect(loaded?.state.stateVersion).toBe(1);
  });

  it("given_initialize_and_send_stakeholder_message_then_persists_runtime_state_and_events", async () => {
    const { service, runRepository } = createHarness();

    const initialized = await service.process(validInitializeStakeholder);
    expect(isAccepted(initialized)).toBe(true);
    if (isAccepted(initialized)) {
      expect(initialized.emittedEvents.map((event) => event.eventType)).toEqual(
        ["SimulationActionAccepted", "StakeholderInitialized"],
      );
    }

    const messaged = await service.process(validSendMessage);
    expect(isAccepted(messaged)).toBe(true);
    if (isAccepted(messaged)) {
      expect(messaged.emittedEvents.map((event) => event.eventType)).toEqual([
        "SimulationActionAccepted",
        "StakeholderConversationOpened",
        "StakeholderMessageSent",
      ]);
      expect(
        new Set(messaged.emittedEvents.map((event) => event.sequenceNumber))
          .size,
      ).toBe(1);
    }

    const loaded = await runRepository.getById(
      tenantId,
      asSimulationRunId("run_1"),
    );
    expect(loaded?.state.schemaVersion).toBe(8);
    expect(loaded?.state.stakeholders).toHaveLength(1);
    expect(loaded?.state.stakeholders[0]?.profile.displayName).toBe(
      "Alex Sponsor",
    );
    expect(loaded?.state.stakeholderConversations).toHaveLength(1);
    expect(loaded?.state.stakeholderConversations[0]?.messages[0]?.body).toBe(
      "Hello",
    );
    expect(loaded?.state.learnerMessages).toHaveLength(0);
  });

  it("given_send_without_initialize_then_it_is_rejected", async () => {
    const { service } = createHarness();
    const result = await service.process(validSendMessage);
    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.code).toBe("STAKEHOLDER_NOT_FOUND");
    }
  });

  it("given_a_valid_initialize_document_command_then_it_persists_document_and_events", async () => {
    const { service, runRepository } = createHarness();

    const result = await service.process(validInitializeDocument);

    expect(isAccepted(result)).toBe(true);
    if (isAccepted(result)) {
      expect(result.emittedEvents.map((event) => event.eventType)).toEqual([
        "SimulationActionAccepted",
        "DocumentInitialized",
      ]);
      expect(
        new Set(result.emittedEvents.map((event) => event.sequenceNumber)).size,
      ).toBe(1);
    }
    const loaded = await runRepository.getById(
      tenantId,
      asSimulationRunId("run_1"),
    );
    expect(loaded?.state.schemaVersion).toBe(8);
    expect(loaded?.state.documents).toHaveLength(1);
    expect(loaded?.state.documents[0]?.content.title).toBe("Project brief");
    expect(loaded?.state.documents[0]?.content.body).toBe("Line one\nLine two");
    expect(loaded?.state.documents[0]?.status).toBe("available");
  });

  it("given_a_valid_initialize_notification_command_then_it_persists_notification_and_events", async () => {
    const { service, runRepository } = createHarness();

    const result = await service.process(validInitializeNotification);

    expect(isAccepted(result)).toBe(true);
    if (isAccepted(result)) {
      expect(result.emittedEvents.map((event) => event.eventType)).toEqual([
        "SimulationActionAccepted",
        "NotificationInitialized",
      ]);
      expect(
        new Set(result.emittedEvents.map((event) => event.sequenceNumber)).size,
      ).toBe(1);
    }
    const loaded = await runRepository.getById(
      tenantId,
      asSimulationRunId("run_1"),
    );
    expect(loaded?.state.schemaVersion).toBe(8);
    expect(loaded?.state.notifications).toHaveLength(1);
    expect(loaded?.state.notifications[0]?.content.title).toBe(
      "Milestone reached",
    );
    expect(loaded?.state.notifications[0]?.content.summary).toBe(
      "Your project has hit a key milestone.",
    );
    expect(loaded?.state.notifications[0]?.content.body).toBe("Keep going!");
    expect(loaded?.state.notifications[0]?.status).toBe("active");
  });

  it("given_a_valid_schedule_meeting_command_then_it_persists_occurrence_and_events", async () => {
    const { service, runRepository } = createHarness();

    const result = await service.process(validScheduleMeeting);

    expect(isAccepted(result)).toBe(true);
    if (isAccepted(result)) {
      expect(result.emittedEvents.map((event) => event.eventType)).toEqual([
        "SimulationActionAccepted",
        "MeetingScheduled",
      ]);
      expect(
        new Set(result.emittedEvents.map((event) => event.sequenceNumber)).size,
      ).toBe(1);
    }
    const loaded = await runRepository.getById(
      tenantId,
      asSimulationRunId("run_1"),
    );
    expect(loaded?.state.meetings).toHaveLength(1);
    expect(loaded?.state.meetings[0]?.meetingOccurrenceId).toBe(
      "meeting_occurrence:meeting_1",
    );
    expect(loaded?.state.meetings[0]?.status).toBe("scheduled");
    expect(loaded?.state.schemaVersion).toBe(8);
  });

  it("given_conflicting_schedule_meeting_then_it_is_rejected_without_duplicate", async () => {
    const { service, runRepository } = createHarness();
    await service.process(validScheduleMeeting);

    const conflict = await service.process({
      ...validScheduleMeeting,
      commandId: asCommandId("cmd_meeting_conflict"),
      payload: {
        ...validScheduleMeeting.payload,
        title: "Different title",
      },
    });
    expect(isRejected(conflict)).toBe(true);
    if (isRejected(conflict)) {
      expect(conflict.error.code).toBe("MEETING_OCCURRENCE_CONFLICT");
    }
    const loaded = await runRepository.getById(
      tenantId,
      asSimulationRunId("run_1"),
    );
    expect(loaded?.state.meetings).toHaveLength(1);
  });

  it("given_a_non_active_run_when_processed_then_it_is_rejected", async () => {
    const { service, runRepository } = createHarness({
      runRepository: createRunRepository(activeRun({ status: "paused" })),
    });

    const result = await service.process(validSubmitDecision);

    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.code).toBe("SIMULATION_RUN_NOT_ACTIVE");
    }
    expect(runRepository.events).toHaveLength(0);
  });

  it("given_an_inactive_run_when_rejected_then_it_has_no_authoritative_side_effects", async () => {
    const seed = activeRun({
      status: "paused",
      aggregateVersion: 4,
      lastProcessedSequence: 3,
    });
    const runRepository = createRunRepository(seed);
    const idempotencyStore = createIdempotencyStore();
    const { service } = createHarness({ runRepository, idempotencyStore });

    const result = await service.process(validSubmitDecision);
    expect(isRejected(result)).toBe(true);

    const after = await runRepository.getById(tenantId, seed.id);
    expect(after?.aggregateVersion).toBe(4);
    expect(after?.lastProcessedSequence).toBe(3);
    expect(after?.status).toBe("paused");
    expect(runRepository.events).toHaveLength(0);
    expect(
      await idempotencyStore.recall(validSubmitDecision.commandId),
    ).toBeNull();
  });
});

describe("SimulationCommandApplicationService — rejection paths", () => {
  it("given_an_invalid_payload_when_processed_then_it_is_rejected_without_events", async () => {
    const { service, runRepository } = createHarness();

    const result = await service.process({
      ...validSubmitDecision,
      payload: {
        decisionId: asDecisionId(""),
        optionId: asDecisionOptionId(""),
      },
    });

    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.kind).toBe("validation");
    }
    expect(runRepository.events).toHaveLength(0);
  });

  it("given_an_unauthorized_actor_when_processed_then_it_is_rejected_without_events", async () => {
    const { service, runRepository } = createHarness({
      authorizer: denyAllAuthorizer,
    });

    const result = await service.process(validSubmitDecision);

    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.kind).toBe("authorization");
    }
    expect(runRepository.events).toHaveLength(0);
  });

  it("given_a_version_conflict_when_processed_then_it_is_rejected_as_a_concurrency_error", async () => {
    const { service, runRepository } = createHarness({
      runRepository: createRunRepository(activeRun({ aggregateVersion: 5 })),
    });

    const result = await service.process({
      ...validSubmitDecision,
      expectedVersion: 2,
    });

    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.kind).toBe("concurrency");
      expect(result.error.code).toBe("AGGREGATE_VERSION_CONFLICT");
    }
    expect(runRepository.events).toHaveLength(0);
  });

  it("given_a_missing_run_when_processed_then_it_is_rejected", async () => {
    const { service } = createHarness({
      runRepository: createRunRepository(null),
    });

    const result = await service.process(validSubmitDecision);

    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.code).toBe("SIMULATION_RUN_NOT_FOUND");
    }
  });

  it("given_missing_decision_definition_when_processed_then_it_is_rejected", async () => {
    const { service, runRepository } = createHarness({
      decisionDefinitionProvider: createDefinitionProvider(null),
    });

    const result = await service.process(validSubmitDecision);
    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.code).toBe("DECISION_DEFINITION_NOT_FOUND");
    }
    expect(runRepository.events).toHaveLength(0);
  });

  it("given_a_new_idempotency_key_for_an_already_submitted_decision_then_domain_rejects", async () => {
    const { service, runRepository } = createHarness();
    const first = await service.process(validSubmitDecision);
    expect(isAccepted(first)).toBe(true);

    const second = await service.process({
      ...validSubmitDecision,
      commandId: asCommandId("cmd_2"),
    });
    expect(isRejected(second)).toBe(true);
    if (isRejected(second)) {
      expect(second.error.code).toBe("DECISION_ALREADY_SUBMITTED");
    }
    expect(
      runRepository.events.filter((e) => e.eventType === "DecisionSubmitted"),
    ).toHaveLength(1);
  });
});

describe("SimulationCommandApplicationService — idempotency", () => {
  let harness: ReturnType<typeof createHarness>;
  beforeEach(() => {
    harness = createHarness();
  });

  it("given_a_retried_command_when_processed_twice_then_the_original_result_is_replayed", async () => {
    const first = await harness.service.process(validSubmitDecision);
    const second = await harness.service.process(validSubmitDecision);

    expect(second).toEqual(first);
    expect(harness.runRepository.events.length).toBeGreaterThan(2);
    expect(
      harness.runRepository.events.filter(
        (e) => e.eventType === "DecisionResolved",
      ),
    ).toHaveLength(1);
  });
});
