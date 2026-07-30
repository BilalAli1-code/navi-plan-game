# Authoritative Notification Model

**Document ID:** PS-DOM-021  
**Status:** Implemented  
**Roadmap item:** PS-ROADMAP-021  
**Prerequisite:** merged PS-ROADMAP-020  
**Owner aggregate:** SimulationRun / SimulationState

---

## 1. Purpose

PS-021 establishes learner-visible Notifications as authoritative runtime facts
on SimulationRun. It provides the write-side model needed by the Notifications
projection, API, and Workplace UI without introducing a separate Notification
aggregate.

## 2. Authoritative owner

- **Owner:** SimulationRun (`SimulationState.notifications`)
- **Not a projection:** runtime Notifications are write-model facts, not
  `notifications` projection rows
- **No second write model:** no Notification repository, no
  Notification-specific table, no Notification-specific outbox
- **Persistence:** existing JSONB simulation state; no migration

## 3. Runtime identity and idempotency

```text
notificationId  (one runtime Notification per NotificationId per SimulationRun)
```

- Deterministic and immutable after initialization
- Duplicate-identical initialization → accepted no-op, no second Notification /
  no `NotificationInitialized`
- Consequence-derived identity helper:
  `notification:consequence:{consequenceId}`

## 4. Learner-safe content

Notifications store an immutable plain-text snapshot:

- `title`
- `summary`
- `body` (optional)
- `source` — `kind`, `sourceId?`, `reason?`
- `creationSequence`, `createdAt`, `originatingCommandId`

Source kinds: `simulation | meeting | stakeholder | document | decision |
inbox | authored_consequence`.

Rejected from learner-visible fields: markup (`<`, `>`). No markdown or HTML
renderer is part of the authoritative model.

## 5. Lifecycle (v1)

Notifications are `active` only in PS-021. Dismiss, read/unread, and archive
are later-slice concerns and are not represented in the runtime model.

Severity is omitted from v1 — it is deferred to a later slice.

## 6. Commands and events

| Command | Event | Notes |
| --- | --- | --- |
| `InitializeNotification` | `NotificationInitialized` | Internal/trusted; E2E seam only |

`InitializeNotification` is not a public mutation API. It is dispatched
server-side by the simulation engine or E2E test seam only.

Required payload fields:

```ts
{
  notificationId: NotificationId;
  title: string;           // non-empty, no markup
  summary: string;         // non-empty, no markup
  body?: string;           // optional, no markup
  sourceKind: NotificationSourceKind;
  sourceId?: string;
  sourceReason?: string;
}
```

## 7. Ordering

Notifications are ordered ascending by `creationSequence` (oldest first).
`creationSequence` is assigned by the domain at initialization time and is
stable and monotonically increasing per run.

## 8. Hidden/excluded fields

The following are excluded from all learner-visible projections and API
responses:

- `originatingCommandId`
- Aggregate/outbox/causation metadata
- Severity (deferred)
- Internal engine routing fields

## 9. Revision History

| Version | Status | Description |
| --- | --- | --- |
| 1.0 | Implemented | PS-ROADMAP-021 authoritative notification model |
