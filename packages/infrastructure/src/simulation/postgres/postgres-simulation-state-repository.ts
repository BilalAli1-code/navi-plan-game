import { concurrencyError, err } from "@projectsim/domain";
import type { SimulationRunId } from "@projectsim/domain";
import type {
  PersistedSimulationState,
  SimulationStateRepository,
} from "../simulation-state-repository";
import type { PostgresDatabase } from "./database";

interface SimulationStateRow {
  readonly simulation_run_id: string;
  readonly aggregate_version: number;
  readonly last_sequence_number: number;
}

const toState = (row: SimulationStateRow): PersistedSimulationState => ({
  simulationRunId: row.simulation_run_id as SimulationRunId,
  aggregateVersion: row.aggregate_version,
  lastSequenceNumber: row.last_sequence_number,
});

/**
 * @deprecated PS-ROADMAP-003 compatibility shim.
 *
 * Read-only against `simulation_state`. `save` is disabled so this adapter
 * cannot bypass {@link SimulationRunRepository} lifecycle validation or
 * optimistic-concurrency / outbox atomicity.
 *
 * Removal: delete once sequencer callers are gone (see simulation-state-repository.ts).
 */
export const createPostgresSimulationStateRepository = (
  database: PostgresDatabase,
  tenantId: string,
): SimulationStateRepository => ({
  async load(simulationRunId) {
    return database.withTenantTransaction(tenantId, async (client) => {
      const result = await client.query<SimulationStateRow>(
        "select simulation_run_id, aggregate_version, last_sequence_number from simulation_state where simulation_run_id = $1",
        [simulationRunId],
      );
      const row = result.rows[0];
      return row ? toState(row) : null;
    });
  },

  async save(_next, expectedVersion) {
    void _next;
    return err(concurrencyError(expectedVersion ?? 0, expectedVersion ?? 0));
  },
});
