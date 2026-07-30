# BC-008 — Current UI Audit

**Package:** `apps/web` + `@projectsim/ui`
**Router:** `apps/web/src/App.tsx` (no separate router module)
**Shell:** `apps/web/src/features/workplace/WorkplaceShell.tsx`

## 1. Route inventory

| Route | Component | Nav entry | Purpose |
|---|---|---|---|
| `/` | `App.tsx` `HomePage` | — | Dev/home entry; session status |
| `/catalog` | `CatalogPage.tsx` | Home link | Selectable business cases |
| `/catalog/:businessCaseId` | `CaseDetailsPage.tsx` | Catalog card | Case details + create run |
| `/app/runs/:simulationRunId` | `DefaultRunRedirect.tsx` | — | Redirect → mission-control |
| `/app/runs/:id/mission-control` | `MissionControlPage.tsx` | Mission Control | Overview + counts + actions |
| `/app/runs/:id/inbox` | `InboxPage.tsx` | Inbox | Learner messages |
| `/app/runs/:id/meetings` | `MeetingsPage.tsx` | Meetings | Upcoming/completed meetings |
| `/app/runs/:id/stakeholders` | `StakeholdersPage.tsx` | Stakeholders | Profiles + conversations |
| `/app/runs/:id/documents` | `DocumentsPage.tsx` | Documents | Evidence documents |
| `/app/runs/:id/notifications` | `NotificationsPage.tsx` | Notifications | System notifications |
| `/app/runs/:id/activities` | `ActivitiesPage.tsx` | Activities | Active activities |
| `/app/runs/:id/completed-history` | `CompletedHistoryPage.tsx` | Completed History | Completed activities archive |
| `/app/runs/:id/decision-log` | `DecisionLogPage.tsx` | Decision Log | Completed decisions |
| `/app/runs/:id/performance` | `PerformancePage.tsx` | Performance | Evidence counts |
| `/app/runs/:id/progress` | `LearnerProgressionPage.tsx` | Progress | Chapter catalog / requirements |
| `/app/runs/:id/achievements` | `AchievementsPage.tsx` | Achievements | Awarded achievements + XP honesty |
| `/app/runs/:id/mastery` | `MasteryPage.tsx` | Mastery | Competency evidence / bands |
| `/app/runs/:id/coaching` | `CoachingPage.tsx` | Coaching | Coaching interventions |
| `/app/runs/:id/decisions` | `DecisionPage.tsx` | **Not in shell nav** | Decision workspace (`@projectsim/ui`) |
| `*` | Navigate → `/` | — | Fallback |

**Missing surfaces (not implemented as routes):** Settings, dedicated Login, dedicated Chapter page, dedicated Outcome/Run-completion page, Sign-out control.

## 2. Shell navigation (15 items)

Order in `WorkplaceShell.tsx`:

1. Mission Control
2. Inbox
3. Meetings
4. Stakeholders
5. Documents
6. Notifications
7. Activities
8. Completed History
9. Decision Log
10. Performance
11. Progress
12. Achievements
13. Mastery
14. Coaching

Plus context bar: Workplace identity, run id, Home link. Narrow viewport (`≤719px`): hamburger “Workplace menu”.

Decision Workspace is reached from Mission Control / Decision Log links only — **orphan from primary nav**.

## 3. Data sources by surface

