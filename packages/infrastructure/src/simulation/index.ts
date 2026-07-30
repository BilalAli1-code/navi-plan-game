/**
 * Simulation infrastructure adapters (PS-004A / PS-004B / PS-004C).
 *
 * - PS-004A: in-memory adapters + composition root (non-durable).
 * - PS-004B (`./postgres`): Supabase/PostgreSQL-backed adapters with RLS,
 *   transactional optimistic concurrency, durable idempotency, and a
 *   transactional-outbox DomainEventPublisher.
 * - PS-004C: outbox relay + EventBus sink, capability authorizer + membership
 *   stores, and Supabase migration/deployment helpers.
 *
 * Both families implement the same application/domain ports so they can be
 * swapped at the composition root without changing the application or domain
 * layers.
 */
export * from "./simulation-state-repository";
export * from "./simulation-run-repository";
export * from "./action-sequencer";
export * from "./idempotency-store";
export * from "./event-publisher";
export * from "./clock";
export * from "./identifier-generator";
export * from "./authorizer";
export * from "./decision-definition-provider";
export * from "./composition-root";
export * from "./authorization";
export * from "./projection";
export * from "./postgres";
