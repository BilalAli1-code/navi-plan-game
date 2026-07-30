import { defineConfig } from "vitest/config";

/**
 * Postgres integration suites use tenant-scoped cleanup (BC-005 / REL-010).
 * File parallelism is enabled so concurrent files do not share truncate locks;
 * each suite must clean only its own tenant IDs via `cleanupPostgresTenants`.
 */
export default defineConfig({
  test: {
    fileParallelism: true,
  },
});
