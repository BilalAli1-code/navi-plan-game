# Production Relay Worker and Projection Operations

**Document ID:** PS-WP-023  
**Roadmap:** PS-ROADMAP-023  
**Status:** Implemented  
**Base:** `origin/main` @ PS-022 (`fd3f418`)

## 1. Discovery summary

| Topic | Finding |
|---|---|
| Outbox | `event_outbox` retained; statuses `pending` / `published` / `dead`; claim via `FOR UPDATE SKIP LOCKED` |
| Relay today | `OutboxRelay.tick()` library only; E2E drains via `POST /api/v1/e2e/relay/tick` |
| Event bus | In-process; projection consumer subscribed; subscriber must not throw |
| Inbox | `projection_event_inbox` was event-level `(tenant_id, event_id)` |
| Fan-out | Registry `projectionTypesForEvent`; partial failure continued all targets; event remembered only if all succeed |
| Catch-up | GET sync rebuild retained as resilience fallback |
| Rebuild | Per-type rebuild services reused for admin ops |
| Admin API | None before PS-023 |
| Broker | No Kafka/SQS/Redis — extend PostgreSQL outbox |

## 2. Accepted architecture

### Worker topology

Separate process `apps/worker` (`@projectsim/worker`):

1. Discover tenants with claimable outbox rows or projection targets (`DATABASE_ADMIN_URL`).
2. Per tenant (RLS via `withTenantTransaction`): `outboxRelay.tick()` then claim/process projection targets.
3. Sleep `RELAY_POLL_INTERVAL_MS` when idle.
4. Expose process `/healthz` and `/readyz` on `RELAY_HEALTH_PORT`.

API replicas do **not** run an uncoordinated continuous relay loop.

### Work unit

`ProjectionProcessingTarget` identity:

`(tenantId, eventId, projectionType)` with `simulationRunId` + `eventType` metadata.

### Target materialization (eager)

On Domain event delivery, the consumer inserts one durable target row per interested registry projection (`ON CONFLICT DO NOTHING`), then processes pending targets. Retries claim independently.

### Delivery guarantees

| Layer | Guarantee |
|---|---|
| Outbox → EventBus | At-least-once; outbox retry/dead at event level |
| Projection targets | At-least-once attempts; target-level success receipts |
| Learner-visible projections | Idempotent + monotonic via rebuild + `saveIfNewer` + semantic hash |
| Ordering | Per SimulationRun source position `(aggregateVersion, stateVersion, actionSequence)`; not global total order |
| Transport exactly-once | **Not** claimed |

### Claim / lease

Atomic `UPDATE … WHERE status IN ('pending','retrying') OR (status='claimed' AND claim_expires_at < now()) … FOR UPDATE SKIP LOCKED` then set `claimed` + `claim_expires_at`. Stale claims recover after lease expiry.

### Partial fan-out

Successful targets stay `succeeded`. Failed targets retry independently. Event-level inbox is written only when **all** targets for that event succeed.

### Retry policy (defaults)

- maxAttempts **5** (initial attempt counts as 1)
- exponential backoff `min(maxDelayMs, baseDelayMs * 2^(attempt-1))`
- optional jitter ratio
- exhausted status durable; no silent deletion; manual retry resets to `retrying`

### Replay vs rebuild

| Operation | Meaning |
|---|---|
| Rebuild | Read current authoritative SimulationRun; invoke existing rebuild service; `saveIfNewer` |
| Replay | Re-queue retained outbox event target(s) for processing; never mutates Domain state |
| Full historical replay | Unsupported as unbounded HTTP; outbox is retained but ops are scoped |

### Authorization

Capability `simulation.projection.ops` on tenant membership. Learners denied. Tenant from trusted JWT only. Internal routes are **not** learner Workplace APIs.

### Query-time catch-up

Retained. Relay and catch-up may race; `saveIfNewer` converges.

## 3. Configuration

See worker README and `.env.example` for `RELAY_*` variables.

## 4. Out of scope

New Domain models, projection types, Workplace pages, external brokers, analytics dashboards, PS-024.
