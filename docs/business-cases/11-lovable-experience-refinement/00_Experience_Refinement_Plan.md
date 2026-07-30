# BC-008 — Experience Refinement Plan (UI Baseline Phase)

**Status:** Baseline inventory complete — Lovable work not started
**Roadmap item:** BC-008 — Lovable Experience Refinement
**GitHub issue:** #94 (Part of #94 until entire BC-008 completes)
**Prerequisite:** BC-007 merged (`6bb37b4`)

## 1. Objective of this phase

Establish a complete, measurable inventory of the existing learner experience **before** any Lovable refinement.

This phase:

- inspects and documents only
- does **not** redesign
- does **not** modify business logic, architecture, APIs, projections, or content IDs
- produces the reference every future BC-008 change will be measured against

## 2. Authority and boundaries

| Layer | Authority |
|---|---|
| SimulationRun / SimulationState | Authoritative runtime state |
| Projections | Derived, disposable, learner-safe reads |
| UI | Presentation only — no UI-owned business logic |
| Content package | Declarative Northstar / Harbor data |
| Lovable | Presentation refinement only; GitHub remains source of truth |

See § Lovable boundaries in `09_BC008_Baseline_Report.md` and `AGENTS.md`.

## 3. Deliverables (this PR)

| Artifact | Path |
|---|---|
| Current UI audit | `01_Current_UI_Audit.md` |
| Information architecture | `02_Information_Architecture.md` |
| Component inventory | `03_Component_Inventory.md` |
| Surface refinement matrix | `04_Surface_Refinement_Matrix.md` |
| Responsive baseline | `05_Responsive_Baseline.md` |
| Accessibility baseline | `06_Accessibility_Baseline.md` |
| Screenshot index | `07_Screenshot_Index.md` |
| Known UX issues | `08_Known_UX_Issues.md` |
| Baseline report | `09_BC008_Baseline_Report.md` |
| Screenshots | `screenshots/` |

## 4. Explicit non-goals (this PR)

- No Lovable sessions
- No visual redesign
- No spacing/typography “improvements”
- No navigation restructuring
- No API/projection/command/schema changes
- No XP/mastery invention
- No content ID changes

## 5. Next phases (out of scope here)

Future BC-008 workstreams may refine presentation against this baseline, still subject to Lovable MAY / MAY NOT rules.
