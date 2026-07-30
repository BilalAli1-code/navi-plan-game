# Workplace Convergence E2E (PS-ROADMAP-024)

Unified Workplace convergence suite proving Domain → outbox → relay →
projections → APIs → Workplace UI under realistic async conditions.

## Specs

| Spec | Purpose |
|---|---|
| `apps/web/e2e/workplace.convergence.happy.spec.ts` | Fresh shell, unified journey, deep link/refresh/history, mobile, axe, ops rebuild, learner ops denial |
| `apps/web/e2e/workplace.convergence.reliability.spec.ts` | Bounded duplicate/rebuild/refresh cycles (PR-tier: 3) |

Helpers: `apps/web/e2e/helpers/convergence.ts`

## Local prerequisites

Same stack as Decision lifecycle E2E — see
[e2e-decision-lifecycle.md](./e2e-decision-lifecycle.md).

```bash
export DATABASE_URL=postgresql://projectsim_app:projectsim_app@127.0.0.1:5432/projectsim_test
export DATABASE_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/projectsim_test
export SUPABASE_JWT_SECRET=ps008-e2e-jwt-secret
export PROJECTSIM_E2E_SEAM_SECRET=ps008-e2e-seam-secret
export E2E_ALLOW_GLOBAL_RESET=1
pnpm install --frozen-lockfile
pnpm run db:migrate
pnpm --filter @projectsim/web exec playwright install chromium
pnpm run test:e2e -- workplace.convergence
```

## PostgreSQL backend suite

```bash
pnpm --filter @projectsim/infrastructure test -- workplace-convergence
```

Requires `DATABASE_URL` + `DATABASE_ADMIN_URL`. Skips when unset.

## Relay strategy

Playwright uses `POST /api/v1/e2e/relay/tick` (`convergeRelay` /
`drainRelayUntilIdle`). Do not add arbitrary sleeps for relay wait. Continuous
worker (`apps/worker`) is covered by infrastructure / ops docs, not required for
ordinary PR E2E.

## Authoritative setup

Use E2E command seams only:

- Decision lifecycle fixture + public SubmitDecision (Inbox / Decision Log / MC)
- `scheduleMeetingViaE2e`, `initializeStakeholderViaE2e`,
  `initializeDocumentViaE2e`, `initializeNotificationViaE2e`,
  `initializeActivityViaE2e`, `completeActivityViaE2e`

Do not insert fabricated Domain events or mutate authoritative rows for normal
scenarios.

## Ops capability

Rebuild-all browser coverage seeds
`simulation.projection.ops` on the fixture membership. Learners without the
capability must receive HTTP 403.

## Reliability cycles

- PR default: 3 cycles (`RELIABILITY_CYCLES` in the reliability spec)
- Seed annotation: `ps024-reliability-v1`
- Larger counts: run the same Playwright file after editing the constant, or
  wrap in a manual CI job — do not invent an unbounded soak

## Interpreting failures

1. Confirm PS-023 relay / targets are healthy (`projection_processing_target`)
2. Check whether turbo-parallel Postgres contention caused an infra flake
3. Re-run the failing suite in isolation
4. If deterministic product incorrectness remains, stop and file a corrective
   issue against the owning earlier roadmap item — do not “fix” production
   under PS-024

## Artifacts

Playwright trace / screenshot / video follow existing `apps/web` Playwright
config and CI upload (`playwright-artifacts`).
