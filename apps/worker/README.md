# `@projectsim/worker`

Production relay worker for PS-ROADMAP-023.

## Role

1. Discover tenants with pending `event_outbox` rows or claimable `projection_processing_target` rows.
2. Per tenant (RLS): publish outbox events via `OutboxRelay.tick()`.
3. Claim and process projection targets with independent retry / exhaustion.
4. Expose `/healthz`, `/readyz`, and `/status` on `RELAY_HEALTH_PORT`.

Does **not** mutate authoritative SimulationRun state and does **not** dispatch learner commands.

## Run

```bash
# from repo root after migrations
pnpm --filter @projectsim/worker dev
# or
pnpm --filter @projectsim/worker start
```

## Configuration

| Variable                    | Default  | Purpose                                  |
| --------------------------- | -------- | ---------------------------------------- |
| `DATABASE_URL`              | required | App-role Postgres URL                    |
| `DATABASE_ADMIN_URL`        | required | Admin URL for tenant discovery           |
| `RELAY_ENABLED`             | `1`      | Set `0` to no-op exit                    |
| `RELAY_POLL_INTERVAL_MS`    | `1000`   | Idle sleep                               |
| `RELAY_BATCH_SIZE`          | `50`     | Claim batch                              |
| `RELAY_CONCURRENCY`         | `4`      | Reserved for future parallel target work |
| `RELAY_CLAIM_LEASE_MS`      | `60000`  | Stale claim recovery                     |
| `RELAY_MAX_ATTEMPTS`        | `5`      | Exhaustion threshold                     |
| `RELAY_RETRY_BASE_DELAY_MS` | `1000`   | Backoff base                             |
| `RELAY_RETRY_MAX_DELAY_MS`  | `300000` | Backoff cap                              |
| `RELAY_RETRY_JITTER_RATIO`  | `0.1`    | Jitter                                   |
| `RELAY_SHUTDOWN_TIMEOUT_MS` | `30000`  | In-flight drain                          |
| `RELAY_WORKER_ID`           | auto     | Diagnostic identity                      |
| `RELAY_HEALTH_PORT`         | `8790`   | Health HTTP port                         |

Invalid critical configuration fails startup (no silent coercion).

## Operations

Privileged rebuild / retry / status APIs live on `@projectsim/api` under
`/api/v1/internal/projection-operations/*` and require
`simulation.projection.ops`.

See `docs/architecture/08-workplace-projection-contracts/11_Production_Relay_Worker_and_Projection_Operations.md`
and `docs/operations/projection-relay-runbook.md`.
