import type {
  ConcurrencyError,
  Result,
  SimulationDomainEvent,
  SimulationRun,
  SimulationRunId,
  TenantId,
} from "@projectsim/domain";

/**
 * Canonical SimulationRun repository port (PS-ROADMAP-003).
 *
 * Sole authoritative persistence boundary for the SimulationRun aggregate.
 * Single authoritative persistence port for SimulationRun. Legacy
 * SimulationStateRepository / action-sequencer adapters are deprecated shims
 * and must not write independently.
 *
 * `expectedAggregateVersion` is the version observed at load time (`null` for
 * insert). Implementations enforce optimistic concurrency and, when events are
 * provided, persist them in the same transaction as the aggregate snapshot.
 */
export interface SimulationRunRepository {
  getById(
    tenantId: TenantId,
    simulationRunId: SimulationRunId,
  ): Promise<SimulationRun | null>;

  save(
    tenantId: TenantId,
    run: SimulationRun,
    expectedAggregateVersion: number | null,
    pendingDomainEvents: readonly SimulationDomainEvent[],
  ): Promise<Result<void, ConcurrencyError>>;
}
