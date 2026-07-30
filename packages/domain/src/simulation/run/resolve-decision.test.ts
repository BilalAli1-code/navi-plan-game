import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asConsequenceDefinitionId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionOutcomeDefinitionId,
  asDecisionRecordId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asMetricKey,
  asResolverVersion,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  parseSimulationState,
  processSubmitDecision,
  resolveDecision,
  serializeSimulationState,
  submitDecision,
  type SimulationRun,
} from "../../index";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const decisionDefinitionId = asDecisionId("decision_1");

const definition = createScaffoldDecisionDefinition({
  id: decisionDefinitionId,
  contentPackageVersionId,
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

const allocateEventId = (() => {
  let n = 0;
  return () => asEventId(`evt_res_${(n += 1)}`);
})();

describe("processSubmitDecision", () => {
  it("submits and resolves atomically with one version bump and ordered consequences", () => {
    let eventCounter = 0;
    const result = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_b"),
      definition,
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: asIsoTimestamp("2026-07-25T12:00:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-25T12:00:00.100Z"),
      eventId: asEventId("evt_decision_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_${(eventCounter += 1)}`),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.decision.status).toBe("resolved");
    expect(result.value.run.aggregateVersion).toBe(3);
    expect(result.value.run.lastProcessedSequence).toBe(1);
    expect(result.value.run.state.stateVersion).toBe(1);
    expect(result.value.run.state.decisionOutcomes).toHaveLength(1);
    expect(result.value.run.state.consequences).toHaveLength(7);
    expect(result.value.run.state.scheduledEvents).toHaveLength(1);
    expect(result.value.run.state.projectMetrics.budget?.value).toBe(105);
    expect(result.value.run.state.projectState.status).toBe("planning");
    expect(result.value.events[0]?.eventType).toBe("DecisionSubmitted");
    expect(result.value.events.at(-1)?.eventType).toBe("DecisionResolved");
    expect(
      new Set(result.value.events.map((event) => event.sequenceNumber)).size,
    ).toBe(1);
    expect(
      result.value.events.every((event) => event.aggregateVersion === 3),
    ).toBe(true);

    const createdOrder = result.value.events
      .filter((event) => event.eventType === "ConsequenceCreated")
      .map((event) =>
        event.eventType === "ConsequenceCreated"
          ? event.payload.consequenceDefinitionId
          : null,
      );
    expect(createdOrder).toEqual([
      "outcome_b_metric",
      "outcome_b_state",
      "outcome_b_schedule",
      "outcome_b_learning",
      "outcome_b_stakeholder",
      "outcome_b_analytics",
      "outcome_b_learner_message",
    ]);
    expect(result.value.run.state.learnerMessages).toHaveLength(1);
    expect(result.value.run.state.learnerMessages[0]?.subject).toBe(
      "Decision recorded",
    );
    expect(
      result.value.events.some(
        (event) => event.eventType === "LearnerMessageDelivered",
      ),
    ).toBe(true);
  });

  it("fails closed on unsupported consequence types without mutation", () => {
    const badDefinition = {
      ...definition,
      options: [
        {
          ...definition.options[0]!,
          outcome: {
            id: asDecisionOutcomeDefinitionId("bad_outcome"),
            resolverVersion: asResolverVersion("decision-resolver/v1"),
            qualityClassification: null,
            explanationReference: null,
            consequenceDefinitions: [
              {
                id: asConsequenceDefinitionId("bad"),
                type: "risk_create" as "project_metric_delta",
                timing: "immediate" as const,
                target: {
                  kind: "project_metric" as const,
                  metricKey: asMetricKey("budget"),
                },
                payload: {
                  metricKey: asMetricKey("budget"),
                  delta: 1,
                  reasonCode: "x",
                },
              },
            ],
          },
        },
      ],
    };

    const run = activeRun();
    const result = processSubmitDecision(run, {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_a"),
      definition: badDefinition,
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: asIsoTimestamp("2026-07-25T12:00:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-25T12:00:00.100Z"),
      eventId: asEventId("evt_decision_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONSEQUENCE_TYPE_UNSUPPORTED");
    }
    expect(run.state.decisions).toHaveLength(0);
    expect(run.state.consequences).toHaveLength(0);
  });

  it("rejects metric bound violations and invalid project-state transitions", () => {
    const overBudget = {
      ...definition,
      options: [
        {
          ...definition.options[1]!,
          outcome: {
            ...definition.options[1]!.outcome,
            consequenceDefinitions: [
              {
                id: asConsequenceDefinitionId("huge_delta"),
                type: "project_metric_delta" as const,
                timing: "immediate" as const,
                target: {
                  kind: "project_metric" as const,
                  metricKey: asMetricKey("budget"),
                },
                payload: {
                  metricKey: asMetricKey("budget"),
                  delta: 1000,
                  reasonCode: "TOO_LARGE",
                },
              },
            ],
          },
        },
      ],
    };
    const metricResult = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_b"),
      definition: overBudget,
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: asIsoTimestamp("2026-07-25T12:00:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-25T12:00:00.100Z"),
      eventId: asEventId("evt_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId,
    });
    expect(metricResult.ok).toBe(false);
    if (!metricResult.ok) {
      expect(metricResult.error.code).toBe("METRIC_BOUNDS_EXCEEDED");
    }

    const invalidState = {
      ...definition,
      options: [
        {
          ...definition.options[1]!,
          outcome: {
            ...definition.options[1]!.outcome,
            consequenceDefinitions: [
              {
                id: asConsequenceDefinitionId("bad_state"),
                type: "project_state_transition" as const,
                timing: "immediate" as const,
                target: { kind: "project_state" as const },
                payload: {
                  nextStatus: "closed" as const,
                  reasonCode: "SKIP",
                },
              },
            ],
          },
        },
      ],
    };
    const stateResult = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_2"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_b"),
      definition: invalidState,
      sourceActionId: asActionRecordId("action_2"),
      submittedBy: asActorId("actor_1"),
      submittedAt: asIsoTimestamp("2026-07-25T12:00:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-25T12:00:00.100Z"),
      eventId: asEventId("evt_2"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId,
    });
    expect(stateResult.ok).toBe(false);
    if (!stateResult.ok) {
      expect(stateResult.error.code).toBe("PROJECT_STATE_TRANSITION_INVALID");
    }
  });

  it("round-trips resolved outcomes and consequences", () => {
    let eventCounter = 0;
    const result = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_a"),
      definition,
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: asIsoTimestamp("2026-07-25T12:00:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-25T12:00:00.100Z"),
      eventId: asEventId("evt_decision_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_${(eventCounter += 1)}`),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const parsed = parseSimulationState(
      serializeSimulationState(result.value.run.state),
    );
    expect(parsed?.decisionOutcomes).toHaveLength(1);
    expect(parsed?.consequences).toHaveLength(7);
    expect(parsed?.scheduledEvents).toHaveLength(1);
    expect(parsed?.decisions[0]?.status).toBe("resolved");
    expect(parsed?.projectMetrics.budget?.value).toBe(90);
  });
});

describe("resolveDecision recovery", () => {
  it("resolves a previously submitted Decision exactly once", () => {
    const submitted = submitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_b"),
      definition,
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: asIsoTimestamp("2026-07-25T12:00:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-25T12:00:00.100Z"),
      eventId: asEventId("evt_decision_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
    });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) {
      return;
    }

    let eventCounter = 0;
    const first = resolveDecision(submitted.value.run, {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      definition,
      resolvedAt: asIsoTimestamp("2026-07-25T12:05:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-25T12:05:00.100Z"),
      correlationId: asCorrelationId("corr_recovery"),
      causationId: null,
      actorId: asActorId("system_recovery"),
      allocateEventId: () => asEventId(`evt_r_${(eventCounter += 1)}`),
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.alreadyResolved).toBe(false);
    expect(first.value.decision.status).toBe("resolved");
    expect(first.value.run.state.consequences).toHaveLength(7);

    const second = resolveDecision(first.value.run, {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      definition,
      resolvedAt: asIsoTimestamp("2026-07-25T12:06:00.000Z"),
      recordedAt: asIsoTimestamp("2026-07-25T12:06:00.100Z"),
      correlationId: asCorrelationId("corr_recovery_2"),
      causationId: null,
      actorId: asActorId("system_recovery"),
      allocateEventId: () => asEventId(`evt_r2_${(eventCounter += 1)}`),
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value.alreadyResolved).toBe(true);
    expect(second.value.events).toHaveLength(0);
    expect(second.value.run.aggregateVersion).toBe(
      first.value.run.aggregateVersion,
    );
    expect(second.value.run.state.consequences).toHaveLength(7);
  });
});
