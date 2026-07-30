/**
 * BC-005 — tenant-scoped Postgres test cleanup.
 *
 * Integration suites previously used global TRUNCATE, which takes ACCESS
 * EXCLUSIVE locks and wipes concurrent suites sharing `projectsim_test`.
 * Prefer deleting only the tenants owned by the calling file/test.
 *
 * Table order matches `apps/api/src/e2e/routes.ts` `deleteTenantRows`.
 */

import pkg from "pg";

const { Client } = pkg;

export const POSTGRES_SIMULATION_CLEANUP_TABLES = [
  "projection_processing_target",
  "projection_event_inbox",
  "simulation_projection",
  "event_outbox",
  "idempotency_receipts",
  "simulation_state",
  "tenant_memberships",
] as const;

export type PostgresQueryClient = {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
};

/**
 * Delete all simulation/projection rows for one tenant. Safe under parallel
 * Vitest file execution when each suite uses unique tenant IDs.
 */
export const deletePostgresTenantRows = async (
  client: PostgresQueryClient,
  tenantId: string,
): Promise<void> => {
  for (const table of POSTGRES_SIMULATION_CLEANUP_TABLES) {
    await client.query(`delete from ${table} where tenant_id = $1`, [tenantId]);
  }
};

export const deletePostgresTenantsRows = async (
  client: PostgresQueryClient,
  tenantIds: readonly string[],
): Promise<void> => {
  const unique = [...new Set(tenantIds.filter((id) => id.trim().length > 0))];
  for (const tenantId of unique) {
    await deletePostgresTenantRows(client, tenantId);
  }
};

/**
 * Connect as DATABASE_ADMIN_URL (or equivalent) and delete tenant-scoped rows.
 * No-ops when adminUrl is missing.
 */
export const cleanupPostgresTenants = async (input: {
  readonly adminUrl: string | undefined | null;
  readonly tenantIds: readonly string[];
}): Promise<void> => {
  if (!input.adminUrl || input.tenantIds.length === 0) {
    return;
  }
  const client = new Client({ connectionString: input.adminUrl });
  await client.connect();
  try {
    await deletePostgresTenantsRows(client, input.tenantIds);
  } finally {
    await client.end();
  }
};
