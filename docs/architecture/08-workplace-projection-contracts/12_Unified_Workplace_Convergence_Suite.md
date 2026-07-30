# Unified Workplace Convergence Suite

**Document:** PS-ROADMAP-024  
**Status:** Implemented (test infrastructure + documentation)  
**Milestone:** Milestone 2 — Unified Workplace Experience (final validation)

## Purpose

Prove that the complete ProjectSim system converges correctly across authoritative
Domain state, transactional outbox, production relay path, registered
projections, query-time catch-up, rebuild, supported replay, PostgreSQL + RLS,
learner APIs, and the Workplace UI — under duplicate, retry, restart,
concurrency, browser, and tenant-isolation conditions.

## Non-goals

- No new Domain models, commands, events, projection types, learner APIs, or
  Workplace pages
- No relay / outbox / registry redesign
- No event store or full historical replay
- No production performance optimization
- No silent product fixes for earlier-roadmap defects

## Authority map

| Area | Authoritative owner | Projection | Learner API | Workplace route |
|---|---|---|---|---|
| Simulation identity | SimulationRun | `simulation` | `GET …/projection` | Decision workspace (not shell) |
| Mission Control | SimulationRun | `mission_control` | `GET …/mission-control` | `/mission-control` |
| Inbox | SimulationRun.learnerMessages | `inbox` | `GET …/inbox` | `/inbox` |
| Meetings | SimulationRun.meetings | `meetings` | `GET …/meetings` | `/meetings` |
| Stakeholders | SimulationRun.stakeholders | `stakeholders` | `GET …/stakeholders` | `/stakeholders` |
| Documents | SimulationRun.documents | `documents` | `GET …/documents` | `/documents` |
| Notifications | SimulationRun.notifications | `notifications` | `GET …/notifications` | `/notifications` |
| Activities | SimulationRun.activities (active) | `activities` | `GET …/activities` | `/activities` |
| Completed History | SimulationRun.activities (completed) | `completed_history` | `GET …/completed-history` | `/completed-history` |
| Decision Log | SimulationRun.decisions | `decision_log` | `GET …/decision-log` | `/decision-log` |

Completed History is a **derived projection** of completed Activities. It is not
a separate aggregate and must not be rebuilt from the Activities projection.

## Production path under test

1. Accepted command / trusted consequence mutates SimulationRun
2. Transaction commits authoritative state + outbox row
3. Relay publishes outbox events (worker or E2E tick seam)
4. Fan-out materializes per-projection processing targets
5. Rebuild handlers persist via `saveIfNewer` + semantic hash
6. Learner GET returns envelope (catch-up if missing/stale)
7. Workplace pages render learner-safe payloads

## Suite layers

| Layer | Location |
|---|---|
| Registry inventory + completeness | `packages/application/.../workplace-convergence-inventory.ts` |
| PostgreSQL convergence | `packages/infrastructure/.../workplace-convergence.integration.test.ts` |
| Playwright helpers | `apps/web/e2e/helpers/convergence.ts` |
| Unified browser journey | `apps/web/e2e/workplace.convergence.happy.spec.ts` |
| Reliability cycles (PR-tier) | `apps/web/e2e/workplace.convergence.reliability.spec.ts` |

## Registry completeness

`evaluateWorkplaceConvergenceCompleteness` fails when:

- a registered projection lacks manifest coverage
- the production registry lacks a handler for a domain type
- shell nav order drifts from the shell-visible manifest
- domain `WORKPLACE_PROJECTION_TYPES` drifts from the manifest

## Relay synchronization

- **PostgreSQL / unit composition:** `outboxRelay.tick()` until `claimed === 0`
- **Playwright / CI:** `POST /api/v1/e2e/relay/tick` via `drainRelayUntilIdle` /
  `convergeRelay` (no continuous worker process in ordinary E2E)

## Rebuild vs supported replay

| Operation | Meaning |
|---|---|
| Rebuild | Read current authoritative SimulationRun; invoke registry rebuild; `saveIfNewer` |
| Replay / manual retry | Re-queue **exhausted** or **retrying** retained processing targets |
| Full historical replay | **Unsupported** — no event store; outbox retention is not an unbounded HTTP replay API |

Succeeded targets are not re-queued by ops replay; the suite asserts denial and
covers exhausted → replay → converge instead.

## Eventual assertions

Bounded polling helpers (`eventually`, Playwright `expect` timeouts). No
arbitrary `sleep` as the primary synchronization mechanism.

## CI organization

| Tier | Suites |
|---|---|
| Fast PR | Application inventory unit tests; existing package tests |
| PostgreSQL | `workplace-convergence.integration.test.ts` (env-gated) |
| Browser | `workplace.convergence.happy.spec.ts` (serial Playwright) |
| Reliability PR | `workplace.convergence.reliability.spec.ts` (3 cycles) |
| Larger soak | Same reliability command with higher cycle count — manual/scheduled; do not invent nightly unless policy allows |

## Known limitations

- Full historical replay unsupported (PS-023 retention / ops scope)
- E2E uses relay tick, not continuous `@projectsim/worker` process
- Performance baselines are non-gating when collected
- Turbo-parallel PostgreSQL suites may contend; re-run in isolation when needed

## Related

- [Production Relay Worker and Projection Operations](11_Production_Relay_Worker_and_Projection_Operations.md)
- [E2E Workplace Convergence testing guide](../../testing/e2e-workplace-convergence.md)
- ADR-006 CQRS-style projection architecture
