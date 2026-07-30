# Meetings Vertical Slice

**Document ID:** PS-ARCH-022  
**Status:** Implemented  
**Roadmap:** PS-ROADMAP-017  
**Prerequisite:** PS-DOM-018 Authoritative Meeting Lifecycle (PS-ROADMAP-016)

---

## 1. Purpose

Deliver a complete learner Meetings vertical slice:

Authoritative `SimulationState.meetings`
→ deterministic Meetings projection
→ shared workplace registry / fan-out / saveIfNewer
→ `GET /api/v1/simulation-runs/{id}/meetings`
→ OpenAPI + hand-written API client
→ `/app/runs/:simulationRunId/meetings` inside WorkplaceShell

Meetings is a derived read model. It is not authoritative Meeting state.

## 2. Authoritative source matrix

| Meetings field | Authoritative source |
| --- | --- |
| `meetingOccurrenceId` | `MeetingOccurrence.meetingOccurrenceId` |
| `meetingDefinitionId` | occurrence `meetingDefinitionId` |
| `meetingDefinitionVersion` | occurrence `meetingDefinitionVersion` |
| `scheduleSequence` | occurrence `scheduleSequence` |
| `scheduledFor` / `durationMinutes` | occurrence snapshots |
| `title` / `agenda` | occurrence learner-safe text |
| `participants.*` | occurrence participant snapshots |
| `channel` / `location` | occurrence optional labels |
| `status` + lifecycle timestamps | occurrence lifecycle fields |
| `summary.*` | derived from projected items |
| `capabilities.*` | always `"unsupported"` for start/complete/cancel/reschedule |

Hidden / excluded: `originatingCommandId`, aggregate/outbox/causation metadata, facilitator notes, AI prompts, Stakeholder authority (PS-018).

## 3. Projection contract

- Type: `meetings`
- Schema version: `1`
- Envelope: shared workplace projection fields
- Ordering: ascending by `scheduleSequence` (tie-break `meetingOccurrenceId`)
- Empty available: `meetings: []`, `isEmpty: true` (not an error)
- Semantic hash excludes `generatedAt` / `sourceEventId`

## 4. Registry and event routing

Production registry types:

- `simulation`
- `mission_control`
- `decision_log`
- `inbox`
- `meetings`

| Authoritative event | simulation | mission_control | decision_log | inbox | meetings |
| --- | ---: | ---: | ---: | ---: | ---: |
| Lifecycle + DecisionResolved / related | yes | yes | yes | yes | yes |
| `LearnerMessageDelivered` | no | no | no | yes | no |
| Meeting* lifecycle events | no | yes | no | no | yes |
| `ProjectionRebuilt` / `ProjectionBuildFailed` | no | no | no | no | no |

Partial rebuild failure remains retryable via shared event-ID inbox rules.

## 5. Persistence

- Type-keyed row in existing `simulation_projection`
- No Meetings table or migration
- Shared `saveIfNewer` + source position
- Existing SimulationRun RLS covers authoritative meetings; projection RLS unchanged

## 6. API

`GET /api/v1/simulation-runs/{simulationRunId}/meetings`

- Authn/authz via trusted session tenant
- Projection type and schema bound server-side
- `Cache-Control: private, no-store`
- GET does not mutate authoritative Meeting lifecycle
- No Meeting mutation REST endpoints
- No generic `/projections/{type}` or workplace aggregation endpoint

## 7. Frontend

- Route: `/app/runs/:simulationRunId/meetings`
- Shell destinations (exact): Mission Control, Inbox, Meetings, Decision Log
- Query key: `["meetings", actorId, simulationRunId]`
- Preserve server meeting order; use `meetingOccurrenceId` as React key
- Status communicated with text labels (not color alone)
- No Start/Complete/Cancel/Reschedule controls in PS-017
- Browser formats timestamps for display only; never derives lifecycle from `Date.now()`

## 8. Mission Control upcomingMeetings

Server-side count from the same authoritative `SimulationState.meetings` snapshot during Mission Control projection build:

- Counted as upcoming: `scheduled`, `available`
- Excluded: `started`, `completed`, `cancelled`

Channel shape: `{ availability: "available", count: number }` (empty is `count: 0`, not unavailable).

Mission Control does **not** read the Meetings projection row.

## 9. Explicit exclusions

- Start / complete / cancel / reschedule UI or Meeting mutation REST
- Attendance, recording, video, chat, external calendar
- Stakeholder authority / conversations / trust (PS-018)
- Documents, Notifications, Activities, Completed History
- Future navigation placeholders
- Second write model or Meetings repository

## 10. Related docs

- [Authoritative Meeting Lifecycle](../02-domain-model/18_Authoritative_Meeting_Lifecycle.md)
- [Unified Workplace Projection Contracts](00_Unified_Workplace_Projection_Contracts.md)
- [Unified Workplace Shell](04_Unified_Workplace_Shell.md)
- [Inbox Vertical Slice](05_Inbox_Vertical_Slice.md)
- [ADR-006](../../adr/ADR-006-cqrs-style-projection-architecture.md)
