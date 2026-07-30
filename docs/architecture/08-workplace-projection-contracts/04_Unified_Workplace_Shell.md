# Unified Workplace Shell

**Document ID:** PS-ARCH-020  
**Roadmap item:** PS-ROADMAP-013  
**Version:** 1.0  
**Status:** Implemented  
**ADR:** [ADR-006](../../adr/ADR-006-cqrs-style-projection-architecture.md)  
**Prior slices:** [PS-ARCH-018 Mission Control](./02_Mission_Control_Vertical_Slice.md),
[PS-ARCH-019 Decision Log](./03_Decision_Log_Vertical_Slice.md)

---

## 1. Purpose

The Unified Workplace Shell is a shared, run-scoped learner layout that composes
completed workplace surfaces (Mission Control, Inbox, Meetings, Stakeholders,
Documents, Notifications, Activities, Completed History, and Decision Log) with
consistent navigation, accessibility, and responsive behavior.

It is **not** a Domain projection, write model, or aggregation endpoint.

## 2. Scope

In scope:

- Nested run-scoped layout route
- Desktop and mobile workplace navigation
- Active-route indication
- Default `/app/runs/:simulationRunId` → Mission Control redirect
- Deep links, refresh, browser back/forward
- Mission Control, Inbox, Meetings, Stakeholders, Documents, Notifications,
  Activities, Completed History, and Decision Log composition
- Frontend tests and Playwright coverage
- Documentation

Out of scope:

- New Domain aggregate / persistence / migration for the shell itself
- Future navigation placeholders or “coming soon” items
- Generic workplace or projection API
- Navigation preference persistence
- Facilitator / administrator workplace

## 3. Route hierarchy

```text
Authenticated App (QueryClient + AuthSession + BrowserRouter)
├── /                                               Home
├── /app/runs/:simulationRunId/decisions            Decision workflow (outside shell)
└── /app/runs/:simulationRunId                      WorkplaceShell
    ├── index  → replace redirect → mission-control
    ├── mission-control                             MissionControlPage
    ├── inbox                                       InboxPage
    ├── meetings                                    MeetingsPage
    ├── stakeholders                                StakeholdersPage
    ├── documents                                   DocumentsPage
    ├── notifications                               NotificationsPage
    ├── activities                                  ActivitiesPage
    ├── completed-history                           CompletedHistoryPage
    └── decision-log                                DecisionLogPage
```

Parameter name: `simulationRunId` (code convention).

Trusted helpers: `apps/web/src/features/workplace/routes.ts`.

## 4. Ownership

| Concern | Owner |
| --- | --- |
| Mission Control query / payload / freshness | Mission Control page + TanStack Query |
| Inbox query / payload / freshness | Inbox page + TanStack Query |
| Documents query / payload / freshness | Documents page + TanStack Query |
| Notifications query / payload / freshness | Notifications page + TanStack Query |
| Activities query / payload / freshness | Activities page + TanStack Query |
| Completed History query / payload / freshness | Completed History page + TanStack Query |
| Decision Log query / payload / freshness | Decision Log page + TanStack Query |
| Decision command / receipt | Decision page + `useSubmitDecision` |
| Shell UI state (mobile menu open) | WorkplaceShell only |
| Authoritative simulation state | SimulationRun (server) |

The shell must not copy child projection results into context, Redux, Zustand,
or browser storage.

Query keys:

- `["mission-control", actorId, simulationRunId]`
- `["inbox", actorId, simulationRunId]`
- `["meetings", actorId, simulationRunId]`
- `["stakeholders", actorId, simulationRunId]`
- `["documents", actorId, simulationRunId]`
- `["notifications", actorId, simulationRunId]`
- `["activities", actorId, simulationRunId]`
- `["completed-history", actorId, simulationRunId]`
- `["decision-log", actorId, simulationRunId]`

## 5. Navigation

Supported destinations (exactly, in order):

1. Mission Control
2. Inbox
3. Meetings
4. Stakeholders
5. Documents
6. Notifications
7. Activities
8. Completed History
9. Decision Log

Active route uses router match + `aria-current="page"` on `NavLink`, with a
visible non-color-only indicator (weight + border).

Product navigation (shell) is separate from business actions (Mission Control
recommended Decision links, Decision form submission).

## 6. Default run route

`/app/runs/:simulationRunId` deterministically `replace`-redirects to
Mission Control. No payload inspection, localStorage, or learner-state inference.

## 7. Accessibility and responsive

- Labeled `nav` landmark (`aria-label="Workplace"`)
- Child pages retain their own `<main>` and page `h1`
- Shell identity label is not an `h1`
- Mobile disclosure: native button, `aria-expanded`, Escape closes, closes on
  route change, focus returns to toggle on Escape
- Route change focuses the content container (`tabIndex={-1}`)
- Desktop + Pixel 7 covered by Playwright

## 8. Compatibility

Unchanged by PS-013:

- Mission Control / Decision Log schemas and APIs
- SubmitDecision and exactly-once consequences
- SimulationProjection
- Authentication and tenant isolation
- Direct URLs for Mission Control and Decision Log

## 9. Persistence

No migration. No new table. No shell persistence.

## 10. Future extensions

Later surfaces may register as shell destinations only when their roadmap
slice ships. Do not add disabled, hidden, or “coming soon” navigation items.
