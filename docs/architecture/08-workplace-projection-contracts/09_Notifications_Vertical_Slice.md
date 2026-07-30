# Notifications Vertical Slice

**Document ID:** PS-ARCH-025  
**Status:** Implemented  
**Roadmap:** PS-ROADMAP-021  
**Prerequisite:** PS-DOM-021 Authoritative Notification Model

---

## 1. Purpose

Deliver a complete learner Notifications vertical slice:

Authoritative `SimulationState.notifications`
-> deterministic Notifications projection
-> shared workplace registry / fan-out / saveIfNewer
-> `GET /api/v1/simulation-runs/{id}/notifications`
-> OpenAPI + hand-written API client
-> `/app/runs/:simulationRunId/notifications` inside WorkplaceShell

Notifications is a derived read model. It is not authoritative Notification
state.

## 2. Authoritative source matrix

| Notifications field | Authoritative source |
| --- | --- |
| `notificationId` | `NotificationRuntime.notificationId` |
| `creationSequence` | runtime creation sequence |
| `title` / `summary` | learner-safe content snapshot |
| `body` | optional immutable plain-text body snapshot |
| `source.kind` | authoritative `NotificationSourceKind` |
| `source.sourceId` | optional authoritative source reference |
| `source.reason` | optional authoritative source reason |
| `status` | runtime lifecycle state (`active` in v1) |
| `summary.*` | derived from projected items |
| `capabilities.*` | always `"unsupported"` for markRead/dismiss/preferences |

Hidden / excluded: `originatingCommandId`, aggregate/outbox/causation
metadata, severity (deferred), internal engine routing fields.

## 3. Projection contract

- Type: `notifications`
- Schema version: `1`
- Envelope: shared workplace projection fields
- Notification ordering: ascending by `creationSequence` (oldest first)
- Empty available: `notifications: []`, `isEmpty: true` (not an error)
- Semantic hash excludes `generatedAt` / `sourceEventId`

## 4. Registry and event routing

Production registry types:

- `simulation`
- `mission_control`
- `decision_log`
- `inbox`
- `meetings`
- `stakeholders`
- `documents`
- **`notifications`** ← registered in PS-021

Trigger events: `NotificationInitialized` → rebuilds `notifications` only.

Fan-out is explicit per trigger type. `NOTIFICATION_EVENTS` is a discrete set
that drives only the notifications projection rebuild handler.

## 5. Command pipeline

| Layer | Component | Role |
| --- | --- | --- |
| Domain | `processInitializeNotification` | Validates + creates `NotificationRuntime`; emits `NotificationInitialized` |
| Application | `initializeNotificationHandler` | Validates command fields; delegates to domain |
| Application | `CommandApplicationService` | Calls `processInitializeNotification`; writes outbox event |
| Infrastructure | `CapabilityAuthorizer` | Maps `InitializeNotification` → `simulation.run.view + simulation.run.start` |
| API | E2E seam only | `POST /api/v1/e2e/commands/notification` (not public) |

`InitializeNotification` is internal/trusted. No public mutation API is
exposed.

## 6. Projection service

| Service | Purpose |
| --- | --- |
| `RebuildNotificationsProjectionService` | Loads `SimulationState`, calls notifications builder, saves via `saveIfNewer` |
| `GetNotificationsProjectionService` | Returns current projection; triggers synchronous rebuild if stale/missing |

Both are registered in `composition-root.ts` and
`postgres-composition-root.ts`.

`notificationsProjectionRebuildHandler` is registered in
`workplace-projection-registry.ts` and wired into
`ProjectionEventConsumer`.

## 7. API contract

### GET `/api/v1/simulation-runs/{simulationRunId}/notifications`

- **operationId:** `getNotificationsProjection`
- **Auth:** Bearer JWT (same as all projection reads)
- **Required capability:** `simulation.run.view`
- **Response 200:** `NotificationsApiResponse`

Response shape (abbreviated):

```ts
{
  meta: {
    projectionId: string;
    projectionType: "notifications";
    projectionSchemaVersion: 1;
    sourceAggregateVersion: number;
    freshness: "current" | "stale" | "rebuild_failed";
    generatedAt: string;
  };
  data: {
    projectionType: "notifications";
    projectionSchemaVersion: 1;
    notifications: NotificationItem[];
    summary: { totalNotifications: number; isEmpty: boolean };
    capabilities: {
      markRead: "unsupported";
      dismiss: "unsupported";
      preferences: "unsupported";
    };
  };
}
```

`NotificationItem`:

```ts
{
  notificationId: string;
  creationSequence: number;
  title: string;
  summary: string;
  body: string | null;
  source: {
    kind: string;   // NotificationSourceKind
    sourceId: string | null;
    reason: string | null;
  };
  status: "active";
  createdAt: string;
}
```

### E2E seam: POST `/api/v1/e2e/commands/notification`

Test-only. Protected by `X-ProjectSim-E2E-Seam` header. Accepts
`InitializeNotification` only. Not part of the public API.

## 8. Frontend

| File | Purpose |
| --- | --- |
| `apps/web/src/api/client.ts` | `getNotifications` method + `NotificationsApiResult` |
| `features/notifications/queryKeys.ts` | `notificationsQueryKey` |
| `features/notifications/useNotificationsProjection.ts` | TanStack Query hook |
| `features/notifications/NotificationsPage.tsx` | Workplace notifications surface |
| `features/notifications/NotificationsPage.css` | Surface styles |
| `features/workplace/routes.ts` | `workplaceNotificationsPath` |
| `features/workplace/WorkplaceShell.tsx` | Notifications nav item |
| `App.tsx` | `/app/runs/:simulationRunId/notifications` route |

Nav order: Mission Control → Inbox → Meetings → Stakeholders → Documents →
**Notifications** → Decision Log.

## 9. E2E tests

`apps/web/e2e/notifications.happy.spec.ts` covers:

1. Empty notifications list renders with `Current` freshness.
2. After `InitializeNotification` + outbox relay, two notifications converge
   and render correctly.
3. Reload preserves correct count.
4. Navigate-away-and-back preserves correct count.
5. Re-delivery of last outbox event is idempotent.
6. `assertNotificationsHiddenDataAbsent` verifies no hidden fields leak.
7. axe-core accessibility scan (wcag2a + wcag2aa, no serious/critical
   violations).

Helper functions are in `e2e/helpers/notifications.ts`.

## 10. Revision History

| Version | Status | Description |
| --- | --- | --- |
| 1.0 | Implemented | PS-ROADMAP-021 notifications vertical slice |
