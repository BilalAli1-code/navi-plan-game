# Decision Log Vertical Slice

**Document ID:** PS-ARCH-019  
**Roadmap item:** PS-ROADMAP-012  
**Version:** 1.0  
**Status:** Implemented  
**ADR:** [ADR-006](../../adr/ADR-006-cqrs-style-projection-architecture.md)  
**Contracts:** [PS-ARCH-016](./00_Unified_Workplace_Projection_Contracts.md) §8.6  
**Infrastructure:** [PS-ARCH-017](./01_Shared_Workplace_Projection_Infrastructure.md)  
**Prior slice:** [PS-ARCH-018 Mission Control](./02_Mission_Control_Vertical_Slice.md)

---

## 1. Purpose

Decision Log is the chronological learner-facing history of decisions that have
already occurred and are visible to that learner. It is a deterministic,
rebuildable, learner-safe projection derived from the authoritative
SimulationRun aggregate. It does not introduce a second write model or a second
Decision submission path.

## 2. Scope

In scope:

- Domain payload schema v1 for `decision_log`
- Deterministic builder from authoritative SimulationRun snapshot + projection-safe content
- Registry registration and event fan-out with `simulation` and `mission_control`
- Shared persistence (`simulation_projection`) with `saveIfNewer`
- Explicit learner-facing API
- Typed frontend page + TanStack Query
- Minimal navigation from Mission Control / Decision workspace / home
- Post-Decision bounded convergence
- Tests (Domain through Playwright, including Pixel 7)

Out of scope (at PS-012 delivery; Workplace Shell later delivered by PS-013):

- Unified Workplace Shell (PS-013)
- Inbox, Meetings, Stakeholders, Documents, Notifications, Activities,
  Completed History
- Generic public `…/projections/{projectionType}` endpoint
- Facilitator or administrator Decision Log
- New commands or authoritative write paths
- Pagination / truncation of history (full history for Milestone 2 scale)

## 3. Projection identity

| Field | Value |
| --- | --- |
| `projectionType` | `decision_log` (snake_case discriminator) |
| `projectionSchemaVersion` | `1` |
| Storage identity | `(tenant_id, simulation_run_id, projection_type)` |
| Derived id | `projection:decision_log:{tenantId}:{simulationRunId}` |

Decision Log coexists with `simulation` and `mission_control` as a distinct
type-keyed row in the same `simulation_projection` table. No migration was
required for PS-012.

Public HTTP path uses kebab-case:

`GET /api/v1/simulation-runs/{simulationRunId}/decision-log`

UI route:

`/app/runs/:simulationRunId/decision-log`

## 4. Payload contract (v1)

Flat envelope-compatible blocks (see Domain `decision-log-contracts.ts`):

- `entries` — newest-first ordered Decision Log entries
- `summary` — `{ totalEntries, isEmpty }`

### Entry fields

| Field | Source / rule |
| --- | --- |
| `entryId` / `decisionRecordId` | Authoritative `Decision.id` (stable across rebuilds) |
| `decisionDefinitionId` | Authoritative Decision definition id |
| `sequence` | 1-based chronological occurrence order (oldest = 1); tie-break DecisionRecordId ascending |
| `decidedAt` | Authoritative `Decision.submittedAt` (never fabricated on rebuild) |
| `title` | Projection-safe decision title |
| `selectedOption.optionId` | Authoritative selected option id |
| `selectedOption.label` | Projection-safe option label (nullable when missing) |
| `status` | Authoritative `submitted` \| `resolved` (same literals as `simulation.decisionHistory`) |
| `revealedOutcome` | `{ summary }` only when status is `resolved` and a non-empty public summary exists; otherwise `null` |

### Ordering

- Presentation order (`entries` array): newest-first by `submittedAt` descending,
  then `DecisionRecordId` descending.
- Frontend must render payload order and must not reorder.

### Empty vs unavailable

| State | Meaning |
| --- | --- |
| Available empty | Valid Decision Log with `entries: []`, `summary.isEmpty: true` |
| Available populated | One or more learner-visible completed decisions |
| Unavailable / rebuild_failed / missing | Shared query freshness / error semantics (not empty history) |

Empty history is never represented as HTTP 404, unavailable, or error.

## 5. Learner-safety rules

Included only when authoritatively occurred (present in SimulationRun
decisions). Excluded:

- future / available-but-unsubmitted decisions
- hidden outcomes / empty public summaries before reveal
- quality classification / outcome ids / scoring
- facilitator notes, consequence definitions, signals, schedules
- rationale (not stored on authoritative Decision today)
- semanticHash / sourceEventId on the public client DTO

Decision Log is built from SimulationRun + projection-safe content. It must not
be sourced from Mission Control or SimulationProjection rows as a second truth.

## 6. End-to-end data flow

```text
Learner submits Decision
        ↓
SubmitDecision command
        ↓
SimulationRun authoritative mutation
        ↓
consequences applied exactly once
        ↓
transactional outbox
        ↓
ProjectionEventConsumer fan-out
        ↓
rebuild simulation + mission_control + decision_log
        ↓
saveIfNewer into simulation_projection
        ↓
GET …/decision-log (typed query, rebuild-on-read if needed)
        ↓
TanStack Query ["decision-log", actorId, simulationRunId]
        ↓
Decision Log page (server order, no optimistic entries)
```

## 7. Registry and fan-out

Production registry registers exactly:

- `simulation`
- `mission_control`
- `decision_log`

Trigger event types match the shared workplace fan-out list (lifecycle,
DecisionSubmitted, DecisionResolved, project metric/state changes). An event is
marked processed only when all registered target rebuilds succeed.

## 8. Persistence and RLS

- Reuses shared type-keyed `simulation_projection` + event-ID inbox.
- Monotonic `saveIfNewer` with shared source-position comparison.
- No Decision Log-specific migration.
- Tenant RLS applies to all projection types uniformly.

## 9. Query and API

- Application query binds `decision_log` internally.
- Auth + run authorization precede data return.
- Tenant from trusted auth only.
- Cache-Control: `private, no-store`.
- Client DTO omits `semanticHash` and `sourceEventId`.

## 10. Frontend

- Route: `/app/runs/:simulationRunId/decision-log`
- TanStack Query owns server state
- Generated/hand-maintained typed client `getDecisionLog`
- Empty, current, stale/rebuild_failed, retryable/non-retryable errors
- Minimal navigation: Mission Control, Decision workspace, Home
- Post-Decision: after simulation projection sync, invalidate Decision Log
  (and Mission Control). No optimistic history entries. Bounded
  `expectVersion` polling when present; stops on match, timeout, or unmount.

## 11. Compatibility

Unchanged by PS-012:

- SubmitDecision contract and exactly-once consequences
- Mission Control schema v1 and API
- SimulationProjection schema v1 and API
- Authentication / tenant binding

## 12. Explicit exclusions (PS-013+)

- Unified Workplace Shell
- Workplace sidebar / top-level tabs for future surfaces
- Disabled Inbox/Meetings/Documents placeholders
- Generic projection browser

## 13. Testing

Covered by Domain builder/parse tests, Application registry tests, API route +
OpenAPI tests, frontend component tests, and Playwright desktop + Pixel 7
suites including Decision→Decision Log convergence.
