import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionRecordId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asLearnerMessageDefinitionId,
  asLearnerMessageOccurrenceId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createLearnerMessageOccurrence,
  createScaffoldDecisionDefinition,
  learnerMessageSemanticEqual,
  parseSimulationState,
  processSubmitDecision,
  rehydrateLearnerMessageOccurrence,
  serializeLearnerMessageOccurrence,
  serializeSimulationState,
  type SimulationRun,
} from "../../index";

const now = asIsoTimestamp("2026-07-26T01:00:00.000Z");
const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_msg");
const decisionDefinitionId = asDecisionId("decision_1");
const definition = createScaffoldDecisionDefinition({
  id: decisionDefinitionId,
  contentPackageVersionId,
});

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_msg"),
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

describe("learner message occurrence", () => {
  it("creates a valid occurrence and round-trips serialization", () => {
    const created = createLearnerMessageOccurrence({
      occurrenceId: asLearnerMessageOccurrenceId("learner_message:occ_1"),
      definitionId: asLearnerMessageDefinitionId("msg_def_1"),
      definitionVersion: "1",
      deliverySequence: 1,
      deliveredAt: now,
      sender: {
        senderId: "sender_1",
        displayName: "Project Office",
        roleLabel: "PMO",
      },
      subject: "Status update",
      body: "Please review the plan.",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    const rehydrated = rehydrateLearnerMessageOccurrence(
      serializeLearnerMessageOccurrence(created.value),
    );
    expect(rehydrated.ok).toBe(true);
    if (!rehydrated.ok) {
      return;
    }
    expect(learnerMessageSemanticEqual(created.value, rehydrated.value)).toBe(
      true,
    );
  });

  it("rejects empty subject/body and markup", () => {
    expect(
      createLearnerMessageOccurrence({
        occurrenceId: asLearnerMessageOccurrenceId("learner_message:occ_2"),
        definitionId: asLearnerMessageDefinitionId("msg_def_1"),
        definitionVersion: "1",
        deliverySequence: 1,
        deliveredAt: null,
        sender: { senderId: null, displayName: "Office", roleLabel: null },
        subject: "   ",
        body: "Body",
      }).ok,
    ).toBe(false);
    expect(
      createLearnerMessageOccurrence({
        occurrenceId: asLearnerMessageOccurrenceId("learner_message:occ_3"),
        definitionId: asLearnerMessageDefinitionId("msg_def_1"),
        definitionVersion: "1",
        deliverySequence: 1,
        deliveredAt: null,
        sender: { senderId: null, displayName: "Office", roleLabel: null },
        subject: "Hello",
        body: "<script>alert(1)</script>",
      }).ok,
    ).toBe(false);
  });

  it("upcasts v2 state without learnerMessages to empty history", () => {
    const parsed = parseSimulationState({
      schemaVersion: 2,
      stateVersion: 0,
      projectMetrics: {},
      projectState: {
        status: "initiated",
        updatedAt: now,
        reasonCode: null,
      },
      chapterProgress: [],
      dayProgress: [],
      activityProgress: [],
      decisions: [],
      decisionOutcomes: [],
      consequences: [],
      scheduledEvents: [],
    });
    expect(parsed?.schemaVersion).toBe(8);
    expect(parsed?.learnerMessages).toEqual([]);
  });
});

describe("deliver_learner_message consequence", () => {
  it("delivers one stable occurrence through SubmitDecision", () => {
    let eventCounter = 0;
    const result = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_msg"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_b"),
      definition,
      sourceActionId: asActionRecordId("action_msg_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_decision_msg"),
      correlationId: asCorrelationId("corr_msg"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_msg_${(eventCounter += 1)}`),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.run.state.learnerMessages).toHaveLength(1);
    const occurrence = result.value.run.state.learnerMessages[0]!;
    expect(
      occurrence.occurrenceId.startsWith("learner_message:consequence:"),
    ).toBe(true);
    expect(occurrence.deliverySequence).toBe(1);
    expect(occurrence.deliveryStatus).toBe("delivered");
    expect(occurrence.subject).toBe("Decision recorded");
    expect(
      result.value.events.filter(
        (event) => event.eventType === "LearnerMessageDelivered",
      ),
    ).toHaveLength(1);

    const parsed = parseSimulationState(
      serializeSimulationState(result.value.run.state),
    );
    expect(parsed?.learnerMessages).toHaveLength(1);
    expect(parsed?.learnerMessages[0]?.occurrenceId).toBe(
      occurrence.occurrenceId,
    );
  });

  it("does not duplicate occurrence when the same decision is already resolved", () => {
    let eventCounter = 0;
    const first = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_msg_a"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_b"),
      definition,
      sourceActionId: asActionRecordId("action_msg_a"),
      submittedBy: asActorId("actor_1"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_decision_msg_a"),
      correlationId: asCorrelationId("corr_msg_a"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_msg_a_${(eventCounter += 1)}`),
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.run.state.learnerMessages).toHaveLength(1);

    const second = processSubmitDecision(first.value.run, {
      decisionRecordId: asDecisionRecordId("decision_record_msg_b"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_b"),
      definition,
      sourceActionId: asActionRecordId("action_msg_b"),
      submittedBy: asActorId("actor_1"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_decision_msg_b"),
      correlationId: asCorrelationId("corr_msg_b"),
      causationId: null,
      allocateEventId: () => asEventId("evt_unused"),
    });
    expect(second.ok).toBe(false);
    expect(first.value.run.state.learnerMessages).toHaveLength(1);
  });
});
