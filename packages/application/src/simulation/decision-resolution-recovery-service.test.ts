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
  concurrencyError,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  err,
  ok,
  submitDecision,
  type DecisionDefinition,
  type SimulationDomainEvent,
  type SimulationRun,
  type TenantId,
} from "@projectsim/domain";
import { createDecisionResolutionRecoveryService } from "./decision-resolution-recovery-service";
import type { DecisionDefinitionProvider } from "./decision-definition-provider";
import type { Clock, IdentifierGenerator } from "./ports";
import type { SimulationRunRepository } from "./simulation-run-repository";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const definition: DecisionDefinition = createScaffoldDecisionDefinition({
  id: asDecisionId("decision_1"),
  contentPackageVersionId,
});

const fixedClock: Clock = {
  now: () => asIsoTimestamp("2026-07-25T13:00:00.000Z"),
};

const identifiers: IdentifierGenerator = (() => {
  let events = 0;
  return {
    nextEventId: () => asEventId(`evt_rec_${(events += 1)}`),
    nextActionRecordId: () => asActionRecordId("action_unused"),
    nextSimulationRunId: () => asSimulationRunId("run_unused"),
    nextDecisionRecordId: () => asDecisionRecordId("decision_unused"),
  };
})();

const activeRunWithSubmittedDecision = (): SimulationRun => {
  const base: SimulationRun = {
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
  };
  const submitted = submitDecision(base, {
    decisionRecordId: asDecisionRecordId("decision_record_1"),
    decisionDefinitionId: asDecisionId("decision_1"),
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
  if (!submitted.ok) {
    throw new Error(submitted.error.message);
  }
  return submitted.value.run;
};

const createRunRepository = (
  seed: SimulationRun,
): SimulationRunRepository & { readonly events: SimulationDomainEvent[] } => {
  const runs = new Map<string, SimulationRun>();
  const events: SimulationDomainEvent[] = [];
  runs.set(`${seed.tenantId}:${seed.id}`, seed);
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
      return ok(undefined);
    },
  };
};

const provider: DecisionDefinitionProvider = {
  getDecisionDefinition: async () => definition,
};

describe("DecisionResolutionRecoveryService", () => {
  it("lists pending submitted decisions and recovers them once", async () => {
    const runRepository = createRunRepository(activeRunWithSubmittedDecision());
    const service = createDecisionResolutionRecoveryService({
      tenantId,
      runRepository,
      decisionDefinitionProvider: provider,
      clock: fixedClock,
      identifiers,
      recoveryActorId: asActorId("system_recovery"),
    });

    const pending = await service.listPendingSubmittedDecisions(
      asSimulationRunId("run_1"),
    );
    expect(pending.ok).toBe(true);
    if (!pending.ok) {
      return;
    }
    expect(pending.value).toEqual(["decision_record_1"]);

    const recovered = await service.recoverSubmittedDecision({
      simulationRunId: asSimulationRunId("run_1"),
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      expectedVersion: null,
      correlationId: asCorrelationId("corr_recovery"),
      causationId: null,
    });
    expect(recovered.ok).toBe(true);
    if (!recovered.ok) {
      return;
    }
    expect(recovered.value.alreadyResolved).toBe(false);
    expect(recovered.value.emittedEvents.at(-1)?.eventType).toBe(
      "DecisionResolved",
    );

    const again = await service.recoverSubmittedDecision({
      simulationRunId: asSimulationRunId("run_1"),
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      expectedVersion: null,
      correlationId: asCorrelationId("corr_recovery_2"),
      causationId: null,
    });
    expect(again.ok).toBe(true);
    if (!again.ok) {
      return;
    }
    expect(again.value.alreadyResolved).toBe(true);
    expect(again.value.emittedEvents).toHaveLength(0);
    expect(
      runRepository.events.filter(
        (event) => event.eventType === "DecisionResolved",
      ),
    ).toHaveLength(1);

    const loaded = await runRepository.getById(
      tenantId,
      asSimulationRunId("run_1"),
    );
    expect(loaded?.state.decisions[0]?.status).toBe("resolved");
    expect(loaded?.state.consequences).toHaveLength(7);
    expect(loaded?.state.learnerMessages).toHaveLength(1);
  });
});
