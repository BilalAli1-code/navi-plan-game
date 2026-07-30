import {
  asBusinessCaseId,
  asChapterId,
  asContentPackageVersionId,
  asDayId,
  asIsoTimestamp,
  asLearnerId,
  concurrencyError,
  createInitialSimulationState,
  err,
  ok,
  rehydrateSimulationRun,
  serializeSimulationState,
  type ConcurrencyError,
  type Result,
  type SimulationDomainEvent,
  type SimulationRun,
  type SimulationRunId,
  type TenantId,
} from "@projectsim/domain";
import type { SimulationRunRepository } from "@projectsim/application";
import type { DomainEventPublisher } from "@projectsim/domain";

/**
 * In-memory {@link SimulationRunRepository} (PS-004A compatibility path).
 *
 * Tenant-isolated map; optimistic concurrency; forwards pending events to an
 * optional {@link DomainEventPublisher} so existing recording tests keep working.
 */
export const createInMemorySimulationRunRepository = (options?: {
  readonly eventPublisher?: DomainEventPublisher;
}): SimulationRunRepository & {
  readonly events: readonly SimulationDomainEvent[];
} => {
  const runs = new Map<string, SimulationRun>();
  const events: SimulationDomainEvent[] = [];
  const key = (tenantId: TenantId, id: SimulationRunId) => `${tenantId}:${id}`;

  return {
    get events() {
      return events;
    },

    async getById(tenantId, simulationRunId) {
      return runs.get(key(tenantId, simulationRunId)) ?? null;
    },

    async save(tenantId, run, expectedAggregateVersion, pendingDomainEvents) {
      if (run.tenantId !== tenantId) {
        return err(concurrencyError(expectedAggregateVersion ?? 0, 0));
      }
      const mapKey = key(tenantId, run.id);
      const existing = runs.get(mapKey) ?? null;

      if (expectedAggregateVersion === null) {
        if (existing) {
          return err(concurrencyError(0, existing.aggregateVersion));
        }
      } else if (!existing) {
        return err(concurrencyError(expectedAggregateVersion, 0));
      } else if (existing.aggregateVersion !== expectedAggregateVersion) {
        return err(
          concurrencyError(expectedAggregateVersion, existing.aggregateVersion),
        );
      }

      // Round-trip through serialize/rehydrate so in-memory matches Postgres rules.
      const rehydrated = rehydrateSimulationRun({
        id: run.id,
        tenantId: run.tenantId,
        learnerId: run.learnerId,
        businessCaseId: run.businessCaseId,
        contentPackageVersionId: run.contentPackageVersionId,
        experienceLevel: run.experienceLevel,
        runtimeVersion: run.runtimeVersion,
        status: run.status,
        aggregateVersion: run.aggregateVersion,
        lastProcessedSequence: run.lastProcessedSequence,
        currentChapterId: run.currentChapterId,
        currentDayId: run.currentDayId,
        startedAt: run.startedAt,
        pausedAt: run.pausedAt,
        completedAt: run.completedAt,
        archivedAt: run.archivedAt,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
        state: serializeSimulationState(run.state),
      });
      if (!rehydrated.ok) {
        throw new Error(rehydrated.error.message);
      }

      runs.set(mapKey, rehydrated.value);
      events.push(...pendingDomainEvents);
      if (options?.eventPublisher && pendingDomainEvents.length > 0) {
        await options.eventPublisher.publish(pendingDomainEvents);
      }
      return ok(undefined);
    },
  };
};

/** Test helper: seed a minimal active run into an in-memory repository. */
export const seedInMemoryActiveRun = async (
  repository: SimulationRunRepository,
  input: {
    readonly tenantId: TenantId;
    readonly simulationRunId: SimulationRunId;
    readonly aggregateVersion?: number;
    readonly lastProcessedSequence?: number;
  },
): Promise<SimulationRun> => {
  const now = asIsoTimestamp("2026-07-25T00:00:00.000Z");
  const created = rehydrateSimulationRun({
    id: input.simulationRunId,
    tenantId: input.tenantId,
    learnerId: asLearnerId("learner_seed"),
    businessCaseId: asBusinessCaseId("case_seed"),
    contentPackageVersionId: asContentPackageVersionId("cpv_seed"),
    runtimeVersion: "runtime-test",
    status: "active",
    aggregateVersion: input.aggregateVersion ?? 1,
    lastProcessedSequence: input.lastProcessedSequence ?? 0,
    currentChapterId: asChapterId("chapter_1"),
    currentDayId: asDayId("day_1"),
    startedAt: now,
    pausedAt: null,
    completedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    state: serializeSimulationState(createInitialSimulationState()),
  });
  if (!created.ok) {
    throw new Error(created.error.message);
  }
  const saved = await repository.save(input.tenantId, created.value, null, []);
  if (!saved.ok) {
    throw new Error(saved.error.message);
  }
  return created.value;
};

export type { Result, ConcurrencyError };
