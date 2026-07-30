# Screen-to-screen migration matrix

**Authority rules (non-negotiable)**

- Transfer / adapt only: design tokens, colors/typography, spacing/radius, approved assets, nav presentation, layouts, cards/badges/indicators, responsive presentation, loading skeletons, non-authoritative animations, presentational JSX patterns.
- Do **not** copy: `src/lib/sim/**`, `useSim()`, legacy simulation state/routing, Supabase/Lovable integrations, backend functions, direct DB access, browser-calculated progress/eligibility/XP/metrics/outcomes, mock authoritative data, legacy Decision-submission behavior.
- Preserve all ProjectSim 2 Domain/Application/infrastructure, API + projection contracts, query hooks/keys, routes, commands, authorization, convergence.

**Source pin:** `navi-plan-game` `main` @ `0eb6abfdafde14a6fedd06f3a8b0f75dc9f58870` (see `00_Source_Reference.md`). Legacy paths below verified against that SHA.

**PS2 baseline:** `main` @ `3c53d08`.

**Implementation order (one surface per feature branch + draft PR):**

1. Workplace Shell (tokens + frame + nav presentation)
2. Mission Control
3. Remaining surfaces per priority in this matrix

Legend for **Legacy status**: `EVIDENCE` = cited in prior transfer audit / gap report (SHA unverified); `UNKNOWN` = no readable legacy tree yet; `N/A` = no legacy analogue expected.

---

## Cross-cutting: design system

| Column | Value |
| --- | --- |
| Legacy component / file | `src/styles.css` (Navy Trust) — **verified @ 0eb6abf** |
| PS2 route / component | Global: `apps/web/src/index.css` (+ feature CSS with hard-coded hex on baseline) |
| PS2 projection | none |
| Commands | none |
| Transferable visuals | Color / surface / border / focus / status tokens; radius; shadow; base button/input/alert; typography stack |
| Incompatible legacy deps | None for tokens alone |
| Visual fields missing from PS2 | Consistent token adoption across feature CSS; shared skeleton / empty / error chrome |
| `packages/ui` needs | Optional token CSS package or documented `--ps-*` contract consumed by `ps-*` Decision classes |
| A11y / responsive | Focus-visible ≥3px; status never by color alone; honor `prefers-reduced-motion` |
| Priority | **P0 — prerequisite for all surfaces** |

---

## 1. Workplace Shell

| Column | Value |
| --- | --- |
| Legacy component / file | `src/components/sim/WorkplaceShell.tsx` (Tailwind utility chrome; tokens in `src/styles.css`) — **verified @ 0eb6abf** |
| PS2 route / component | `/app/runs/:simulationRunId` → `apps/web/src/features/workplace/WorkplaceShell.tsx` + `WorkplaceShell.css` |
| PS2 projection | **None** (UI-only shell; children own queries) |
| Commands | none |
| Transferable visuals | Elevated context bar; left/stacked nav presentation; content surface; mobile hamburger ≤719px; sticky desktop frame; nav grouping labels (Workplace / History / Learning) **without changing routes** |
| Incompatible legacy deps | Legacy shell owns tabs, counts, progress, reset, active Decision state, direct simulation actions via `useSim()` — **must not transfer** |
| Visual fields missing from PS2 | Shell badge counts (would require projection fetch — **forbidden in shell** unless a dedicated read-only badge projection is approved later); Decision link inside shell (Decision remains sibling route today) |
| `packages/ui` needs | Optional `NavSection` / `ShellFrame` presentational primitives |
| A11y / responsive | Keep: `nav aria-label`, menu `aria-expanded`/`aria-controls`, Escape close, content focus on route change, 44px targets, `matchMedia(max-width:719px)`, `prefers-reduced-motion`. Add skip link if missing after visual pass. |
| Priority | **P0 — implement first** |

**Nav map (PS2 routes preserved):** Mission Control, Inbox, Meetings, Stakeholders, Documents, Notifications, Activities, Completed History, Decision Log, Performance, Progress, Achievements, Mastery, Coaching. Decision Workspace URL stays `/app/runs/:id/decisions` (outside shell outlet).

---

## 2. Mission Control

