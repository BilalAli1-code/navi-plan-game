import type { CommandResult } from "@projectsim/domain";
import type { IdempotencyStore } from "@projectsim/application";
import type { PostgresDatabase } from "./database";

const DEFAULT_RETENTION_SECONDS = 24 * 60 * 60;

export interface PostgresIdempotencyStoreOptions {
  /** How long receipts remain replayable, in seconds. Defaults to 24h. */
  readonly retentionSeconds?: number;
}

interface ReceiptRow {
  readonly result: CommandResult;
}

/**
 * PostgreSQL-backed {@link IdempotencyStore} with retention.
 *
 * Receipts are stored durably in `idempotency_receipts` keyed by command id and
 * expire after `retentionSeconds`. `recall` returns a stored result only while
 * it is unexpired, so a safe retry replays the original receipt; because the
 * application service consults `recall` before publishing, a duplicate command
 * never re-publishes its event. Tenant isolation is enforced by RLS.
 */
export const createPostgresIdempotencyStore = (
  database: PostgresDatabase,
  tenantId: string,
  options: PostgresIdempotencyStoreOptions = {},
): IdempotencyStore => {
  const retentionSeconds =
    options.retentionSeconds ?? DEFAULT_RETENTION_SECONDS;

  return {
    async recall(commandId) {
      return database.withTenantTransaction(tenantId, async (client) => {
        const result = await client.query<ReceiptRow>(
          "select result from idempotency_receipts where command_id = $1 and expires_at > now()",
          [commandId],
        );
        return result.rows[0]?.result ?? null;
      });
    },

    async remember(commandId, result) {
      await database.withTenantTransaction(tenantId, async (client) => {
        await client.query(
          `insert into idempotency_receipts (tenant_id, command_id, result, expires_at)
             values ($1, $2, $3::jsonb, now() + make_interval(secs => $4))
           on conflict (tenant_id, command_id)
             do update set result = excluded.result, expires_at = excluded.expires_at`,
          [tenantId, commandId, JSON.stringify(result), retentionSeconds],
        );
      });
    },
  };
};
