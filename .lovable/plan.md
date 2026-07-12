
# ProjectSim v2 — Workplace Simulation

Goal: transform the current single-scenario page into an enterprise workplace where every one of the 15 industries has a Tailoring Workshop, an Inbox of emails, Meetings, Documents, live dashboards, AI stakeholders, and branching decisions — thin but end-to-end so the pattern is proven everywhere.

## Scope of this build

Because you picked **Everything, broad across all 15 industries**, I will keep each industry shallow (3–5 scenarios per phase, 2–3 stakeholders, 4–6 documents) but make the surfaces real. Depth per industry comes in follow-up turns.

### 1. Simulation engine (data-driven, reusable)
`src/lib/sim/` — new engine:
- `types.ts` — `IndustryCase`, `Stakeholder`, `Document`, `Email`, `Meeting`, `SimEvent`, `Decision`, `DecisionOption`, `Consequence`, `ProjectMetrics`, `Phase` (`Initiation | Planning | Execution | Monitoring | Closing`), `DeliveryApproach`.
- `engine.ts` — pure reducer: applies a Decision → mutates metrics (health, budget, schedule, risk, morale, trust, satisfaction, quality) + unlocks next events + advances phase when phase-gate met.
- `cases/` — one file per industry (15 files) exporting an `IndustryCase` with stakeholders, initial docs, per-phase decisions, and branching consequences. Shallow but complete.
- `tailoring.ts` — Phase 0 workshop questions + scoring against case's recommended approach.
- `pmbok-map.ts` — every decision tagged with ECO domain + PMBOK 8 principle/performance domain (reuses existing `src/lib/pmbok8.ts`).

### 2. Workplace shell
New route `src/routes/_authenticated/sim.$caseId.tsx` with a Teams/Linear-style layout:

```text
┌─Sidebar──┬─Main workspace──────────────┬─Maya coach─┐
│ Dashboard│ [Tabs: Inbox │ Meetings │  │            │
│ Inbox 3  │  Documents │ Dashboard │   │  (existing │
│ Meetings │  Stakeholders │ Decision]  │   panel,   │
│ Documents│                              │   reused)  │
│ Stakes.  │  <active surface renders>   │            │
│ RAID     │                              │            │
│ Reports  │                              │            │
└──────────┴──────────────────────────────┴────────────┘
```
- `WorkplaceShell` component with sidebar + tabs + Maya on the right.
- Persistent header shows project name, phase pill, health meter.

### 3. Surfaces (each is a small React component)
- **Inbox** — email list + reader with sender avatar, subject, timestamp; opening an email may unlock a Decision.
- **Meetings** — meeting cards with attendees + agenda; "Join" opens a transcript view culminating in a Decision.
- **Documents** — Business Case, Charter, Risk Register, RAID, Status Report, Contract snippets. Markdown-rendered in a document viewer.
- **Stakeholders** — cards with personality/priorities; "Chat" opens streaming AI conversation via new `/api/sim-stakeholder` endpoint (Lovable AI, google/gemini-3-flash-preview, persona in system prompt, never reveals answers).
- **Dashboard** — animated meters (Health, Budget, Schedule, Risk, Morale, Trust, Quality, Satisfaction) with framer-motion transitions on each decision.
- **Decision panel** — replaces current scenario choice UI; shows situation + options + immediate consequence animation.

### 4. Tailoring Workshop (Phase 0)
Route `sim.$caseId` in `phase === "Tailoring"` renders a 10-question workshop (delivery approach, governance, cadence, change control, risk, procurement, comms, team, success criteria, reporting). Submit → Maya scores it vs. the case's recommended tailoring and unlocks Phase 1.

### 5. Live event engine
After each decision:
- reducer picks next event from pool filtered by prior choices + phase
- new items appear in Inbox / Meetings with unread badges
- metrics animate; if any metric drops below threshold, an escalation event queues

### 6. AI stakeholders + coaching
- Reuse existing `/api/maya-ask` (coach) unchanged.
- New `src/routes/api/sim-stakeholder.ts` — streaming chat scoped to one stakeholder persona + current project state. Same Lovable AI gateway pattern as `maya-ask`.
- Reuse existing `MayaPanel` on the right; wired to current decision.

### 7. Persistence
Client-side only for this pass: `src/lib/sim/store.tsx` React context + `localStorage` per `caseId` (metrics, unlocked events, decisions log, phase). Supabase persistence deferred — not in this slice.

### 8. Entry point
- `/play` becomes a case picker: 15 industry cards grouped by sector, "Start simulation" → `/sim/$caseId`.
- Existing exam surfaces untouched.

### 9. Design
Reuse existing tokens (Inter, #1C2B6B primary, #6C63FF accent, 18px radius, existing shadow). Framer-motion for meter animations and tab transitions. Fully responsive; mobile collapses sidebar and Maya into drawers.

## Out of scope for this turn
- Deep branching per industry (each case ships shallow: ~12 decisions total covering all 5 phases)
- Server-side persistence / cross-device sync
- Voice/video for meetings
- Full document editor (viewer only)
- Portfolio/program level

## Files
**Create** (~25): `src/lib/sim/{types,engine,tailoring,pmbok-map,store}.ts(x)`, `src/lib/sim/cases/*.ts` (15), `src/components/sim/{WorkplaceShell,Sidebar,Inbox,Meetings,Documents,Stakeholders,Dashboard,DecisionPanel,TailoringWorkshop,MetricMeter}.tsx`, `src/routes/_authenticated/sim.$caseId.tsx`, `src/routes/api/sim-stakeholder.ts`.
**Edit**: `src/routes/_authenticated/play.tsx` (→ case picker), `src/routes/__root.tsx` (nav if needed).

## Realistic expectation
This is ~2500 lines across 40 files. I'll build it in one pass but each of the 15 cases will be intentionally thin (proof-of-pattern). After you approve, iterate industry-by-industry to add depth, more events, more stakeholders, and Supabase persistence.
