import type { PublishableDomainEvent } from "@projectsim/domain";
import type { PostgresDatabase } from "./database";
import type { EventBus } from "./event-bus";

export interface OutboxRelayOptions {
  readonly database: PostgresDatabase;
  /**
   * Tenant that scopes RLS for this relay worker. Production deployments run
   * one relay context per tenant (or a privileged service role that bypasses
   * RLS — service-role credentials stay server-side).
   */
  readonly tenantId: string;
  readonly eventBus: EventBus;
  /** Max rows claimed per tick. Defaults to 50. */
  readonly batchSize?: number;
  /** Max delivery attempts before marking `dead`. Defaults to 5. */
  readonly maxAttempts?: number;
  /**
   * Backoff in seconds for attempt N (1-based). Defaults to exponential
   * `min(300, 2^attempt)`.
   */
  readonly backoffSeconds?: (attempt: number) => number;
}

export interface OutboxRelayTickResult {
  readonly claimed: number;
  readonly published: number;
  readonly failed: number;
  readonly dead: number;
}

interface OutboxRow {
  readonly id: string;
  readonly event_id: string;
  readonly payload: PublishableDomainEvent;
  readonly attempt_count: number;
}

const defaultBackoff = (attempt: number): number => Math.min(300, 2 ** attempt);

/**
 * Claims pending outbox rows, publishes them through an {@link EventBus}, and
 * marks them published (or schedules a retry / dead-letters them).
 *
 * Delivery is at-least-once (07_Event_Processing_Architecture.md). Consumers
 * must be idempotent. Uses `FOR UPDATE SKIP LOCKED` so multiple relay workers
 * can run concurrently without double-claiming a row within a transaction.
 */
export const createOutboxRelay = (options: OutboxRelayOptions) => {
  const batchSize = options.batchSize ?? 50;
  const maxAttempts = options.maxAttempts ?? 5;
  const backoffSeconds = options.backoffSeconds ?? defaultBackoff;

  return {
    async tick(): Promise<OutboxRelayTickResult> {
      return options.database.withTenantTransaction(
        options.tenantId,
        async (client) => {
          const claimed = await client.query<OutboxRow>(
            `select id, event_id, payload, attempt_count
               from event_outbox
              where status = 'pending'
                and available_at <= now()
              order by id
              limit $1
              for update skip locked`,
            [batchSize],
          );

          let published = 0;
          let failed = 0;
          let dead = 0;

          for (const row of claimed.rows) {
            const nextAttempt = row.attempt_count + 1;
            try {
              await options.eventBus.publish(row.payload);
              await client.query(
                `update event_outbox
                    set status = 'published',
                        published_at = now(),
                        attempt_count = $2,
                        last_error = null
                  where id = $1`,
                [row.id, nextAttempt],
              );
              published += 1;
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error);
              if (nextAttempt >= maxAttempts) {
                await client.query(
                  `update event_outbox
                      set status = 'dead',
                          attempt_count = $2,
                          last_error = $3
                    where id = $1`,
                  [row.id, nextAttempt, message],
                );
                dead += 1;
              } else {
                await client.query(
                  `update event_outbox
                      set status = 'pending',
                          attempt_count = $2,
                          last_error = $3,
                          available_at = now() + make_interval(secs => $4)
                    where id = $1`,
                  [row.id, nextAttempt, message, backoffSeconds(nextAttempt)],
                );
                failed += 1;
              }
            }
          }

          return {
            claimed: claimed.rows.length,
            published,
            failed,
            dead,
          };
        },
      );
    },
  };
};

export type OutboxRelay = ReturnType<typeof createOutboxRelay>;