| Column | Value |
| --- | --- |
| Legacy component / file | `src/components/sim/MissionControl.tsx` (+ `Dashboard.tsx`, day/risk/conflict panels) — **verified @ 0eb6abf** |
| PS2 route / component | `/app/runs/:simulationRunId/mission-control` → `…/mission-control/MissionControlPage.tsx` + `.css` |
| PS2 projection | `useMissionControlProjection` → `["mission-control", actorId, simulationRunId]`; contract `MissionControlProjection` (`packages/domain/src/projection/mission-control-contracts.ts`) |
| Commands | `CompleteChapter` → `POST …/commands/complete-chapter` |
| Transferable visuals | Card hierarchy / section chrome; count tiles; recommended-action list styling; outcome card; chapter action strip; loading skeleton appearance; badges/indicators **bound only to projection fields** |
| Incompatible legacy deps | Browser-calculated recommendations, progress, decision performance, XP, achievements |
| Visual fields missing from PS2 | Payload already includes `counts.activeActivities` and `counts.blockingCrises` but UI does **not** render them (presentation gap, not contract gap). Legacy XP/progress/achievement tiles have **no PS2 MC fields** — do not invent. |
| `packages/ui` needs | `CountTile`, `ActionList`, `OutcomeCard`, `SkeletonBlock` (presentational) |
| A11y / responsive | Preserve Unavailable honesty; `aria-labelledby` sections; `aria-live` for convergence; card grid that stacks &lt;720px |
| Priority | **P0 — implement second** |

**Bindable MC fields (do not fabricate beyond these):**  
`runSummary.{status,currentChapterId,currentDayId}`; `projectSummary.{status,metrics[]}`; `counts.{pendingDecisions,unreadActionRequiredInboxItems,upcomingMeetings,activeActivities,blockingCrises}`; `nextRecommendedActions[]`; `recentRevealedOutcome`; freshness meta.

---

## 3. Decision Workspace

| Column | Value |
| --- | --- |
| Legacy component / file | `src/components/sim/DecisionPanel.tsx` — EVIDENCE |
| PS2 route / component | `/app/runs/:simulationRunId/decisions` → `DecisionPage.tsx` + `@projectsim/ui` `DecisionWorkspace` (**sibling of shell**, not nested) |
| PS2 projection | `useSimulationProjection` → `["simulation-projection", actorId, simulationRunId]` |
| Commands | `SubmitDecision` → `POST …/commands/submit-decision` |
| Transferable visuals | Option cards, status banner, history list chrome, `ps-*` stylesheet (already drafted on closed branch) |
| Incompatible legacy deps | Legacy Decision flow / client outcome authority |
| Visual fields missing from PS2 | None for core decide/submit; optional shell nesting is **presentation-only** if URL/API preserved |
| `packages/ui` needs | Styles for existing `ps-decision-*` / `ps-option` classes (no new authority) |
| A11y / responsive | Radiogroup labels; focus status after submit; `aria-busy` |
| Priority | P0 (after Shell + MC) |

---

## 4. Inbox

| Column | Value |
| --- | --- |
| Legacy component / file | UNKNOWN (expected under `src/components/sim/**`) |
| PS2 route / component | `…/inbox` → `InboxPage.tsx` |
| PS2 projection | `useInboxProjection` → `["inbox", actorId, simulationRunId]` |
| Commands | none |
| Transferable visuals | Message list/detail cards; expand/collapse chrome; empty state |
| Incompatible legacy deps | Any client “mark read” / eligibility inventing |
| Visual fields missing from PS2 | Read/unread authoritative UI if legacy showed it without PS2 contract — see missing-contracts report |
| `packages/ui` needs | `MessageCard`, skeleton |
| A11y / responsive | Keep `aria-expanded`; stack on narrow |
| Priority | P0 |

---

## 5. Meetings

| Column | Value |
| --- | --- |
| Legacy | UNKNOWN |
| PS2 | `…/meetings` → `MeetingsPage.tsx` |
| Projection | `useMeetingsProjection` → `["meetings", …]` |
| Commands | `StartMeeting`, `CompleteMeeting` |
| Transferable | Meeting cards; status badges; action button styling |
| Incompatible | Client-side schedule mutation beyond commands |
| Missing visuals vs contract | TBD after source inspect |
| `packages/ui` | `MeetingCard`, status badge |
| A11y / responsive | Add viewport breakpoints if missing |
| Priority | P1 |

---

