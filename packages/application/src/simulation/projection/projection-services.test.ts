import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionRecordId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  err,
  ok,
  processSubmitDecision,
  type AuthorizationError,
  type SimulationProjection,
  type SimulationRun,
} from "@projectsim/domain";
import type { Clock, IdentifierGenerator } from "../ports";
import type { SimulationRunRepository } from "../simulation-run-repository";
import type { DecisionProjectionContentProvider } from "./decision-projection-content-provider";
import { createGetSimulationProjectionService } from "./get-simulation-projection-service";
import type { SimulationProjectionAuthorizer } from "./projection-authorizer";
import { createProjectionEventConsumer } from "./projection-event-consumer";
import { createRebuildSimulationProjectionService } from "./rebuild-simulation-projection-service";
import type { SimulationProjectionRepository } from "./simulation-projection-repository";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const runId = asSimulationRunId("run_1");
const actorId = asActorId("actor_1");
const now = asIsoTimestamp("2026-07-25T12:00:00.000Z");

const definition = createScaffoldDecisionDefinition({
  id: asDecisionId("decision_1"),
  contentPackageVersionId,
});

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: runId,
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

const createRunRepo = (
  runs: Map<string, SimulationRun>,
): SimulationRunRepository => ({
  getById: async (_tenant, id) => runs.get(id) ?? null,
  save: async () => {
    throw new Error("authoritative save must not be called by projection");
  },
});

const createProjectionRepo = (): SimulationProjectionRepository & {
  rows: Map<string, SimulationProjection>;
  failNextSave: boolean;
} => {
  const rows = new Map<string, SimulationProjection>();
  return {
    rows,
    failNextSave: false,
    async get(t, id) {
      return rows.get(`${t}:${id}`) ?? null;
    },
    async saveIfNewer(projection) {
      if (this.failNextSave) {
        this.failNextSave = false;
        return err({
          kind: "rule_violation",
          code: "PROJECTION_PERSISTENCE_FAILED",
          retryable: false,
          message: "forced failure",
        });
      }
      const key = `${projection.tenantId}:${projection.simulationRunId}`;
      const existing = rows.get(key);
      if (!existing) {
        rows.set(key, projection);
        return ok({ kind: "inserted" });
      }
      if (
        existing.sourceAggregateVersion === projection.sourceAggregateVersion &&
        existing.sourceStateVersion === projection.sourceStateVersion &&
        existing.sourceActionSequence === projection.sourceActionSequence
      ) {
        if (existing.semanticHash !== projection.semanticHash) {
          return err({
            kind: "rule_violation",
            code: "PROJECTION_NONDETERMINISTIC",
            retryable: false,
            message: "hash mismatch",
          });
        }
        return ok({ kind: "unchanged" });
      }
      rows.set(key, projection);
      return ok({ kind: "replaced" });
    },
    async delete(t, id) {
      rows.delete(`${t}:${id}`);
      return ok(undefined);
    },
  };
};

const contentProvider: DecisionProjectionContentProvider = {
  async listProjectionSafeContent() {
    return {
      contentPackageVersionId,
      messages: [],
      chapters: [],
      meetings: [],
      documents: [],
      activities: [],
      decisions: [
        {
          id: definition.id,
          contentPackageVersionId,
          authoredOrder: 0,
          title: "Scaffold Decision",
          prompt: "Choose",
          description: null,
          availability: "available",
          expiresAt: null,
          options: definition.options.map((option, index) => ({
            id: option.id,
            authoredOrder: index,
            label: option.id,
          })),
          publicResultSummaryByOptionId: {},
        },
      ],
    };
  },
  async listEligibilityDefinitions() {
    return [definition];
  },
};

const clock: Clock = { now: () => now };
const identifiers: IdentifierGenerator = {
  nextEventId: (() => {
    let n = 0;
    return () => asEventId(`proj_evt_${(n += 1)}`);
  })(),
  nextActionRecordId: () => asActionRecordId("action_unused"),
  nextSimulationRunId: () => asSimulationRunId("run_unused"),
  nextDecisionRecordId: () => asDecisionRecordId("decision_unused"),
};

const allowAuthorizer: SimulationProjectionAuthorizer = {
  authorizeView: async () => ok(undefined),
};

const denyAuthorizer: SimulationProjectionAuthorizer = {
  authorizeView: async () =>
    err<AuthorizationError>({
      kind: "authorization",
      code: "PERMISSION_DENIED",
      retryable: false,
      message: "denied",
    }),
};

