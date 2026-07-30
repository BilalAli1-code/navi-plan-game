# @projectsim/infrastructure

Infrastructure layer for ProjectSim 2.0.

Implements application/domain ports with concrete adapters. Dependency direction
is always inward: `infrastructure → application → domain`. Domain code must never
import from this package or from database types.

## Adapters

| Milestone | Location                                                                    | Notes                                                                                             |
| --------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| PS-004A   | `src/simulation/*`                                                          | In-memory state, sequencer, idempotency, event publisher, permit-all authorizer, composition root |
| PS-004B   | `src/simulation/postgres/*`                                                 | Postgres/RLS persistence, transactional outbox writer                                             |
| PS-004C   | `src/simulation/postgres/outbox-relay.ts`, `src/simulation/authorization/*` | Outbox relay + EventBus, capability authorizer, membership stores                                 |

## Composition roots

- `createSimulationCommandModule` — in-memory (local / unit tests)
- `createPostgresSimulationCommandModule` — durable Postgres path with capability auth + outbox relay

## Migrations & DB types

SQL migrations live under `supabase/migrations/`. Apply locally with:

```bash
pnpm db:migrate
# requires DATABASE_ADMIN_URL
```

`src/simulation/postgres/database.types.ts` is **hand-maintained** (not CLI-generated).
Update it in the same PR as schema migrations. Automated `supabase gen types` is
not wired yet — do not claim generation verification until that exists.

## Integration tests

Postgres suites are env-gated. When unset they skip so CI without a database stays green:

```bash
export DATABASE_URL=postgresql://projectsim_app:projectsim_app@127.0.0.1:5432/projectsim_test
export DATABASE_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/projectsim_test
pnpm --filter @projectsim/infrastructure test
```

Reference: `docs/handbook/06_Supabase_and_Database_Engineering_Standards.md`,
`docs/architecture/04-database-architecture/10_Event_Store_Outbox_and_Audit.md`.
