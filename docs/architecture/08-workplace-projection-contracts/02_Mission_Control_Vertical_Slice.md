# Mission Control Vertical Slice

**Document ID:** PS-ARCH-018  
**Roadmap item:** PS-ROADMAP-011  
**Version:** 1.0  
**Status:** Implemented  
**ADR:** [ADR-006](../../adr/ADR-006-cqrs-style-projection-architecture.md)  
**Contracts:** [PS-ARCH-016](./00_Unified_Workplace_Projection_Contracts.md) §8.2  
**Infrastructure:** [PS-ARCH-017](./01_Shared_Workplace_Projection_Infrastructure.md)

---

## 1. Purpose

Mission Control is the first feature workplace projection after shared
infrastructure. It provides a learner-safe, rebuildable overview of a
simulation run and links to the existing Decision workspace without
introducing a second write model.

## 2. Scope

In scope:

- Domain payload schema v1 for `mission_control`
- Deterministic builder
- Registry registration and event fan-out
- Shared persistence (`simulation_projection`) with `saveIfNewer`
- Explicit learner-facing API
- Typed frontend page + TanStack Query
- Navigation to existing Decision workflow
- Post-Decision convergence
- Tests (Domain through Playwright, including Pixel 7)

Out of scope (at PS-011 delivery; Decision Log later delivered by PS-012):

- Decision Log (PS-012)
- Unified Workplace Shell (PS-013)
- Inbox, Meetings, Stakeholders, Documents, Notifications, Activities,
  Completed History
- Generic public `…/projections/{projectionType}` endpoint
- Facilitator or administrator Mission Control
- New commands or authoritative write paths

## 3. Projection identity

| Field | Value |
| --- | --- |
| `projectionType` | `mission_control` (snake_case discriminator) |
| `projectionSchemaVersion` | `1` |
| Storage identity | `(tenant_id, simulation_run_id, projection_type)` |
| Derived id | `projection:mission_control:{tenantId}:{simulationRunId}` |

Mission Control coexists with `simulation` as a distinct type-keyed row in the
same `simulation_projection` table. No migration was required for PS-011.

Public HTTP path uses kebab-case for readability:

`GET /api/v1/simulation-runs/{simulationRunId}/mission-control`

UI route:

`/app/runs/:simulationRunId/mission-control`

## 4. Payload contract (v1)

Flat envelope-compatible blocks (see Domain
`mission-control-contracts.ts`):

- `runSummary` — status, chapter/day, content package
- `projectSummary` — project status + key metrics
- `counts`
  - `pendingDecisions` — always `{ availability: "available", count }`
  - `unreadActionRequiredInboxItems` — `{ availability: "unavailable", reason: "channel_not_implemented" }` until Inbox exists
  - `upcomingMeetings` — same unavailable pattern until Meetings exists
- `nextRecommendedActions` — ids + labels + `targetKind: "decision"` only
- `recentRevealedOutcome` — latest learner-visible public summary, or `null`

### Empty vs unavailable

| State | Meaning |
| --- | --- |
| Available with data | Section present; collections/counts non-empty |
| Available empty | Authoritative empty (`count: 0`, `[]`, or `null` recent outcome) |
| Unavailable | Channel not implemented; UI must not infer zero |
| Invalid payload | Contract failure (`PROJECTION_PAYLOAD_INVALID` / unsupported schema) |

Builders own these semantics. API and UI preserve them.

## 5. End-to-end data flow

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
projection event relay
        ↓
shared projection inbox (event-ID dedupe)
        ↓
registered projection definitions
        ↓
SimulationProjection and Mission Control fan-out
        ↓
deterministic builders
        ↓
shared saveIfNewer
        ↓
type-keyed projection rows
        ↓
Mission Control query service
        ↓
authorization and tenant binding
        ↓
explicit Mission Control API
        ↓
typed browser query
        ↓
Mission Control page
```

Fan-out does not create a second authoritative write path. Each projection type
is independently rebuildable. One type failure does not mark the event
processed (atomic success marking). Persistence remains monotonic via
`evaluateProjectionSave` / `saveIfNewer`.

## 6. Builder

Location: `packages/domain/src/projection/mission-control-builder.ts`

- Deterministic and side-effect-free
- Learner-safe by construction
- Ordered collections (`authoredOrder`, then id)
- Stable action ids (`decision:{decisionDefinitionId}`)
- Uses accepted clock via `generatedAt` input only
- Does not query repositories, call APIs, mutate SimulationRun, or invent
  inbox/meeting counts

## 7. Registry and fan-out

Production registry registers exactly:

1. `simulation`
2. `mission_control`

Default fan-out for Decision/lifecycle/metric trigger events targets both
registered types. Registration does not create a generic public endpoint.

## 8. Query-time behavior

`GetMissionControlProjectionService`:

1. Run-level authorization
2. Load authoritative SimulationRun
3. Load cached `mission_control` row
4. If missing or behind → synchronous rebuild
5. Freshness: `current` | `rebuild_failed` (retained cache) | error if no cache

Tenant identity comes from authenticated session context, never from learner
request input.

## 9. Public API

- Method: `GET`
- Route: `/api/v1/simulation-runs/{simulationRunId}/mission-control`
- Operation ID: `getMissionControlProjection`
- Auth: bearer JWT
- Cache: `Cache-Control: private, no-store`
- Response strips `semanticHash` and `sourceEventId`
- Clients cannot select projection type, tenant, schema version, or force rebuild

## 10. Frontend

- Feature folder: `apps/web/src/features/mission-control/`
- Query key: `["mission-control", actorId, simulationRunId]`
- TanStack Query owns server state (no second global store)
- Decision actions map through `decisionWorkspacePath` only
- Browser does not derive eligibility, attention, or indicators
- After Decision sync, Mission Control query is invalidated for convergence
- Optional `?expectVersion=` enables bounded refetch until source catches up

## 11. Learner safety

Enforced at Domain construction, runtime parse, Application/API DTO mapping,
frontend contract checks, and E2E prohibited-marker tests. Frontend omission
alone is not a security boundary.

Excluded: facilitator notes, unrevealed outcomes, hidden consequence branches,
answer keys, private scoring, internal variables, raw aggregates, inbox/outbox
metadata, tenant internals.

## 12. Persistence and RLS

- Table: `simulation_projection` (existing)
- No new migration
- RLS + FORCE RLS unchanged (`tenant_id = app_current_tenant()`)
- Authorization and RLS are complementary

## 13. Non-goals reminder

Mission Control is not a second source of truth, not a Decision form host, and
not a workplace shell.
