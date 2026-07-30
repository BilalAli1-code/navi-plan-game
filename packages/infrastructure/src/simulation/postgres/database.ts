import pkg from "pg";
import type { Pool, PoolClient } from "pg";

const { Pool: PgPool } = pkg;

export type { Pool, PoolClient } from "pg";

export interface PostgresDatabaseOptions {
  /** Postgres connection string (e.g. Supabase `SUPABASE_DB_URL`). */
  readonly connectionString: string;
  readonly maxConnections?: number;
}

/**
 * Infrastructure database-access boundary.
 *
 * The single seam through which Postgres-backed adapters talk to the database.
 * `withTenantTransaction` runs work inside a transaction and sets the Supabase
 * `request.jwt.claims` GUC (transaction-local) so Row-Level Security enforces
 * tenant isolation for every statement in that transaction.
 */
export interface PostgresDatabase {
  readonly pool: Pool;
  withTenantTransaction<T>(
    tenantId: string,
    work: (client: PoolClient) => Promise<T>,
  ): Promise<T>;
  close(): Promise<void>;
}

export const createPostgresDatabase = (
  options: PostgresDatabaseOptions,
): PostgresDatabase => {
  const pool = new PgPool({
    connectionString: options.connectionString,
    max: options.maxConnections ?? 10,
  });

  return {
    pool,

    async withTenantTransaction(tenantId, work) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        // Transaction-local tenant claim (like SET LOCAL) — drives RLS.
        await client.query(
          "select set_config('request.jwt.claims', $1, true)",
          [JSON.stringify({ tenant_id: tenantId })],
        );
        const result = await work(client);
        await client.query("commit");
        return result;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },

    async close() {
      await pool.end();
    },
  };
};