## 6. Stakeholders

| Column | Value |
| --- | --- |
| Legacy | UNKNOWN |
| PS2 | `…/stakeholders` → `StakeholdersPage.tsx` |
| Projection | `useStakeholdersProjection` |
| Commands | none |
| Transferable | Master–detail layout; profile/conversation chrome |
| Incompatible | Relationship / affinity calculations |
| Missing | TBD |
| `packages/ui` | List/detail shell |
| A11y / responsive | Convert two-pane squeeze &lt;720px to list→detail navigation |
| Priority | P1 |

---

## 7. Documents

| Column | Value |
| --- | --- |
| Legacy | UNKNOWN |
| PS2 | `…/documents` → `DocumentsPage.tsx` |
| Projection | `useDocumentsProjection` |
| Commands | none |
| Transferable | Master–detail; document body typography |
| Incompatible | Revealing hidden sections client-side |
| Missing | TBD |
| `packages/ui` | List/detail shell |
| A11y / responsive | Same as Stakeholders |
| Priority | P0 |

---

## 8. Notifications

| Column | Value |
| --- | --- |
| Legacy | UNKNOWN |
| PS2 | `…/notifications` → `NotificationsPage.tsx` |
| Projection | `useNotificationsProjection` |
| Commands | none |
| Transferable | Notice cards; ending notice chrome (learner-safe copy already server-owned) |
| Incompatible | Fake completion banners |
| Missing | Dedicated run-completion/outcome **route** (see missing contracts) |
| `packages/ui` | `NoticeCard` |
| A11y / responsive | Distinguish visually from Inbox without merging data |
| Priority | P1 |

---

## 9. Activities

| Column | Value |
| --- | --- |
| Legacy | UNKNOWN |
| PS2 | `…/activities` → `ActivitiesPage.tsx` |
| Projection | `useActivitiesProjection` |
| Commands | `CompleteActivity` |
| Transferable | Activity cards; complete CTA styling |
| Incompatible | Client completion without command |
| Missing | TBD |
| `packages/ui` | `ActivityCard` |
| Priority | P1 |

---

## 10. Completed History

| Column | Value |
| --- | --- |
| Legacy | UNKNOWN |
| PS2 | `…/completed-history` → `CompletedHistoryPage.tsx` |
| Projection | `useCompletedHistoryProjection` |
| Commands | none |
| Transferable | Archive list chrome |
| Incompatible | Rewriting history |
| Missing | TBD |
| Priority | P2 |

---

## 11. Decision Log

| Column | Value |
| --- | --- |
| Legacy | UNKNOWN / overlap with Decision history panel |
| PS2 | `…/decision-log` → `DecisionLogPage.tsx` |
| Projection | `useDecisionLogProjection` |
| Commands | none |
| Transferable | Audit list; outcome summary cards |
| Incompatible | Unrevealed outcome inventing |
| Missing | Visual distinction from DecisionWorkspace history (presentation only) |
| Priority | P0 |

---

## 12. Performance

| Column | Value |
| --- | --- |
| Legacy | Likely part of MissionControl/Dashboard — EVIDENCE of browser XP/metrics |
| PS2 | `…/performance` → `PerformancePage.tsx` |
| Projection | `usePerformanceProjection` |
| Commands | none |
| Transferable | Evidence count tiles |
| Incompatible | XP / mastery inventing |
| Missing | Explicit empty state; unused contract fields `recentlyResolvedDecisions` / project metrics not rendered |
| Priority | P1 |

---

## 13. Progress (Learner Progression)

| Column | Value |
| --- | --- |
| Legacy | Progress UI tied to `useSim()` — EVIDENCE |
| PS2 | `…/progress` → `LearnerProgressionPage.tsx` |
| Projection | `useLearnerProgressionProjection` |
| Commands | none |
| Transferable | Chapter list / requirement checklist chrome |
| Incompatible | Browser progress % |
| Missing | Some summary/blocker fields may exist in contract but not rendered — verify before inventing UI |
| Priority | P1 |

---

## 14–16. Achievements / Mastery / Coaching

