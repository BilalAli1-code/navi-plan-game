# Authoritative Learner Message Lifecycle

**Document ID:** PS-DOM-017  
**Status:** Implemented  
**Canonical roadmap:** PS-ROADMAP-014 (authoritative Inbox / learner-message model)  
**Prerequisite for:** PS-ROADMAP-015 (Inbox Vertical Slice; historically labeled PS-ROADMAP-014 in PR #45)  
**Owner aggregate:** SimulationRun / SimulationState

---

## 1. Purpose

PS-014 discovery correctly stopped because ProjectSim had no authoritative
learner-message facts: no persisted occurrences, no stable identity, no
deterministic delivery order, and no learner-safe content snapshot.

This document describes the smallest production-ready authoritative lifecycle
that unblocks PS-014 without implementing the Inbox projection, API, UI, or
navigation.

## 2. Why PS-014 was blocked

Missing facts before this prerequisite:

| Fact | Status before |
| --- | --- |
| Persisted message occurrence | Absent from SimulationState |
| Stable occurrence identity | Absent |
| Deterministic delivery order | Absent |
| Delivery / reveal semantics | Absent |
| Learner-safe sender / subject / body | Absent |
| Complete delivery command/event path | `SendStakeholderMessage` (Stakeholder chat; PS-018 — not Inbox delivery) |

## 3. Authoritative owner

- **Owner:** SimulationRun (SimulationState)
- **Not a projection:** occurrences are write-model history, not Inbox rows
- **No second write model:** no message repository, no message table
- **Not Stakeholder Chat:** system-delivered Inbox messages ≠ conversation sends

`SendStakeholderMessage` is the learner→Stakeholder conversation command
(PS-018) and is **not** the delivery path for system-delivered Inbox messages.

## 4. Domain contract

### 4.1 Occurrence (`LearnerMessageOccurrence`)

| Field | Source |
| --- | --- |
| `occurrenceId` | Deterministic `learner_message:${consequenceId}` |
| `definitionId` / `definitionVersion` | Content-authored definition identity |
| `deliverySequence` | Monotonic 1-based order on SimulationRun |
| `deliveredAt` | Authoritative command `resolvedAt` / `submittedAt` |
| `sender` | Learner-safe snapshot (`senderId`, `displayName`, `roleLabel`) |
| `subject` / `body` | Learner-safe plain-text snapshot |
| `deliveryStatus` | Always `"delivered"` once appended |

Unsupported in this lifecycle: read, archive, reply, compose, forward, thread
state, AI prompts, private scores, facilitator notes.

### 4.2 Invariants

1. Occurrence IDs are unique within a run.
2. History is append-only.
3. Delivery sequence is strictly increasing.
4. Same occurrence ID + identical semantic content → idempotent no-op.
5. Same occurrence ID + conflicting content → invariant violation.
6. Delivered content does not resolve against mutable unversioned definitions
   (Strategy A snapshot + content package version pinning).
7. Markup characters (`<`, `>`) are rejected from learner-visible text.

### 4.3 Content definition

Consequence type: `deliver_learner_message`

Payload embeds approved learner-safe content:

- `messageDefinitionId`
- `definitionVersion`
- `sender`
- `subject`
- `body`

Validated before authoritative append. Scaffold fixtures include one delivery
per Decision outcome for deterministic tests.

## 5. Delivery path

```text
SubmitDecision
→ resolveDecisionDeterministically
→ deliver_learner_message consequence (exactly-once applicationKey)
→ append LearnerMessageOccurrence
→ emit LearnerMessageDelivered
→ SimulationRunRepository.save (state + outbox, one transaction)
```

- Idempotency: command idempotency + consequence `applicationKey` + occurrence
  identity conflict rules
- Exactly-once: existing consequence application key
- Optimistic concurrency: existing aggregate version checks unchanged

## 6. State schema

- Previous: SimulationState schema version **2**
- Current: SimulationState schema version **3**
- Upcast: v1/v2 → v3 with `learnerMessages: []`
- Persistence: existing `simulation_state.authoritative_state` JSONB
- Migration: **none** (no new table)

## 7. Domain event

`LearnerMessageDelivered` (version 1) carries occurrence identity, definition
identity/version, delivery sequence, optional `deliveredAt`, and causation
metadata. Full body is **not** duplicated in the event; rebuilds use
authoritative state.

Projection fan-out: current production registry does **not** register `inbox`.
`DecisionResolved` already rebuilds `simulation` / `mission_control` /
`decision_log`. `LearnerMessageDelivered` is ignored by workplace fan-out until
PS-014.

## 8. Public API and frontend

| Surface | Change |
| --- | --- |
| Inbox GET / OpenAPI / client | **None** |
| Inbox route / shell nav | **None** |
| Mission Control inbox counts | Remain `channel_not_implemented` |
| SubmitDecision / Decision Log / Shell | Compatible |

## 9. Security

- Learner-visible snapshot only
- No hidden consequence / score / facilitator content in occurrences
- No body logging
- Tenant isolation via existing SimulationRun RLS
- No browser authoritative message store

## 10. PS-014 readiness (historical)

This lifecycle unblocked PS-014 by providing authoritative occurrences. Inbox
projection/API/UI are implemented in PS-ROADMAP-014 — see
`docs/architecture/08-workplace-projection-contracts/05_Inbox_Vertical_Slice.md`.

Read/archive/reply remain unsupported in both this lifecycle and Inbox v1.

## 11. Explicit non-goals (this lifecycle)

- Read receipts
- Archive
- Compose / reply / forward
- Stakeholder Chat
- Meetings
- Documents / Notifications / Activity History / Completed History
