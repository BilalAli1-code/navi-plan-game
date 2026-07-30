# Activities and Completed History Vertical Slice

**Document ID:** PS-ARCH-026  
**Status:** Implemented  
**Roadmap:** PS-ROADMAP-022  
**Prerequisite:** PS-DOM-022 Authoritative Activity Model

---

## 1. Purpose

Deliver the complete Activities + Completed History vertical slice:

Authoritative `SimulationState.activities`
→ deterministic `activities` projection (active only)
→ deterministic `completed_history` projection (completed only)
→ shared workplace registry / fan-out / saveIfNewer
→ `GET …/activities` and `GET …/completed-history`
→ OpenAPI + typed clients
→ Workplace routes and navigation

Neither projection is authoritative. Completed History is never built from the
Activities projection or from Domain-event history.

## 2. Projection contracts

### Activities

- Type: `activities`
- Schema version: `1`
- Payload items: active Activities only
- Ordering: `creationSequence` ascending
- Capabilities: `{ complete, reopen, assign }` all `"unsupported"`

### Completed History

- Type: `completed_history` (underscore discriminator)
- Schema version: `1`
- Payload items: completed Activities only
- Ordering: `completionSequence` descending
- Capabilities: `{ reopen, clear, export }` all `"unsupported"`

Both reuse shared source position, semantic hash, and saveIfNewer.

## 3. Registry and event routing

| Event | Targets |
| --- | --- |
| `ActivityInitialized` | `activities` |
| `ActivityCompleted` | `activities`, `completed_history` |

Partial retry and independent persistence are preserved. Activity events do not
route to Mission Control, Inbox, Meetings, Stakeholders, Documents,
Notifications, or Decision Log.

## 4. APIs

| Method | Path | operationId |
| --- | --- | --- |
| GET | `/api/v1/simulation-runs/{id}/activities` | `getActivitiesProjection` |
| GET | `/api/v1/simulation-runs/{id}/completed-history` | `getCompletedHistoryProjection` |

Both are read-only, session-authenticated, authorize-before-rebuild, private
no-store. No public mutation endpoints.

E2E-only seams (non-production):

- `POST /api/v1/e2e/commands/activity` → `InitializeActivity`
- `POST /api/v1/e2e/commands/activity/complete` → `CompleteActivity`

## 5. Frontend

| Surface | Route | Query key |
| --- | --- | --- |
| Activities | `/app/runs/:simulationRunId/activities` | `["activities", actorId, simulationRunId]` |
| Completed History | `/app/runs/:simulationRunId/completed-history` | `["completed-history", actorId, simulationRunId]` |

Navigation order:

1. Mission Control  
2. Inbox  
3. Meetings  
4. Stakeholders  
5. Documents  
6. Notifications  
7. Activities  
8. Completed History  
9. Decision Log  

Pages are read-only. No Complete / Reopen / Clear / Export controls.

## 6. Rebuild and catch-up

- `RebuildActivitiesProjectionService` / `GetActivitiesProjectionService`
- `RebuildCompletedHistoryProjectionService` / `GetCompletedHistoryProjectionService`

Each service authorizes before rebuild and rebuilds only its own projection
from authoritative SimulationRun state.

## 7. Persistence and RLS

- Authoritative Activities: SimulationRun JSONB (`schemaVersion` 8)
- Projections: shared type-keyed `simulation_projection`
- No new tables / migrations
- Existing RLS preserved

## 8. Out of scope

- Public mutation API / Complete button
- Workflow engine, assignment, recurrence, reminders
- Notification generation
- Mission Control Activity metrics
- Relay-worker / PS-023 operations
- Generic event or audit history

## 9. Related docs

- Authoritative model: `docs/architecture/02-domain-model/22_Authoritative_Activity_Model.md`
- Shell: `04_Unified_Workplace_Shell.md`
