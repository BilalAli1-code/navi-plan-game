# Projection Relay Runbook (PS-ROADMAP-023)

## Processes

| Process | Package | Role |
|---|---|---|
| API | `@projectsim/api` | Learner APIs + privileged projection ops |
| Worker | `@projectsim/worker` | Continuous outbox publish + target processing |

Do not run uncoordinated continuous relay loops inside every API replica.

## Startup

1. Apply migrations (`pnpm run db:migrate`) including `projection_processing_target`.
2. Start API with `PROJECTSIM_API_COMPOSITION=postgres`.
3. Start worker with `DATABASE_URL` + `DATABASE_ADMIN_URL`.
4. Confirm worker `/readyz` returns 200.

## Health

| Endpoint | Meaning |
|---|---|
| Worker `/healthz` | Process liveness (poison events must not fail this) |
| Worker `/readyz` | Ready to claim work |
| Worker `/status` | Loop diagnostics (no payloads/secrets) |
| API `/api/v1/internal/projection-operations/worker-status` | Queue summary + pointer to external worker |

## Privileged operations

Capability required: `simulation.projection.ops` (tenant membership).

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/v1/internal/projection-operations/queue-summary` | Backlog counts |
| GET | `/api/v1/internal/projection-operations/failed-targets` | Exhausted/retrying list |
| GET | `/api/v1/internal/projection-operations/failed-targets/{eventId}/{projectionType}` | Detail |
| GET | `/api/v1/internal/projection-operations/simulation-runs/{id}/projections` | Per-run target counts |
| POST | `.../projections/{type}/rebuild` | Rebuild one projection from authoritative state |
| POST | `.../projections/rebuild-all` | Rebuild all registered types for one run |
| POST | `.../failed-targets/{eventId}/{type}/retry` | Re-queue exhausted/retrying target |
| POST | `.../failed-targets/{eventId}/{type}/replay` | Same as retry (retained target re-queue) |

Learners are denied. Tenant is taken from JWT only.

## Rebuild vs replay

- **Rebuild** reads current SimulationRun and writes via existing rebuild services + `saveIfNewer`.
- **Replay** re-queues a retained processing target. It does not mutate Domain state and does not fabricate events.
- Unbounded full-history replay over HTTP is unsupported.

## Exhausted work recovery

1. Inspect failed target (classification + summary).
2. Repair code/data as needed.
3. POST retry.
4. Confirm worker processes the target and projection converges.
5. Exhausted rows are never silently deleted.

## Troubleshooting

| Symptom | Check |
|---|---|
| Projections stale | Worker running? Outbox pending? Target exhausted? GET catch-up still works as fallback |
| Target stuck claimed | Wait for `RELAY_CLAIM_LEASE_MS` expiry |
| Cross-tenant leak | Worker uses per-tenant RLS transactions; admin URL only for tenant id discovery |
| Duplicate learner items | Should not occur — `saveIfNewer` + semantic hash + target uniqueness |

## Delivery language

Operational delivery is **at-least-once**. Learner-visible convergence is **idempotent and monotonic** via rebuild + `saveIfNewer`. Do not claim transport exactly-once.
