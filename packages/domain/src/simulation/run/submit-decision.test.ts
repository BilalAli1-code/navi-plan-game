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
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  parseSimulationState,
  serializeSimulationState,
  submitDecision,
  type DecisionDefinition,
  type SimulationRun,
} from "../../index";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const decisionDefinitionId = asDecisionId("decision_1");
const optionId = asDecisionOptionId("option_a");

const availableDefinition = (
  overrides: Partial<DecisionDefinition> = {},
): DecisionDefinition => ({
  ...createScaffoldDecisionDefinition({
    id: decisionDefinitionId,
    contentPackageVersionId,
  }),
  ...overrides,
  options:
    overrides.options ??
    createScaffoldDecisionDefinition({
      id: decisionDefinitionId,
      contentPackageVersionId,
    }).options,
});

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_1"),
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
  startedAt: asIsoTimestamp("2026-07-25T00:00:00.000Z"),
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: asIsoTimestamp("2026-07-25T00:00:00.000Z"),
  updatedAt: asIsoTimestamp("2026-07-25T00:00:00.000Z"),
  state: createInitialSimulationState(),
  ...overrides,
});

const baseInput = {
  decisionRecordId: asDecisionRecordId("decision_record_1"),
  decisionDefinitionId,
  selectedOptionId: optionId,
  definition: availableDefinition(),
  sourceActionId: asActionRecordId("action_1"),
  submittedBy: asActorId("actor_1"),
  submittedAt: asIsoTimestamp("2026-07-25T12:00:00.000Z"),
  recordedAt: asIsoTimestamp("2026-07-25T12:00:00.100Z"),
  eventId: asEventId("evt_decision_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
};

describe("submitDecision", () => {
  it("creates an immutable submitted Decision and advances versions", () => {
    const result = submitDecision(activeRun(), baseInput);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.decision.status).toBe("submitted");
    expect(result.value.run.aggregateVersion).toBe(3);
    expect(result.value.run.lastProcessedSequence).toBe(1);
    expect(result.value.run.state.stateVersion).toBe(1);
    expect(result.value.run.state.decisions).toHaveLength(1);
    expect(result.value.events[0]?.eventType).toBe("DecisionSubmitted");
    expect(result.value.events[0]?.sequenceNumber).toBe(1);
    expect(result.value.events[0]?.aggregateVersion).toBe(3);
    expect(result.value.decision.contextStateVersion).toBe(0);
  });

  it("rejects unknown options, mismatches, and eligibility failures without mutation", () => {
    const run = activeRun();
    const cases = [
      submitDecision(run, {
        ...baseInput,
        selectedOptionId: asDecisionOptionId("missing"),
      }),
      submitDecision(run, {
        ...baseInput,
        definition: availableDefinition({ availability: "unavailable" }),
      }),
      submitDecision(run, {
        ...baseInput,
        definition: availableDefinition({
          expiresAt: asIsoTimestamp("2026-07-25T11:00:00.000Z"),
        }),
      }),
      submitDecision(run, {
        ...baseInput,
        definition: availableDefinition({
          prerequisiteDecisionIds: [asDecisionId("prior")],
        }),
      }),
      submitDecision(run, {
        ...baseInput,
        definition: availableDefinition({
          contentPackageVersionId: asContentPackageVersionId("other"),
        }),
      }),
      submitDecision(activeRun({ status: "paused" }), baseInput),
      submitDecision(activeRun({ status: "completed" }), baseInput),
      submitDecision(activeRun({ status: "archived" }), baseInput),
    ];

    for (const result of cases) {
      expect(result.ok).toBe(false);
    }
    expect(run.state.decisions).toHaveLength(0);
    expect(run.aggregateVersion).toBe(2);
  });

  it("prevents duplicate definition and source-action submissions", () => {
    const first = submitDecision(activeRun(), baseInput);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }

    const duplicateDefinition = submitDecision(first.value.run, {
      ...baseInput,
      decisionRecordId: asDecisionRecordId("decision_record_2"),
      sourceActionId: asActionRecordId("action_2"),
      eventId: asEventId("evt_2"),
    });
    expect(duplicateDefinition.ok).toBe(false);
    if (!duplicateDefinition.ok) {
      expect(duplicateDefinition.error.code).toBe("DECISION_ALREADY_SUBMITTED");
    }

    const secondDef = createScaffoldDecisionDefinition({
      id: asDecisionId("decision_2"),
      contentPackageVersionId,
    });
    const withSecond = submitDecision(first.value.run, {
      ...baseInput,
      decisionRecordId: asDecisionRecordId("decision_record_3"),
      decisionDefinitionId: asDecisionId("decision_2"),
      selectedOptionId: asDecisionOptionId("option_a"),
      definition: secondDef,
      sourceActionId: asActionRecordId("action_1"),
      eventId: asEventId("evt_3"),
    });
    expect(withSecond.ok).toBe(false);
    if (!withSecond.ok) {
      expect(withSecond.error.code).toBe("DECISION_SOURCE_ACTION_DUPLICATE");
    }
  });

  it("round-trips decision history through serialize/parse", () => {
    const submitted = submitDecision(activeRun(), baseInput);
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) {
      return;
    }
    const serialized = serializeSimulationState(submitted.value.run.state);
    const parsed = parseSimulationState(serialized);
    expect(parsed?.decisions).toHaveLength(1);
    expect(parsed?.decisions[0]?.id).toBe("decision_record_1");
    expect(parsed?.stateVersion).toBe(1);
    expect(parsed?.schemaVersion).toBe(8);

    const legacy = parseSimulationState({
      schemaVersion: 1,
      projectMetrics: {},
      chapterProgress: [],
      dayProgress: [],
      activityProgress: [],
      decisions: [],
      consequences: [],
    });
    expect(legacy?.stateVersion).toBe(0);
    expect(legacy?.decisions).toEqual([]);
    expect(legacy?.schemaVersion).toBe(8);

    expect(
      parseSimulationState({
        schemaVersion: 1,
        stateVersion: 0,
        projectMetrics: {},
        chapterProgress: [],
        dayProgress: [],
        activityProgress: [],
        decisions: [{ id: "bad" }],
        consequences: [],
      }),
    ).toBeNull();
  });
});
