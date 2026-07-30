# Decision lifecycle E2E (PS-ROADMAP-008)

Browser-driven suite proving the authoritative Decision path through the real
integrated stack: UI → public API → Application → Domain → PostgreSQL → outbox →
projection → refreshed UI.

## Runner

- Playwright (`apps/web`, `@playwright/test`)
- Chromium desktop + mobile viewport project for the responsive smoke
- Serial workers (`workers: 1`) with unique tenant/run per test

## Local prerequisites

```bash
export DATABASE_URL=postgresql://projectsim_app:projectsim_app@127.0.0.1:5432/projectsim_test
export DATABASE_ADMIN_URL=postgresql://postgres:postgres@127.0.0.1:5432/projectsim_test
export SUPABASE_JWT_SECRET=ps008-e2e-jwt-secret
export PROJECTSIM_E2E_SEAM_SECRET=ps008-e2e-seam-secret
export E2E_ALLOW_GLOBAL_RESET=1
pnpm install --frozen-lockfile
pnpm run db:migrate
pnpm --filter @projectsim/web exec playwright install chromium
pnpm run test:e2e
```

Playwright global setup applies migrations and builds the web app with:

- `VITE_API_BASE_URL=http://127.0.0.1:8787`
- `VITE_ENABLE_E2E_AUTH_HOOK=1`

The API process is started by `scripts/e2e/run-api.mjs` with postgres composition,
Supabase JWT verification, `PROJECTSIM_ENABLE_E2E_SEAMS=1`, and
`PROJECTSIM_E2E_SEAM_SECRET` (default local value for CI/dev only).

## Isolation strategy

Option C (serial) + unique tenant/run identities:

- one Playwright worker
- cleanup between tests via `/api/v1/e2e/fixtures/cleanup`
  - tenant-scoped by default (`{ "tenantId": "..." }`)
  - optional global truncate only when `E2E_ALLOW_GLOBAL_RESET=1`
- browser never receives admin/service-role or seam credentials
- learner actions use public projection/command routes only
- fixture create refuses to overwrite an existing `simulation_run_id`

## Opt-in seams (non-production)

| Seam | Purpose |
| --- | --- |
| `VITE_ENABLE_E2E_AUTH_HOOK=1` | Exposes `window.__PROJECTSIM_E2E_AUTH__` for test JWT injection (build-time) |
| `PROJECTSIM_ENABLE_E2E_SEAMS=1` | Fixture/cleanup/projection-gate/relay helpers under `/api/v1/e2e/*` |
| `PROJECTSIM_E2E_SEAM_SECRET` | Required server secret; clients must send `X-ProjectSim-E2E-Seam` |
| Projection gate `hold` | Retain pre-submit projection to exercise lag/timeout UI |
| Projection gate `fail_rebuild` | Return retained projection as `rebuild_failed` |

Lockdown rules:

- refused when `NODE_ENV=production` (even if the flag or `enableE2eSeams` is forced)
- client requests cannot enable E2E mode
- missing/invalid seam secret → opaque `404 Not found.`
- E2E routes are absent from public OpenAPI


## Debugging

- Traces: retained on first retry (`trace: on-first-retry`)
- Screenshots/video: retained on failure
- HTML report: `apps/web/playwright-report`
- Fixture ids are annotated on the happy-path test

Do not commit tokens, service-role keys, or unrestricted database dumps.