| Surface | Route | Projection key | Commands | Transferable | Incompatible | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Achievements | `…/achievements` | `["achievements", …]` | none | Award cards; XP-unavailable honesty chrome | Invented awards/XP | Keep `xpSummary.availability` honesty |
| Mastery | `…/mastery` | `["mastery", …]` | none | Competency list chrome | Invented bands | Keep band unavailable honesty |
| Coaching | `…/coaching` | `["coaching", …]` | none | Intervention cards | AI mutating run state | Render only projection interventions |

Priority: P1 each.

---

## 17. Catalog / Case details / Home

| Surface | PS2 route | Projection / API | Commands | Transferable | Incompatible |
| --- | --- | --- | --- | --- | --- |
| Home | `/` | none | DEV seed only | Entry visual hierarchy (Navy Trust) | Promoting DEV controls to learners |
| Catalog | `/catalog` | `["business-cases", actorId]` | GET list | Case cards | Fake cases |
| Case details | `/catalog/:businessCaseId` | details + create | `POST /api/v1/simulation-runs` | Hero/detail layout; CTA | Client-side eligibility beyond API `selectable` |

Priority: Catalog/Case P1; Home P2.

---

## 18. Auth / Settings / Sign-out

| Column | Value |
| --- | --- |
| Legacy | UNKNOWN |
| PS2 | Session gates in `session.tsx`; **no** learner login/settings/sign-out chrome |
| Projection | n/a |
| Commands | existing `clearSession` behavior only |
| Transferable | Presentational login/settings shell **around existing auth** |
| Missing contract | Product decision for learner-facing settings route — see missing contracts |
| Priority | P0 presentation once product approves surface |

---

## packages/ui reusable checklist (from matrix)

| Component | First consumer | Authority |
| --- | --- | --- |
| Token / `--ps-*` stylesheet consumption | Shell, Decision `ps-*` | none |
| `ShellFrame` / nav section labels | Workplace Shell | none |
| `CountTile` | Mission Control, Performance | display projection counts only |
| `ActionList` | Mission Control | links from `nextRecommendedActions` only |
| `OutcomeCard` | Mission Control, Decision Log | revealed outcomes only |
| `SkeletonBlock` | all surfaces | never fabricate values |
| `MessageCard` / `NoticeCard` | Inbox / Notifications | projection only |
| `ListDetailShell` | Stakeholders, Documents | projection only |
| Decision `ps-*` CSS | DecisionWorkspace | existing components |

---

## Explicit non-transfer list (architecture)

| Legacy source | Reason |
| --- | --- |
| `src/lib/sim/**` | Client simulation engine / state authority |
| `useSim()` store | Replaces projections |
| Legacy `WorkplaceShell` / `MissionControl` / `Dashboard` / `DecisionPanel` **behavior** | Owns progress, XP, decisions, resets |
| `src/routes/**`, TanStack route tree | Conflicts with React Router |
| `src/integrations/supabase/**`, Lovable configs | Outside PS2 auth/API boundary |
| Server/Stripe and backend functions | Out of scope |
| Browser-calculated progress / eligibility / XP / metrics / outcomes | Forbidden |

---

## Re-verification gate

Before any surface implementation PR merges:

1. `00_Source_Reference.md` lists exact branch + SHA.
2. Each legacy file path in this matrix is confirmed at that SHA (or marked absent).
3. Transferable visual notes cite concrete selectors/assets from that SHA.
4. No Domain/Application/API/projection/query-key/route/command changes land in visual PRs unless separately approved as contract work.

---

## Verified legacy nav (WorkplaceShell @ 0eb6abf)

**Group Workspace:** Mission Control, Inbox, Team Chat, Meetings, Documents, Stakeholders, PM Tools, Notifications  
**Group Learning:** Project Metrics, PMBOK Mastery  
**Not transferred as routes:** Team Chat, PM Tools, Restart simulation, All simulations back-link behavior, Maya side panel, phase strip with store data, XP/health/unread badges (client-computed).

**PS2 nav grouping (presentation only; routes unchanged):**

- **Workspace:** Mission Control, Inbox, Meetings, Stakeholders, Documents, Notifications, Activities  
- **History:** Completed History, Decision Log  
- **Learning:** Performance, Progress, Achievements, Mastery, Coaching  

## Verified Navy Trust palette comment (@ 0eb6abf)

`#0f1b3d` `#1e3a5f` `#3b6fa0` `#e8edf3` — Libre Baskerville (display) + IBM Plex Sans (body); `--radius: 0.75rem`.
