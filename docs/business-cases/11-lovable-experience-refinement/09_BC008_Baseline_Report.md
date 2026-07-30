# BC-008 — UI Baseline Report

**Verdict target:** BC-008 UI BASELINE READY FOR LOVABLE
**Branch:** `cursor/bc-008-lovable-experience-refinement`
**Main baseline:** BC-007 merge `6bb37b4`

## 1. Purpose

This report certifies that ProjectSim’s learner UI has been inventoried with measurable documentation and screenshot evidence **before** Lovable refinement begins.

## 2. Scope completed

- [x] Synchronize to merged main including BC-007
- [x] Inventory every learner-facing route/surface
- [x] Inventory design primitives and duplicates
- [x] Map information architecture
- [x] Document responsive baseline
- [x] Document accessibility baseline
- [x] Capture screenshot baseline (see `07_Screenshot_Index.md`)
- [x] Record UX issues without fixing
- [x] Define Lovable MAY / MAY NOT boundaries
- [x] Update `AGENTS.md`
- [x] Validate format/lint/typecheck/build without runtime behavior changes

## 3. Lovable boundaries (permanent)

### Lovable MAY

- Improve layout, spacing, readability, navigation clarity
- Improve responsiveness and accessibility presentation
- Improve empty / loading / error state presentation
- Improve guidance and urgency **presentation** without revealing hidden content
- Improve visual hierarchy using approved content already available to the learner

### Lovable MAY NOT

- Change SimulationState, commands, projections, APIs
- Change decision logic, consequences, scoring, XP, mastery
- Change architecture, database, migrations
- Change content IDs or runtime behavior
- Hardcode business logic in the UI
- Become the source of truth (all accepted changes return to GitHub)

## 4. Architecture restrictions for future UI PRs

1. UI displays projections / learner-safe APIs only.
2. Authoritative outcomes remain server/domain resolved.
3. Hidden weights, answer keys, resolver internals must never appear.
4. Unavailable XP/mastery states must remain honest until authored.
5. Experience-level differences are scaffolding only — not different rules for equivalent actions.

## 5. Counts (baseline)

| Metric | Count |
|---|---:|
| Routes discovered | 19 (+ fallback) |
| Shell nav destinations | 14 (+ Home context) |
| Workplace/projection surfaces | 15 including Decision Workspace |
| `@projectsim/ui` components | 4 (+ types) |
| UX issues logged | 25 |
| A11y issues logged | 14 |
| Runtime code changes in this PR | **0** |

## 6. Evidence index

| Doc | Path |
|---|---|
| Plan | `00_Experience_Refinement_Plan.md` |
| UI audit | `01_Current_UI_Audit.md` |
| IA | `02_Information_Architecture.md` |
| Components | `03_Component_Inventory.md` |
| Surface matrix | `04_Surface_Refinement_Matrix.md` |
| Responsive | `05_Responsive_Baseline.md` |
| Accessibility | `06_Accessibility_Baseline.md` |
| Screenshots | `07_Screenshot_Index.md` + `screenshots/` |
| UX issues | `08_Known_UX_Issues.md` |

## 7. Recommendation

**BC-008 UI BASELINE READY FOR LOVABLE**

Lovable work may begin only against this baseline, one surface at a time, with GitHub review of every accepted change.
