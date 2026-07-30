# Authoritative Activity Model

**Document ID:** PS-DOM-022  
**Status:** Implemented  
**Roadmap item:** PS-ROADMAP-022  
**Prerequisite:** merged PS-ROADMAP-021  
**Owner aggregate:** SimulationRun / SimulationState

---

## 1. Purpose

PS-022 establishes learner work items as authoritative runtime facts on
SimulationRun. It provides the write-side model needed by the Activities and
Completed History projections, APIs, and Workplace UI without introducing a
separate Activity aggregate or a second Completed History write model.

## 2. Authoritative owner

- **Owner:** SimulationRun (`SimulationState.activities`, schema v8)
- **Not a projection:** runtime Activities are write-model facts
- **No second write model:** no Activity repository, no Activity table, no
  Activity-specific outbox, no separate Completed History store
- **Persistence:** existing JSONB simulation state; no migration
- **Unused placeholder:** `activityProgress` remains an unused Learning
  Aggregate placeholder and is not the workplace Activity model

## 3. Semantic definition

An Activity is an authoritative learner work item that remains actionable until
completed.

An Activity is not:

- a Notification (attention signal)
- an Inbox message (communication history)
- a Meeting, Document, or Decision
- a Domain event, accepted command, or audit ledger entry
- a browser-local checkbox

Creation must be intentional. Domain events are not mirrored into Activities.

## 4. Runtime identity and idempotency

```text
activityId  (one runtime Activity per ActivityId per SimulationRun)
```

- Stable across completion (Completed History reuses the same ActivityId)
- Duplicate-identical initialization → accepted no-op
- Conflicting immutable semantics → `ACTIVITY_IDENTITY_CONFLICT`
- Consequence-derived identity helper:
  `activity:consequence:{consequenceId}`

## 5. Learner-safe content and provenance

Immutable plain-text snapshot at initialization:

- `title`, `summary`, optional `body`
- `source` — `{ kind, sourceId?, reason? }`
- `creationSequence`, `createdAt`, `originatingCommandId`

Source kinds: `simulation | meeting | stakeholder | document | decision |
inbox | authored_consequence`.

Markup (`<`, `>`) is rejected. Severity, due dates, priority, and activity-type
categories are omitted in v1.

Hidden from projections/API: `originatingCommandId`, `completingCommandId`,
tenant/outbox/causation metadata.

## 6. Lifecycle (v1)

| State | Meaning |
| --- | --- |
| `active` | actionable work item |
| `completed` | immutable completed work item |

Rules:

- creation produces `active`
- completion transitions `active` → `completed`
- completion stamps authoritative `completedAt` and monotonic
  `completionSequence`
- already-completed identical completion → accepted no-op (no second
  `ActivityCompleted`)
- unknown Activity → `ACTIVITY_NOT_FOUND`
- reopen / cancel / archive are unsupported

## 7. Commands and events

| Command | Event | Notes |
| --- | --- | --- |
| `InitializeActivity` | `ActivityInitialized` | Trusted/internal; E2E seam only |
| `CompleteActivity` | `ActivityCompleted` | Trusted/internal; E2E seam only |

Both always participate in `SimulationActionAccepted` when accepted through the
application service. Neither command is a public REST mutation.

`CompleteActivity` previously existed as scaffolding that emitted only
`SimulationActionAccepted`. PS-022 evolves it to complete
`SimulationState.activities` work items and emit `ActivityCompleted`.

## 8. Ordering

- Creation order: `creationSequence` ascending
- Completion order: `completionSequence` descending in Completed History
  (most recently completed first)

## 9. Completed History derivation

Completed History is a **read model** of Activities with `status === "completed"`.

It is not separately authored state, not Decision Log, not a Domain-event
timeline, and not built from the Activities projection.

## 10. Boundaries

- Notifications / Inbox / Meetings / Stakeholders / Documents / Decision Log /
  Mission Control are unchanged
- No workflow engine, assignment, recurrence, reminders, or collaboration
- No public Complete button or mutation API
- PS-023 relay-worker operations are out of scope

## 11. Related docs

- Vertical slice: `docs/architecture/08-workplace-projection-contracts/10_Activities_and_Completed_History_Vertical_Slice.md`
- Prior ownership examples: PS-DOM-020 Documents, PS-DOM-021 Notifications
