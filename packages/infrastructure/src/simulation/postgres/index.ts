/**
 * PostgreSQL / Supabase-backed infrastructure adapters (PS-004B / PS-004C).
 *
 * Durable replacements for the in-memory adapters from PS-004A, plus the outbox
 * relay and capability-based authorization from PS-004C. All adapters implement
 * existing application/domain ports; the application and domain layers are
 * unchanged.
 */
export * from "./database";
export * from "./database.types";
export * from "./postgres-simulation-state-repository";
export * from "./postgres-simulation-run-repository";
export * from "./postgres-action-sequencer";
export * from "./postgres-idempotency-store";
export * from "./postgres-outbox-publisher";
export * from "./event-bus";
export * from "./outbox-relay";
export * from "./postgres-composition-root";
export * from "./postgres-projection-repository";
export * from "./postgres-projection-processing-target-repository";
export * from "./relay-worker-loop";
export * from "./discover-relay-tenants";
export * from "./test-db-cleanup";
