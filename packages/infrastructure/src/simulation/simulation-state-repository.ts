import {
  concurrencyError,
  err,
  type ConcurrencyError,
  type Result,
  type SimulationRunId,
} from "@projectsim/domain";

/**
 * Persisted simulation aggregate state (infrastructure-internal).
 *
 * @deprecated PS-ROADMAP-003: {@link SimulationRunRepository} is the single
 * authoritative persistence port. This shim remains only so pre-aggregate
 * sequencers compile; it must not write independently to `simulation_state`.
 *
 * Removal path:
 * 1. Delete {@link createSimulationActionSequencer} / Postgres sequencer adapters
 *    once no callers remain (composition roots already use SimulationRunRepository).
 * 2. Delete this module and `postgres-simulation-state-repository.ts`.
 * 3. Drop exports from `packages/infrastructure/src/simulation/index.ts`.
 */
export interface PersistedSimulationState {
  readonly simulationRunId: SimulationRunId;
  readonly aggregateVersion: number;
  readonly lastSequenceNumber: number;
}

/**
 * @deprecated Compatibility surface only. Prefer {@link SimulationRunRepository}.
 * `save` is intentionally disabled so this cannot become a second source of truth.
 */
export interface SimulationStateRepository {
  /** Loads persisted state for a run, or `null` when the run has no state yet. */
  load(
    simulationRunId: SimulationRunId,
  ): Promise<PersistedSimulationState | null>;
  /**
   * Disabled: always rejects. Authoritative writes must go through
   * {@link SimulationRunRepository.save}.
   */
  save(
    next: PersistedSimulationState,
    expectedVersion: number | null,
  ): Promise<Result<PersistedSimulationState, ConcurrencyError>>;
}

const COMPAT_DISABLED_MESSAGE =
  "SimulationStateRepository.save is disabled after PS-ROADMAP-003. " +
  "Use SimulationRunRepository as the single authoritative persistence port.";

/**
 * @deprecated Read-only compatibility stub. `save` always fails closed.
 */
export const createInMemorySimulationStateRepository =
  (): SimulationStateRepository => {
    const states = new Map<string, PersistedSimulationState>();

    return {
      async load(simulationRunId) {
        return states.get(simulationRunId) ?? null;
      },

      async save(_next, expectedVersion) {
        void _next;
        return err(
          concurrencyError(expectedVersion ?? 0, expectedVersion ?? 0),
        );
      },
    };
  };

/** Explicit hard-fail helper for callers that still import the shim. */
export const assertSimulationStateRepositoryWritesDisabled = (): never => {
  throw new Error(COMPAT_DISABLED_MESSAGE);
};
