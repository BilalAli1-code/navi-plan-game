# BC-008 — Information Architecture

## 1. Learner journey (current)

```text
[External / Dev auth]
        ↓
Home `/`
        ↓
Catalog `/catalog` ──→ Case details `/catalog/:businessCaseId`
        ↓ create run
Simulation Run `/app/runs/:simulationRunId`
        ↓ redirect
Mission Control
        ├── Inbox
        ├── Meetings
        ├── Stakeholders
        ├── Documents
        ├── Notifications
        ├── Activities ──→ Completed History
        ├── Decision Log ──→ Decision Workspace `/decisions` (outside shell)
        ├── Performance
        ├── Progress (Learner Progression)
        ├── Achievements
        ├── Mastery
        └── Coaching
```

Decision Workspace is **outside** the WorkplaceShell `<Outlet>` tree in `App.tsx` (sibling route under `/app/runs/:id`), so shell nav disappears while deciding unless the learner navigates back via browser or in-page links.

## 2. Navigation paths

| From | To | Mechanism |
|---|---|---|
| Home | Catalog | Link |
| Catalog | Case details | Card / link |
| Case details | Mission Control | After `POST /simulation-runs` navigate to run |
| Run index | Mission Control | `DefaultRunRedirect` |
| Shell nav | Any of 14 workplace children | `NavLink` |
| Mission Control | Decision Workspace | Recommended-action / pending-decision links |
| Decision Log | Decision Workspace | Per-entry / CTA links |
| Shell | Home | “Home” link in context bar |
| Decision Workspace | Shell surfaces | No shell chrome — learner must use browser back or typed URL |

## 3. Cross-links and duplicate entry points

| Destination | Entry points |
|---|---|
| Mission Control | Default redirect, shell nav, post-create-run |
| Decision Workspace | MC recommended actions, Decision Log links, direct URL |
| Documents | Shell nav only (no deep-link from decision evidence UI yet) |
| Inbox | Shell nav only |

## 4. Dead ends / friction

| Issue | Severity | Notes |
|---|---|---|
| Decision Workspace leaves shell nav | Major | Orientation loss during core task |
| No Settings / Sign out | Major | Session management incomplete for learners |
| No dedicated Login route | Major | Production auth depends on external Supabase UX |
| No dedicated Outcome / run-complete screen | Major | Closure feedback scattered (MC + Notifications) |
| `?decision=` query unused on DecisionPage | Minor | Deep-link intent incomplete |
| Progress nav label vs H1 “Learner Progression” | Minor | Terminology mismatch |
| Achievements/Mastery/Coaching auth gate weaker | Minor | Missing Dev Sign-in / Home links |

## 5. Orphan / missing pages

| Page | Status |
|---|---|
| Settings | Missing |
| Login | Missing |
| Chapter detail | Missing (partial MC/Progress) |
| Outcome / ending summary | Missing as dedicated route |
| Decision Workspace in shell nav | Missing |

## 6. Information hierarchy observations (baseline)

- Most workplace pages use: eyebrow → H1 → subtitle → status → content list/detail
- Mission Control is densest (counts, metrics, actions, chapter, outcomes)
- Horizontal shell nav at desktop packs **14** destinations — crowding risk on laptop widths
- Content max-width typically 48–56rem; shell ~52rem
