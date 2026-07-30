# Authoritative Meeting Lifecycle

**Document ID:** PS-DOM-018  
**Status:** Implemented  
**Roadmap item:** PS-ROADMAP-016  
**Prerequisite for:** PS-ROADMAP-017 (Meetings projection, API, and UI)  
**Owner aggregate:** SimulationRun / SimulationState

---

## 1. Purpose

PS-016 establishes the authoritative Meeting occurrence model and lifecycle on
SimulationRun. It unblocks PS-017 without implementing Meetings projection,
API, UI, navigation, or Mission Control meeting counts.

## 2. Authoritative owner

- **Owner:** SimulationRun (SimulationState)
- **Not a projection:** occurrences are write-model history, not Meetings rows
- **No second write model:** no meeting repository, no meetings write table
- **Not Stakeholder Chat / PS-018:** participant snapshots are learner-safe
  content references only

## 3. Definition versus occurrence

| Concept | Role |
| --- | --- |
| Meeting definition (`meetingId` / `meetingDefinitionId`) | Content-authored identity carried in `ScheduleMeeting` |
| Meeting occurrence | Runtime authoritative fact with stable identity and lifecycle |

## 4. Occurrence identity

```text
meeting_occurrence:${meetingId}
```

- Deterministic
- One occurrence per `MeetingId` per SimulationRun
- Survives retries, replay, and persistence round trips
- Distinct MeetingIds produce distinct occurrence IDs

## 5. Ordering

Canonical order is monotonic `scheduleSequence` (1-based) within the run.

Tied `scheduledFor` values are allowed; sequence still distinguishes them.
Projections (PS-017) must not invent alternate orderings.

## 6. Lifecycle

| Current state | Command | Next state | Event | Duplicate behavior |
| --- | --- | --- | --- | --- |
| _(none)_ | `ScheduleMeeting` | `scheduled` | `MeetingScheduled` | Identical content → accept, bump version, no second occurrence / no `MeetingScheduled`; conflicting content → `MEETING_OCCURRENCE_CONFLICT` |
| `scheduled` | `MakeMeetingAvailable` | `available` | `MeetingMadeAvailable` | Already `available` → accept, bump version, no domain event |
| `scheduled` or `available` | `StartMeeting` | `started` | `MeetingStarted` | Already `started` → accept, bump version, no domain event |
| `started` | `CompleteMeeting` | `completed` | `MeetingCompleted` | Already `completed` → accept, bump version, no domain event |
| `scheduled` or `available` | `CancelMeeting` | `cancelled` | `MeetingCancelled` | Already `cancelled` → accept, bump version, no domain event |

Terminal states: `completed`, `cancelled`.

Invalid examples (deterministic reject `MEETING_TRANSITION_INVALID`):

- Complete before start
- Cancel after start/complete
- Make available from started/completed/cancelled
- Start from completed/cancelled

Availability is **not** derived from wall clock. It requires
`MakeMeetingAvailable` (or is set when starting directly from `scheduled`).

Rescheduling, attendance, reopening, chat, AI session, and calendar sync are
**out of scope**.

## 7. Learner-safe snapshots

Persisted on the occurrence:

- title, agenda
- participant `{ stakeholderId, displayName }`
- scheduledFor, durationMinutes
- channel, location
- definition id/version
- lifecycle status + timestamps
- originatingCommandId

Rejected from learner-visible text: markup (`<`, `>`).

Not persisted: facilitator notes, scores, AI prompts, private stakeholder
instructions, unrevealed content.

## 8. Commands and events

Every accepted meeting command still emits `SimulationActionAccepted`.

Dedicated events:

- `MeetingScheduled`
- `MeetingMadeAvailable`
- `MeetingStarted`
- `MeetingCompleted`
- `MeetingCancelled`

Events carry identity/status/provenance facts. Full body remains in
authoritative state (rebuilds use state, not event body).

## 9. Consistency

- Command idempotency: existing `commandId` receipts
- Occurrence idempotency: identity + semantic equality / conflict
- Optimistic concurrency: SimulationRun `aggregateVersion`
- Exactly-once: one occurrence per MeetingId; no duplicate append on retry
- Transactional outbox: state + events via existing SimulationRunRepository.save

## 10. State schema

- Previous: SimulationState schema version **3**
- Current: SimulationState schema version **4**
- Field: `meetings: MeetingOccurrence[]`
- Upcast: v1/v2/v3 missing `meetings` → `[]`
- Persistence: existing `simulation_state.authoritative_state` JSONB
- Migration: **none** (no new table)

## 11. Public API and frontend

| Surface | Change |
| --- | --- |
| Meetings GET / OpenAPI / client | **None** |
| Meetings route / shell nav | **None** |
| Mission Control `upcomingMeetings` | Activated by PS-ROADMAP-017 (server count of scheduled + available) |
| Projection registry `meetings` handler | **None** (reserved type only) |

Existing generic command-processing infrastructure may accept meeting commands;
no dedicated Meetings REST controller is introduced.

## 12. Roadmap reconciliation note

Canonical numbering for Inbox (audit lock):

- **PS-ROADMAP-014** — authoritative learner-message / Inbox model (PR #44)
- **PS-ROADMAP-015** — Inbox projection/API/UI (PR #45 historically titled PS-014)

Do not rewrite merged Git history.

## 13. Explicit non-goals (PS-016)

- Meetings projection / registry / rebuild / catch-up
- Meetings API / OpenAPI / UI / navigation
- Mission Control meeting counts
- Stakeholder authoritative model (PS-018)
- Documents / Notifications / Activities / Completed History
- Production relay worker (PS-023)
- Unified workplace E2E suite (PS-024)
