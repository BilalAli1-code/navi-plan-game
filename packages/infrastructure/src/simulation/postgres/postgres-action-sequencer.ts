import { concurrencyError, err } from "@projectsim/domain";
import type { SimulationActionSequencer } from "@projectsim/application";
import type { PostgresDatabase } from "./database";

/**
 * @deprecated PS-ROADMAP-003: do not allocate sequences outside
 * {@link SimulationRunRepository}. Always rejects without writing.
 *
 * Removal path: delete with the in-memory sequencer once unused.
 */
export const createPostgresSimulationActionSequencer = (
  _database: PostgresDatabase,
  _tenantId: string,
): SimulationActionSequencer => ({
  async allocate({ expectedVersion }) {
    void _database;
    void _tenantId;
    return err(concurrencyError(expectedVersion ?? 0, expectedVersion ?? 0));
  },
});
