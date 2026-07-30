import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asConversationId,
  asCorrelationId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asMeetingId,
  asMessageId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  createInitialSimulationState,
  createStakeholderLearnerSafeProfile,
  deriveStakeholderConversationId,
  deriveStakeholderMessageIdFromCommand,
  parseSimulationState,
  processInitializeStakeholder,
  processScheduleMeeting,
  processSendStakeholderMessage,
  serializeSimulationState,
  type SimulationRun,
} from "../../index";

const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");
const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_stakeholder");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_stakeholder"),
  tenantId,
  learnerId: asLearnerId("learner_1"),
  businessCaseId: asBusinessCaseId("case_1"),
  contentPackageVersionId,
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 2,
  lastProcessedSequence: 0,
  currentChapterId: null,
  currentDayId: null,
  startedAt: now,
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  state: createInitialSimulationState(),
  ...overrides,
});

const initInput = (stakeholderId: string, commandSuffix = stakeholderId) => ({
  stakeholderId: asStakeholderId(stakeholderId),
  definitionVersion: "1",
  displayName: `Name ${stakeholderId}`,
  roleLabel: "Sponsor",
  organization: "Acme",
  department: "PMO",
  biography: "Learner-safe bio",
  commandId: asCommandId(`cmd_init_${commandSuffix}`),
  occurredAt: now,
  recordedAt: now,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  eventId: asEventId(`evt_init_${commandSuffix}`),
});

const messageInput = (
  recipientId: string,
  body: string,
  commandSuffix: string,
  conversationId?: string,
) => ({
  recipientId: asStakeholderId(recipientId),
  body,
  ...(conversationId !== undefined
    ? { conversationId: asConversationId(conversationId) }
    : {}),
  commandId: asCommandId(`cmd_msg_${commandSuffix}`),
  occurredAt: now,
  recordedAt: now,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  eventId: asEventId(`evt_msg_${commandSuffix}`),
  allocateEventId: () => asEventId(`evt_msg_alloc_${commandSuffix}`),
});