| Surface | Projection / API | Query key | Commands (if any) |
|---|---|---|---|
| Mission Control | `GET …/mission-control` | `["mission-control", actorId, runId]` | `complete-chapter` |
| Inbox | `GET …/inbox` | `["inbox", …]` | — |
| Meetings | `GET …/meetings` | `["meetings", …]` | `start-meeting`, `complete-meeting` |
| Stakeholders | `GET …/stakeholders` | `["stakeholders", …]` | — |
| Documents | `GET …/documents` | `["documents", …]` | — |
| Notifications | `GET …/notifications` | `["notifications", …]` | — |
| Activities | `GET …/activities` | `["activities", …]` | `complete-activity` |
| Completed History | `GET …/completed-history` | `["completed-history", …]` | — |
| Decision Log | `GET …/decision-log` | `["decision-log", …]` | — |
| Performance | `GET …/performance` | `["performance", …]` | — |
| Progress | `GET …/learner-progression` | `["learner-progression", …]` | — |
| Achievements | `GET …/achievements` | `["achievements", …]` | — |
| Mastery | `GET …/mastery` | `["mastery", …]` | — |
| Coaching | `GET …/coaching` | `["coaching", …]` | — |
| Decision Workspace | `GET …/projection` | `["simulation-projection", …]` | `submit-decision` |
| Catalog | `GET /api/v1/business-cases` | `["business-cases", …]` | `POST /simulation-runs` |

All workplace reads are projection-backed. UI must not invent authoritative state.

## 4. Shared behavioral template (most workplace pages)

1. Auth gate → `role="alert"` “Authentication required.”
2. Missing run id → alert
3. Loading → `role="status" aria-live="polite"`
4. Error (no cache) → alert + optional Retry
5. Stale / `rebuild_failed` → per-page stale copy
6. `?expectVersion=` convergence poll (250ms, 8s timeout)
7. Fresh marker `data-testid="{surface}-freshness"`
8. Empty list `data-testid="{surface}-empty"`

## 5. Auth model (current)

| Mode | Mechanism | UI |
|---|---|---|
| Production | Supabase session JWT | No `/login` route; pages gate on token |
| Dev | `createDevBrowserToken()` on Home | Dev session controls on `/` |
| E2E | `VITE_ENABLE_E2E_AUTH_HOOK` + `window.__PROJECTSIM_E2E_AUTH__` | Hook-only |

Sign-out exists in `session.tsx` (`clearSession`) but **no learner-facing control** exposes it.

## 6. Visual system (implemented vs approved)

| Topic | Approved (`PS-UI-009`) | Implemented |
|---|---|---|
| Semantic tokens | `surface.*`, `text.*`, `status.*` | **Not wired** — hard-coded hex |
| Tailwind | Not required | Not used |
| CSS variables | Tokenized | **None** in `apps/web` / `packages/ui` |
| Accent | Single semantic brand | **Split:** teal `#0f766e` vs blue `#1d4ed8` |
| Theme | Consistent surfaces | Dark global body (`index.css`) vs light page overrides |

## 7. `@projectsim/ui` package

| Component | File | Used by web? |
|---|---|---|
| `DecisionWorkspace` | `packages/ui/src/decision/DecisionWorkspace.tsx` | Yes (`DecisionPage`) |
| `ProjectionFreshnessBanner` | `ProjectionFreshnessBanner.tsx` | Internal to workspace only |
| `DecisionOptionGroup` | `DecisionOptionGroup.tsx` | Internal |
| `DecisionHistoryList` | `DecisionHistoryList.tsx` | Internal |

`ps-*` CSS classes are **not styled** by `apps/web` — Decision Workspace is largely unstyled HTML in the app.

## 8. Chapter / outcome / completion presentation

| Concern | Current presentation |
|---|---|
| Chapter context | Mission Control “Chapter” section; Progress chapter list |
| Chapter complete action | Mission Control command button |
| Recent outcome | Mission Control “Recent revealed outcome” |
| Full ending / run complete | No dedicated Outcome route; ending notification may appear in Notifications |
| Decision outcomes | Decision Log + DecisionWorkspace history |

## 9. Loading / empty / error / unavailable (summary)

Documented per surface in `04_Surface_Refinement_Matrix.md`. Notable gaps:

- Performance has **no empty-state** treatment (always shows counts)
- Achievements / Mastery / Coaching auth gates lack Dev Sign-in / Back-to-home links present on other pages
- Mission Control exposes `Unavailable` for unimplemented channel counts (`channel_not_implemented`)
