import { describe, expect, it } from "vitest";
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
  asSimulationRunId,
  asTenantId,
  createScaffoldDecisionDefinition,
  isAccepted,
  isRejected,
  type DecisionDefinition,
  type SubmitDecisionCommand,
} from "@projectsim/domain";
import { createInMemoryDecisionDefinitionProvider } from "./decision-definition-provider";
import { createInMemoryDomainEventPublisher } from "./event-publisher";
import { createSimulationCommandModule } from "./composition-root";

const tenantId = "tenant_local";
const contentPackageVersionId = asContentPackageVersionId("cpv_1");

const definition: DecisionDefinition = createScaffoldDecisionDefinition({
  id: asDecisionId("decision_1"),
  contentPackageVersionId,
});

const validSubmitDecision: SubmitDecisionCommand = {
  commandId: asCommandId("cmd_1"),
  simulationRunId: asSimulationRunId("run_1"),
  actorId: asActorId("actor_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  expectedVersion: null,
  commandType: "SubmitDecision",
  payload: {
    decisionId: asDecisionId("decision_1"),
    optionId: asDecisionOptionId("option_b"),
  },
};

describe("createSimulationCommandModule (in-memory)", () => {
  it("creates, starts, and submits a decision on an active run", async () => {
    const publisher = createInMemoryDomainEventPublisher();
    const decisionDefinitionProvider = createInMemoryDecisionDefinitionProvider(
      [{ tenantId: asTenantId(tenantId), definition }],
    );
    const module = createSimulationCommandModule({
      tenantId,
      eventPublisher: publisher,
      decisionDefinitionProvider,
    });

    const created = await module.lifecycleService.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId,
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_1"),
    });
    expect(created.ok).toBe(true);

    const started = await module.lifecycleService.start({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      expectedAggregateVersion: null,
    });
    expect(started.ok).toBe(true);

    const result = await module.applicationService.process(validSubmitDecision);
    expect(isAccepted(result)).toBe(true);
    if (isAccepted(result)) {
      expect(result.emittedEvents[0]?.eventType).toBe(
        "SimulationActionAccepted",
      );
      expect(result.emittedEvents[1]?.eventType).toBe("DecisionSubmitted");
      expect(result.emittedEvents.at(-1)?.eventType).toBe("DecisionResolved");
    }
    const run = await module.runRepository.getById(
      asTenantId(tenantId),
      asSimulationRunId("run_1"),
    );
    expect(run?.state.decisions).toHaveLength(1);
    expect(run?.state.decisions[0]?.status).toBe("resolved");
    expect(run?.state.consequences).toHaveLength(7);
    expect(run?.state.learnerMessages).toHaveLength(1);
    expect(
      publisher.published.some((e) => e.eventType === "DecisionResolved"),
    ).toBe(true);
    expect(
      publisher.published.some(
        (e) => e.eventType === "LearnerMessageDelivered",
      ),
    ).toBe(true);
  });

  it("rejects learner actions when the run is not active", async () => {
    const module = createSimulationCommandModule({
      tenantId,
      decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
        { tenantId: asTenantId(tenantId), definition },
      ]),
    });
    await module.lifecycleService.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId,
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_1"),
    });

    const result = await module.applicationService.process(validSubmitDecision);
    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.code).toBe("SIMULATION_RUN_NOT_ACTIVE");
    }
  });

  it("replays idempotent retries without a second outbox/event write", async () => {
    const publisher = createInMemoryDomainEventPublisher();
    const module = createSimulationCommandModule({
      tenantId,
      eventPublisher: publisher,
      decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
        { tenantId: asTenantId(tenantId), definition },
      ]),
    });
    await module.lifecycleService.create({
      actorId: asActorId("actor_1"),
      learnerId: asLearnerId("learner_1"),
      businessCaseId: asBusinessCaseId("case_1"),
      contentPackageVersionId,
      runtimeVersion: "runtime-1",
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      simulationRunId: asSimulationRunId("run_1"),
    });
    await module.lifecycleService.start({
      actorId: asActorId("actor_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      expectedAggregateVersion: null,
    });

    const first = await module.applicationService.process(validSubmitDecision);
    const second = await module.applicationService.process(validSubmitDecision);
    expect(second).toEqual(first);
    expect(
      publisher.published.filter((e) => e.eventType === "DecisionSubmitted"),
    ).toHaveLength(1);
    expect(
      publisher.published.filter((e) => e.eventType === "DecisionResolved"),
    ).toHaveLength(1);
  });
});
