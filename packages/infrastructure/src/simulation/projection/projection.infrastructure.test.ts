import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  buildSimulationProjection,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  toSimulationRunReadSnapshot,
  type SimulationRun,
} from "@projectsim/domain";
import { createInMemoryDomainEventPublisher } from "../event-publisher";
import { createInMemorySimulationProjectionRepository } from "./in-memory-projection-repository";
import {
  createInMemoryDecisionProjectionContentProvider,
  createScaffoldProjectionContentRecord,
} from "./projection-content-provider";

const tenantId = asTenantId("tenant_1");
const otherTenant = asTenantId("tenant_2");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const runId = asSimulationRunId("run_1");
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

const buildProjection = async (run: SimulationRun = activeRun()) => {
  const contentProvider = createInMemoryDecisionProjectionContentProvider([
    createScaffoldProjectionContentRecord({
      tenantId,
      contentPackageVersionId,
    }),
  ]);
  const content = await contentProvider.listProjectionSafeContent(
    tenantId,
    contentPackageVersionId,
  );
  const eligibility = await contentProvider.listEligibilityDefinitions(
    tenantId,
    contentPackageVersionId,
  );
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok && content && eligibility).toBeTruthy();
  if (!snapshot.ok || !content || !eligibility) {
    throw new Error("setup failed");
  }
  const built = buildSimulationProjection({
    snapshot: snapshot.value,
    eligibilityDefinitions: eligibility,
    projectionContent: content,
    generatedAt: now,
  });
  expect(built.ok).toBe(true);
  if (!built.ok) {
    throw new Error("build failed");
  }
  return built.value;
};

describe("in-memory simulation projection repository", () => {
  it("saves, gets, rejects stale/same-hash-mismatch, and supports delete/rebuild", async () => {
    const publisher = createInMemoryDomainEventPublisher();
    const repo = createInMemorySimulationProjectionRepository({
      eventPublisher: publisher,
    });
    const projection = await buildProjection();
    const inserted = await repo.saveIfNewer(projection);
    expect(inserted.ok).toBe(true);
    if (!inserted.ok) {
      return;
    }
    expect(inserted.value.kind).toBe("inserted");

    const loaded = await repo.get(tenantId, runId);
    expect(loaded?.semanticHash).toBe(projection.semanticHash);

    const equivalent = await repo.saveIfNewer({
      ...projection,
      generatedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
    });
    expect(equivalent.ok).toBe(true);
    if (!equivalent.ok) {
      return;
    }
    expect(equivalent.value.kind).toBe("unchanged");

    const nondeterministic = await repo.saveIfNewer({
      ...projection,
      semanticHash: projection.semanticHash.replace(/.$/, "0") as never,
    });
    expect(nondeterministic.ok).toBe(false);
    if (nondeterministic.ok) {
      return;
    }
    expect(nondeterministic.error.code).toBe("PROJECTION_NONDETERMINISTIC");

    const newer = await buildProjection(
      activeRun({ aggregateVersion: 3, lastProcessedSequence: 1 }),
    );
    const replaced = await repo.saveIfNewer(newer);
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) {
      return;
    }
    expect(replaced.value.kind).toBe("replaced");

    const stale = await repo.saveIfNewer(projection);
    expect(stale.ok).toBe(false);
    if (stale.ok) {
      return;
    }
    expect(stale.error.code).toBe("PROJECTION_STALE_WRITE");

    await repo.delete(tenantId, runId);
    expect(await repo.get(tenantId, runId)).toBeNull();
    const rebuilt = await repo.saveIfNewer(newer);
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) {
      return;
    }
    expect(rebuilt.value.kind).toBe("inserted");
    expect(await repo.get(otherTenant, runId)).toBeNull();
    void definition;
    void asActorId;
    void asCorrelationId;
    void asEventId;
  });
});

describe("projectionType persistence keys (PS-ROADMAP-010)", () => {
  it("scopes get/delete by projectionType so types do not collide", async () => {
    const repo = createInMemorySimulationProjectionRepository();
    const projection = await buildProjection();
    const inserted = await repo.saveIfNewer(projection);
    expect(inserted.ok).toBe(true);

    expect(await repo.get(tenantId, runId, "simulation")).not.toBeNull();
    expect(await repo.get(tenantId, runId, "mission_control")).toBeNull();

    await repo.delete(tenantId, runId, "mission_control");
    expect(await repo.get(tenantId, runId, "simulation")).not.toBeNull();

    await repo.delete(tenantId, runId, "simulation");
    expect(await repo.get(tenantId, runId, "simulation")).toBeNull();
  });
});

describe("EventBus subscriber isolation", () => {
  it("does not fail publish when a subscriber throws; later subscribers still run", async () => {
    const { createInMemoryEventBus } = await import("../postgres/event-bus");
    const bus = createInMemoryEventBus();
    const seen: string[] = [];
    bus.subscribe(async () => {
      throw new Error("projection boom");
    });
    bus.subscribe(async (event) => {
      seen.push(event.eventId);
    });
    await expect(
      bus.publish({
        eventId: asEventId("evt_bus_1"),
        eventType: "DecisionResolved",
        eventVersion: 1,
        aggregateId: runId,
        aggregateType: "SimulationRun",
        aggregateVersion: 3,
        sequenceNumber: 1,
        occurredAt: now,
        recordedAt: now,
        actorId: asActorId("actor_1"),
        correlationId: asCorrelationId("corr_1"),
        causationId: null,
        tenantId,
        simulationRunId: runId,
        payload: {} as never,
      }),
    ).resolves.toBeUndefined();
    expect(seen).toEqual(["evt_bus_1"]);
    expect(bus.subscriberErrors).toHaveLength(1);
    expect(bus.published).toHaveLength(1);
  });
});

describe("projection-safe content provider", () => {
  it("excludes outcome/consequence internals from projection-safe content", async () => {
    const provider = createInMemoryDecisionProjectionContentProvider([
      createScaffoldProjectionContentRecord({
        tenantId,
        contentPackageVersionId,
      }),
    ]);
    const content = await provider.listProjectionSafeContent(
      tenantId,
      contentPackageVersionId,
    );
    expect(content).not.toBeNull();
    const serialized = JSON.stringify(content);
    expect(serialized).not.toContain("consequenceDefinitions");
    expect(serialized).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(serialized).not.toContain("resolverVersion");
    expect(serialized).not.toContain("learning_signal");
  });
});