describe("Stakeholder runtime domain", () => {
  it("rejects markup and hidden-looking profile fields with angle brackets", () => {
    const profile = createStakeholderLearnerSafeProfile({
      displayName: "Alex <script>",
    });
    expect(profile.ok).toBe(false);
    if (profile.ok) {
      return;
    }
    expect(profile.error.code).toBe("STAKEHOLDER_PROFILE_INVALID");
  });

  it("derives stable conversation and message identities", () => {
    const stakeholderId = asStakeholderId("stakeholder_a");
    expect(deriveStakeholderConversationId(stakeholderId)).toBe(
      "conversation:stakeholder_a",
    );
    expect(deriveStakeholderMessageIdFromCommand(asCommandId("cmd_42"))).toBe(
      "stakeholder_message:cmd_42",
    );
  });

  it("initializes a runtime Stakeholder with provenance and ordering", () => {
    const first = processInitializeStakeholder(
      activeRun(),
      initInput("stakeholder_a"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.identicalNoop).toBe(false);
    expect(first.value.events.map((event) => event.eventType)).toEqual([
      "StakeholderInitialized",
    ]);
    expect(first.value.stakeholder.initializationSequence).toBe(1);
    expect(first.value.stakeholder.stakeholderDefinitionVersion).toBe("1");
    expect(first.value.stakeholder.profile.displayName).toBe(
      "Name stakeholder_a",
    );
    expect(first.value.run.state.schemaVersion).toBe(8);
    expect(first.value.run.state.stakeholders).toHaveLength(1);

    const second = processInitializeStakeholder(
      first.value.run,
      initInput("stakeholder_b"),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value.stakeholder.initializationSequence).toBe(2);
    expect(
      second.value.run.state.stakeholders.map((s) => s.stakeholderId),
    ).toEqual(["stakeholder_a", "stakeholder_b"]);
  });

  it("treats identical re-initialization as a no-op without duplicating", () => {
    const first = processInitializeStakeholder(
      activeRun(),
      initInput("stakeholder_a"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const retry = processInitializeStakeholder(
      first.value.run,
      initInput("stakeholder_a", "retry"),
    );
    expect(retry.ok).toBe(true);
    if (!retry.ok) {
      return;
    }
    expect(retry.value.identicalNoop).toBe(true);
    expect(retry.value.events).toHaveLength(0);
    expect(retry.value.run.state.stakeholders).toHaveLength(1);
    expect(retry.value.run.aggregateVersion).toBe(
      first.value.run.aggregateVersion + 1,
    );
  });

  it("rejects conflicting initialization for the same StakeholderId", () => {
    const first = processInitializeStakeholder(
      activeRun(),
      initInput("stakeholder_a"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const conflict = processInitializeStakeholder(first.value.run, {
      ...initInput("stakeholder_a", "conflict"),
      displayName: "Different Name",
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok) {
      return;
    }
    expect(conflict.error.code).toBe("STAKEHOLDER_IDENTITY_CONFLICT");
    expect(first.value.run.state.stakeholders).toHaveLength(1);
  });

  it("opens one conversation and appends learner_to_stakeholder messages", () => {
    const initialized = processInitializeStakeholder(
      activeRun(),
      initInput("stakeholder_a"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }

    const firstMessage = processSendStakeholderMessage(
      initialized.value.run,
      messageInput("stakeholder_a", "Hello sponsor", "1"),
    );
    expect(firstMessage.ok).toBe(true);
    if (!firstMessage.ok) {
      return;
    }
    expect(firstMessage.value.identicalNoop).toBe(false);
    expect(firstMessage.value.events.map((event) => event.eventType)).toEqual([
      "StakeholderConversationOpened",
      "StakeholderMessageSent",
    ]);
    expect(firstMessage.value.conversation.conversationId).toBe(
      "conversation:stakeholder_a",
    );
    expect(firstMessage.value.message.conversationSequence).toBe(1);
    expect(firstMessage.value.message.direction).toBe("learner_to_stakeholder");
    expect(firstMessage.value.message.messageId).toBe(
      "stakeholder_message:cmd_msg_1",
    );
    expect(firstMessage.value.run.state.learnerMessages).toHaveLength(0);

    const secondMessage = processSendStakeholderMessage(
      firstMessage.value.run,
      messageInput("stakeholder_a", "Follow-up", "2"),
    );
    expect(secondMessage.ok).toBe(true);
    if (!secondMessage.ok) {
      return;
    }
    expect(secondMessage.value.events.map((event) => event.eventType)).toEqual([
      "StakeholderMessageSent",
    ]);
    expect(secondMessage.value.message.conversationSequence).toBe(2);
    expect(
      secondMessage.value.run.state.stakeholderConversations[0]?.messages,
    ).toHaveLength(2);
  });

  it("rejects messaging an uninitialized Stakeholder", () => {
    const result = processSendStakeholderMessage(
      activeRun(),
      messageInput("stakeholder_missing", "Hello", "missing"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("STAKEHOLDER_NOT_FOUND");
  });

  it("rejects a non-canonical conversationId", () => {
    const initialized = processInitializeStakeholder(
      activeRun(),
      initInput("stakeholder_a"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }
    const result = processSendStakeholderMessage(
      initialized.value.run,
      messageInput("stakeholder_a", "Hello", "bad_conv", "conversation:other"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe(
      "STAKEHOLDER_CONVERSATION_IDENTITY_CONFLICT",
    );
  });

  it("treats identical message retries as no-ops and rejects conflicting reuse", () => {
    const initialized = processInitializeStakeholder(
      activeRun(),
      initInput("stakeholder_a"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }
    const first = processSendStakeholderMessage(
      initialized.value.run,
      messageInput("stakeholder_a", "Hello", "dup"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const identical = processSendStakeholderMessage(
      first.value.run,
      messageInput("stakeholder_a", "Hello", "dup"),
    );
    expect(identical.ok).toBe(true);
    if (!identical.ok) {
      return;
    }
    expect(identical.value.identicalNoop).toBe(true);
    expect(identical.value.events).toHaveLength(0);
    expect(
      identical.value.run.state.stakeholderConversations[0]?.messages,
    ).toHaveLength(1);

    const conflicting = processSendStakeholderMessage(first.value.run, {
      ...messageInput("stakeholder_a", "Different body", "dup"),
      allocateEventId: () => asEventId("evt_conflict"),
    });
    expect(conflicting.ok).toBe(false);
    if (conflicting.ok) {
      return;
    }
    expect(conflicting.error.code).toBe(
      "STAKEHOLDER_MESSAGE_IDENTITY_CONFLICT",
    );
  });

  it("preserves Meeting occurrences when Stakeholders are initialized", () => {
    const scheduled = processScheduleMeeting(activeRun(), {
      meetingId: asMeetingId("meeting_1"),
      title: "Kickoff",
      scheduledFor: asIsoTimestamp("2026-07-27T09:00:00.000Z"),
      participantIds: [asStakeholderId("stakeholder_a")],
      commandId: asCommandId("cmd_meeting"),
      occurredAt: now,
      recordedAt: now,
      actorId: asActorId("actor_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      eventId: asEventId("evt_meeting"),
    });
    expect(scheduled.ok).toBe(true);
    if (!scheduled.ok) {
      return;
    }
    const initialized = processInitializeStakeholder(
      scheduled.value.run,
      initInput("stakeholder_a"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }
    expect(initialized.value.run.state.meetings).toHaveLength(1);
    expect(initialized.value.run.state.meetings[0]?.title).toBe("Kickoff");
    expect(initialized.value.run.state.meetings[0]?.participants[0]).toEqual({
      stakeholderId: "stakeholder_a",
      displayName: "stakeholder_a",
    });
  });

  it("round-trips schema v6 and upcasts historical states to empty Stakeholder collections", () => {
    const initialized = processInitializeStakeholder(
      activeRun(),
      initInput("stakeholder_a"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }
    const messaged = processSendStakeholderMessage(
      initialized.value.run,
      messageInput("stakeholder_a", "Hello", "persist"),
    );
    expect(messaged.ok).toBe(true);
    if (!messaged.ok) {
      return;
    }
    const serialized = serializeSimulationState(messaged.value.run.state);
    expect(serialized.schemaVersion).toBe(8);
    const parsed = parseSimulationState(serialized);
    expect(parsed?.schemaVersion).toBe(8);
    expect(parsed?.stakeholders).toHaveLength(1);
    expect(parsed?.stakeholderConversations[0]?.messages[0]?.body).toBe(
      "Hello",
    );
    expect(parsed?.stakeholderConversations[0]?.messages[0]?.messageId).toBe(
      asMessageId("stakeholder_message:cmd_msg_persist"),
    );

    const upcast = parseSimulationState({
      schemaVersion: 4,
      stateVersion: 1,
      projectMetrics: serialized.projectMetrics,
      projectState: serialized.projectState,
      chapterProgress: [],
      dayProgress: [],
      activityProgress: [],
      decisions: [],
      decisionOutcomes: [],
      consequences: [],
      scheduledEvents: [],
      learnerMessages: [],
      meetings: [],
    });
    expect(upcast?.schemaVersion).toBe(8);
    expect(upcast?.stakeholders).toEqual([]);
    expect(upcast?.stakeholderConversations).toEqual([]);
  });
});