describe("RebuildSimulationProjection / GetSimulationProjection", () => {
  it("rebuilds an initial projection for an active run", async () => {
    const runs = new Map([[runId, activeRun()]]);
    const projectionRepository = createProjectionRepo();
    const rebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(runs),
      projectionRepository,
      contentProvider,
      clock,
      identifiers,
    });
    const result = await rebuild.rebuild({
      simulationRunId: runId,
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      actorId,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.saveResult).toBe("inserted");
    expect(result.value.projection.availableDecisions).toHaveLength(1);
    expect(runs.get(runId)?.aggregateVersion).toBe(2);
  });

  it("returns current cached projection without rewriting", async () => {
    const runs = new Map([[runId, activeRun()]]);
    const projectionRepository = createProjectionRepo();
    const rebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(runs),
      projectionRepository,
      contentProvider,
      clock,
      identifiers,
    });
    const get = createGetSimulationProjectionService({
      tenantId,
      authorizer: allowAuthorizer,
      runRepository: createRunRepo(runs),
      projectionRepository,
      rebuildService: rebuild,
    });
    const first = await get.get({
      simulationRunId: runId,
      actorId,
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.freshness).toBe("current");
    const second = await get.get({
      simulationRunId: runId,
      actorId,
      correlationId: asCorrelationId("corr_2"),
      causationId: null,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value.freshness).toBe("current");
    expect(second.value.projection.semanticHash).toBe(
      first.value.projection.semanticHash,
    );
  });

  it("rebuilds when cached projection is stale", async () => {
    const runs = new Map([[runId, activeRun()]]);
    const projectionRepository = createProjectionRepo();
    const rebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(runs),
      projectionRepository,
      contentProvider,
      clock,
      identifiers,
    });
    const get = createGetSimulationProjectionService({
      tenantId,
      authorizer: allowAuthorizer,
      runRepository: createRunRepo(runs),
      projectionRepository,
      rebuildService: rebuild,
    });
    await get.get({
      simulationRunId: runId,
      actorId,
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
    });
    let eventCounter = 0;
    const resolved = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId: definition.id,
      selectedOptionId: definition.options[0]!.id,
      definition,
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: actorId,
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_extra_${(eventCounter += 1)}`),
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) {
      return;
    }
    runs.set(runId, resolved.value.run);
    const refreshed = await get.get({
      simulationRunId: runId,
      actorId,
      correlationId: asCorrelationId("corr_3"),
      causationId: null,
    });
    expect(refreshed.ok).toBe(true);
    if (!refreshed.ok) {
      return;
    }
    expect(refreshed.value.freshness).toBe("current");
    expect(refreshed.value.projection.decisionHistory).toHaveLength(1);
    expect(refreshed.value.projection.availableDecisions).toEqual([]);
  });

  it("denies unauthorized reads", async () => {
    const runs = new Map([[runId, activeRun()]]);
    const projectionRepository = createProjectionRepo();
    const rebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(runs),
      projectionRepository,
      contentProvider,
      clock,
      identifiers,
    });
    const get = createGetSimulationProjectionService({
      tenantId,
      authorizer: denyAuthorizer,
      runRepository: createRunRepo(runs),
      projectionRepository,
      rebuildService: rebuild,
    });
    const result = await get.get({
      simulationRunId: runId,
      actorId,
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("PERMISSION_DENIED");
  });

  it("preserves prior projection when rebuild persistence fails", async () => {
    const runs = new Map([[runId, activeRun()]]);
    const projectionRepository = createProjectionRepo();
    const rebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(runs),
      projectionRepository,
      contentProvider,
      clock,
      identifiers,
    });
    const get = createGetSimulationProjectionService({
      tenantId,
      authorizer: allowAuthorizer,
      runRepository: createRunRepo(runs),
      projectionRepository,
      rebuildService: rebuild,
    });
    const first = await get.get({
      simulationRunId: runId,
      actorId,
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    runs.set(
      runId,
      activeRun({ aggregateVersion: 3, lastProcessedSequence: 1 }),
    );
    projectionRepository.failNextSave = true;
    const failed = await get.get({
      simulationRunId: runId,
      actorId,
      correlationId: asCorrelationId("corr_2"),
      causationId: null,
    });
    expect(failed.ok).toBe(true);
    if (!failed.ok) {
      return;
    }
    expect(failed.value.freshness).toBe("rebuild_failed");
    expect(failed.value.projection.semanticHash).toBe(
      first.value.projection.semanticHash,
    );
    expect(runs.get(runId)?.aggregateVersion).toBe(3);
  });

  it("returns not found for missing runs", async () => {
    const rebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(new Map()),
      projectionRepository: createProjectionRepo(),
      contentProvider,
      clock,
      identifiers,
    });
    const result = await rebuild.rebuild({
      simulationRunId: runId,
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      actorId,
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("SIMULATION_RUN_NOT_FOUND");
  });
});

describe("ProjectionEventConsumer", () => {
  it("rebuilds on DecisionResolved and deduplicates by event id", async () => {
    let eventCounter = 0;
    const resolved = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId: definition.id,
      selectedOptionId: definition.options[0]!.id,
      definition,
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: actorId,
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_extra_${(eventCounter += 1)}`),
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) {
      return;
    }
    const runs = new Map([[runId, resolved.value.run]]);
    const projectionRepository = createProjectionRepo();
    let rebuildCount = 0;
    const baseRebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(runs),
      projectionRepository,
      contentProvider,
      clock,
      identifiers,
    });
    const rebuild = {
      rebuild: async (input: Parameters<typeof baseRebuild.rebuild>[0]) => {
        rebuildCount += 1;
        return baseRebuild.rebuild(input);
      },
    };
    const processed = new Set<string>();
    const consumer = createProjectionEventConsumer({
      tenantId,
      rebuildService: rebuild,
      hasProcessedEventId: async (id) => processed.has(id),
      rememberProcessedEventId: async (id) => {
        processed.add(id);
      },
    });

    const event = resolved.value.events.find(
      (entry) => entry.eventType === "DecisionResolved",
    );
    expect(event).toBeDefined();
    if (!event) {
      return;
    }
    await consumer.handle(event);
    await consumer.handle(event);
    expect(rebuildCount).toBe(1);
    expect(projectionRepository.rows.size).toBe(1);

    // Unique events sharing one action sequence are not skipped.
    const metricEvent = resolved.value.events.find(
      (entry) => entry.eventType === "ProjectMetricChanged",
    );
    expect(metricEvent).toBeDefined();
    if (!metricEvent) {
      return;
    }
    expect(metricEvent.sequenceNumber).toBe(event.sequenceNumber);
    await consumer.handle(metricEvent);
    expect(rebuildCount).toBe(2);
  });

  it("never throws to EventBus when rebuild fails unexpectedly", async () => {
    const consumer = createProjectionEventConsumer({
      tenantId,
      rebuildService: {
        rebuild: async () => {
          throw new Error("unexpected infra failure");
        },
      },
      hasProcessedEventId: async () => false,
      rememberProcessedEventId: async () => undefined,
    });
    await expect(
      consumer.handle({
        eventId: asEventId("evt_boom"),
        eventType: "DecisionResolved",
        eventVersion: 1,
        aggregateId: runId,
        aggregateType: "SimulationRun",
        aggregateVersion: 3,
        sequenceNumber: 1,
        occurredAt: now,
        recordedAt: now,
        actorId,
        correlationId: asCorrelationId("corr_1"),
        causationId: null,
        tenantId,
        simulationRunId: runId,
        payload: {} as never,
      }),
    ).resolves.toBeUndefined();
  });

  it("marks inbox only after success and treats same-source retry as unchanged", async () => {
    const runs = new Map([[runId, activeRun()]]);
    const projectionRepository = createProjectionRepo();
    const rebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(runs),
      projectionRepository,
      contentProvider,
      clock,
      identifiers,
    });
    const processed = new Set<string>();
    const consumer = createProjectionEventConsumer({
      tenantId,
      rebuildService: rebuild,
      hasProcessedEventId: async (id) => processed.has(id),
      rememberProcessedEventId: async (id) => {
        processed.add(id);
      },
    });
    const trigger = {
      eventId: asEventId("evt_crash_window"),
      eventType: "SimulationRunStarted" as const,
      eventVersion: 1,
      aggregateId: runId,
      aggregateType: "SimulationRun" as const,
      aggregateVersion: 2,
      sequenceNumber: 0,
      occurredAt: now,
      recordedAt: now,
      actorId,
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      tenantId,
      simulationRunId: runId,
      payload: {} as never,
    };
    await consumer.handle(trigger);
    expect(processed.has("evt_crash_window")).toBe(true);
    const firstHash = [...projectionRepository.rows.values()][0]?.semanticHash;
    // Simulate crash-window retry: clear inbox marker after successful save.
    processed.delete("evt_crash_window");
    await consumer.handle(trigger);
    expect(processed.has("evt_crash_window")).toBe(true);
    expect([...projectionRepository.rows.values()][0]?.semanticHash).toBe(
      firstHash,
    );
  });

  it("ignores unsupported events and does not mutate authoritative state", async () => {
    const runs = new Map([[runId, activeRun()]]);
    const before = runs.get(runId)!;
    const projectionRepository = createProjectionRepo();
    const rebuild = createRebuildSimulationProjectionService({
      tenantId,
      runRepository: createRunRepo(runs),
      projectionRepository,
      contentProvider,
      clock,
      identifiers,
    });
    const consumer = createProjectionEventConsumer({
      tenantId,
      rebuildService: rebuild,
      hasProcessedEventId: async () => false,
      rememberProcessedEventId: async () => undefined,
    });
    await consumer.handle({
      eventId: asEventId("evt_other"),
      eventType: "SimulationActionAccepted",
      eventVersion: 1,
      aggregateId: runId,
      aggregateType: "SimulationRun",
      aggregateVersion: 2,
      sequenceNumber: 1,
      occurredAt: now,
      recordedAt: now,
      actorId,
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      tenantId,
      simulationRunId: runId,
      payload: {} as never,
    });
    expect(projectionRepository.rows.size).toBe(0);
    expect(runs.get(runId)).toEqual(before);
  });
});
