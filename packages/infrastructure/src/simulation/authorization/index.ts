/**
 * Production authorization adapters (PS-004C).
 *
 * Capability-based authorizer implementing the PS-003
 * `SimulationCommandAuthorizer` port, backed by membership stores
 * (in-memory or PostgreSQL).
 */
export * from "./membership";
export * from "./postgres-membership-store";
export * from "./capability-authorizer";
export * from "./lifecycle-authorizer";
export * from "./projection-authorizer";
