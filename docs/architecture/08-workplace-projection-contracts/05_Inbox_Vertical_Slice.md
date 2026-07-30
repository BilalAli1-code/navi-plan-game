# Inbox Vertical Slice

**Document ID:** PS-ARCH-021  
**Status:** Implemented  
**Roadmap:** PS-ROADMAP-014  
**Prerequisite:** PS-DOM-017 Authoritative Learner Message Lifecycle

---

## 1. Purpose

Deliver a complete learner Inbox vertical slice:

Authoritative `SimulationState.learnerMessages`
→ deterministic Inbox projection
→ shared workplace registry / fan-out / saveIfNewer
→ `GET /api/v1/simulation-runs/{id}/inbox`
→ OpenAPI + hand-written API client
→ `/app/runs/:simulationRunId/inbox` inside WorkplaceShell

Inbox is a derived read model. It is not authoritative message state.

## 2. Authoritative source matrix

| Inbox field | Authoritative source |
| --- | --- |
| `messageId` | `LearnerMessageOccurrence.occurrenceId` |
| `definitionId` | occurrence `definitionId` |
| `definitionVersion` | occurrence `definitionVersion` |
| `sequence` | occurrence `deliverySequence` |
| `deliveredAt` | occurrence `deliveredAt` (nullable) |
| `sender.*` | occurrence learner-safe sender snapshot |
| `subject` / `body` | occurrence plain-text snapshots |
| `preview` | deterministic derivation from learner-safe body |
| `summary.totalMessages` / `isEmpty` | `messages.length` |
| `capabilities.*` | always `"unsupported"` for read/archive/reply/compose |
| read / archive / reply | unsupported — not projected |

## 3. Projection contract

- Type: `inbox`
- Schema version: `1`
- Envelope: shared workplace projection fields
- Ordering: newest-first by `deliverySequence` (tie-break `messageId`)
- Empty available: `messages: []`, `isEmpty: true` (not an error)
- Semantic hash excludes `generatedAt` / `sourceEventId`

## 4. Registry and event routing

Production registry types:

- `simulation`
- `mission_control`
- `decision_log`
- `inbox`

| Authoritative event | simulation | mission_control | decision_log | inbox |
| --- | ---: | ---: | ---: | ---: |
| Lifecycle + DecisionResolved / related | yes | yes | yes | yes |
| `LearnerMessageDelivered` | no | no | no | yes |
| `ProjectionRebuilt` / `ProjectionBuildFailed` | no | no | no | no |

Partial rebuild failure remains retryable via shared event-ID inbox rules.

## 5. Persistence

- Type-keyed row in existing `simulation_projection`
- No Inbox table, message table, or migration
- Shared `saveIfNewer` + source position
- Existing SimulationRun RLS covers authoritative messages; projection RLS unchanged

## 6. API

`GET /api/v1/simulation-runs/{simulationRunId}/inbox`

- Authn/authz via trusted session tenant
- Projection type and schema bound server-side
- `Cache-Control: private, no-store`
- GET does not mutate authoritative state or mark messages read
- No generic `/projections/{type}` or workplace aggregation endpoint

## 7. Frontend

- Route: `/app/runs/:simulationRunId/inbox`
- Shell destinations (exact): Mission Control, Inbox, Decision Log
- Query key: `["inbox", actorId, simulationRunId]`
- Preserve server message order; use `messageId` as React key
- Detail expand is UI-only local state (not read state)
- Post-Decision convergence invalidates Inbox after simulation projection sync

## 8. Mission Control compatibility

`unreadActionRequiredInboxItems` remains `channel_not_implemented`.
Read / action-required message state is still unsupported.

## 9. Explicit exclusions

- Read / archive / delete / reply / compose / forward / attachments / snooze
- Stakeholder Chat, Meetings, Documents, Notifications, Activity/Completed History
- Future navigation placeholders
- Second write model or message repository

## 10. Related docs

- [Authoritative Learner Message Lifecycle](../02-domain-model/17_Authoritative_Learner_Message_Lifecycle.md)
- [Unified Workplace Projection Contracts](00_Unified_Workplace_Projection_Contracts.md)
- [Unified Workplace Shell](04_Unified_Workplace_Shell.md)
- [ADR-006](../../adr/ADR-006-cqrs-style-projection-architecture.md)
