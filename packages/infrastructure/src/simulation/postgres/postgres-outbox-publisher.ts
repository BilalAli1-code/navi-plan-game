import type {
  DomainEventPublisher,
  PublishableDomainEvent,
} from "@projectsim/domain";
import type { PostgresDatabase } from "./database";

/**
 * Transactional-outbox {@link DomainEventPublisher}.
 *
 * Inserts domain events into `event_outbox` inside a tenant-scoped transaction.
 * Events remain `status='pending'` until the PS-004C outbox relay claims and
 * publishes them. Because the application layer depends only on the domain
 * `DomainEventPublisher` port, this adapter replaces the in-memory publisher
 * with no application/domain change.
 *
 * Accepts Simulation and Projection technical events (PublishableDomainEvent).
 */
export const createPostgresOutboxDomainEventPublisher = (
  database: PostgresDatabase,
  tenantId: string,
): DomainEventPublisher => ({
  async publish(events: readonly PublishableDomainEvent[]) {
    if (events.length === 0) {
      return;
    }

    await database.withTenantTransaction(tenantId, async (client) => {
      for (const event of events) {
        await client.query(
          `insert into event_outbox (
             event_id, tenant_id, event_type, aggregate_id, aggregate_type,
             aggregate_version, sequence_number, simulation_run_id, payload,
             occurred_at, recorded_at, status, attempt_count, available_at
           ) values (
             $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::timestamptz,
             $11::timestamptz, 'pending', 0, now()
           )
           on conflict (event_id) do nothing`,
          [
            event.eventId,
            tenantId,
            event.eventType,
            event.aggregateId,
            event.aggregateType,
            event.aggregateVersion,
            event.sequenceNumber,
            event.simulationRunId,
            JSON.stringify(event),
            event.occurredAt,
            event.recordedAt,
          ],
        );
      }
    });
  },
});
