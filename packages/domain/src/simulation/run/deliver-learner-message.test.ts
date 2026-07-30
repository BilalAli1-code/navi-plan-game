import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asLearnerMessageDefinitionId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  deriveInitLearnerMessageOccurrenceId,
  processDeliverLearnerMessage,
  type SimulationRun,
} from "../../index";

const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");
const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_deliver_msg");
const messageDefinitionId = asLearnerMessageDefinitionId(
  "message.sponsor-welcome",
);

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_deliver_msg"),
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

const deliverInput = (suffix = "1") => ({
  messageDefinitionId,
  definitionVersion: "1",
  senderId: "stakeholder.sponsor",
  senderDisplayName: "Executive Sponsor",
  senderRoleLabel: "Sponsor",
  subject: "Welcome to Chapter One",
  body: "Please review the authorization summary.",
  commandId: asCommandId(`cmd_deliver_${suffix}`),
  occurredAt: now,
  recordedAt: now,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  eventId: asEventId(`evt_deliver_${suffix}`),
});

describe("processDeliverLearnerMessage", () => {
  it("delivers a stable occurrence and emits LearnerMessageDelivered", () => {
    const result = processDeliverLearnerMessage(activeRun(), deliverInput());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.identicalNoop).toBe(false);
    expect(result.value.occurrence.occurrenceId).toBe(
      deriveInitLearnerMessageOccurrenceId(messageDefinitionId),
    );
    expect(result.value.occurrence.occurrenceId).toBe(
      "learner_message:init:message.sponsor-welcome",
    );
    expect(result.value.occurrence.deliverySequence).toBe(1);
    expect(result.value.events.map((event) => event.eventType)).toEqual([
      "LearnerMessageDelivered",
    ]);
    const delivered = result.value.events[0];
    expect(delivered?.eventType).toBe("LearnerMessageDelivered");
    if (delivered?.eventType === "LearnerMessageDelivered") {
      expect(delivered.payload.originDecisionRecordId).toBeNull();
      expect(delivered.payload.consequenceId).toBeNull();
    }
    expect(result.value.run.state.learnerMessages).toHaveLength(1);
  });

  it("treats identical delivery as a no-op without duplicating", () => {
    const first = processDeliverLearnerMessage(activeRun(), deliverInput("a"));
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const retry = processDeliverLearnerMessage(
      first.value.run,
      deliverInput("b"),
    );
    expect(retry.ok).toBe(true);
    if (!retry.ok) {
      return;
    }
    expect(retry.value.identicalNoop).toBe(true);
    expect(retry.value.events).toHaveLength(0);
    expect(retry.value.run.state.learnerMessages).toHaveLength(1);
    expect(retry.value.run.aggregateVersion).toBe(
      first.value.run.aggregateVersion + 1,
    );
  });

  it("rejects conflicting content for the same messageDefinitionId", () => {
    const first = processDeliverLearnerMessage(activeRun(), deliverInput("a"));
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const conflict = processDeliverLearnerMessage(first.value.run, {
      ...deliverInput("conflict"),
      body: "Different body",
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok) {
      return;
    }
    expect(conflict.error.code).toBe("LEARNER_MESSAGE_OCCURRENCE_CONFLICT");
    expect(first.value.run.state.learnerMessages).toHaveLength(1);
  });

  it("rejects delivery when the run is not active", () => {
    const result = processDeliverLearnerMessage(
      activeRun({ status: "paused" }),
      deliverInput(),
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("SIMULATION_RUN_NOT_ACTIVE");
  });
});
