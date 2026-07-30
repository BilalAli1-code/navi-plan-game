# Missing contracts / visual gaps (do not fabricate)

This report lists learner-visible concepts that appear in legacy UX evidence or PS2 UI ambition but **must not be invented in the browser**. Items are split into: (A) presentational gaps against existing PS2 payloads, (B) contract gaps requiring Domain/Application/API work before UI can show them, (C) product/IA decisions.

## A. Presentation-only gaps (existing contracts)

| Gap | Evidence | Allowed fix |
| --- | --- | --- |
| Mission Control did not render `counts.activeActivities` / `counts.blockingCrises` | Addressed in Mission Control visual PR (`cursor/legacy-ui-mission-control-8018`) | Bound to projection fields only |
| Decision `ps-*` classes unstyled on `main` | `@projectsim/ui` emits classes; no stylesheet on baseline | Add presentational CSS (as drafted on closed transfer branch) |
| Feature CSS hard-coded teal/blue vs Navy Trust tokens | BC-008 audit; current `WorkplaceShell.css` | Replace with `--ps-*` per surface |
| Loading = text status only | BC-008 / gap report | Non-authoritative skeletons (no fake numbers) |
| Stakeholders / Documents two-pane squeeze on phones | Page CSS `@media (min-width:720px)` only | Presentational list→detail at narrow widths |
| Performance always shows counts; weak empty treatment | `PerformancePage` | Empty/unavailable chrome without inventing metrics |
| Shell lacks Decision nav entry | Decision is sibling route | Optional presentational link to existing Decision URL **without** nesting authority changes; do not move route unless separately approved |
| Inconsistent empty/error chrome | Per-page CSS | Shared presentational components; keep fail-closed semantics |

## B. Contract / authority gaps (blocked until server owns data)

| Gap | Why blocked | Notes |
| --- | --- | --- |
| Shell badge counts (unread inbox, pending decisions, etc.) | Shell is UI-only; fetching projections in shell would duplicate query ownership | Needs an approved badge projection **or** keep counts only on Mission Control |
| XP totals / mastery bands as calculated progress | Learning projections already expose availability honesty; inventing values is forbidden | UI may only show server `availability` / awards / competency deltas |
| Browser-calculated chapter % / eligibility | Legacy Mission Control did this via `useSim()` | Use `LearnerProgressionProjection` / command receipts only |
| Unrevealed decision outcomes | Decision Log / MC only show revealed summaries | Do not preview hidden outcomes |
| Client-side recommendation ranking beyond `nextRecommendedActions` | MC actions are authored server-side (`authoredOrder`) | Do not re-sort by local heuristics that imply new authority |
| Read/unread inbox mutation | Inbox projection is read-only in web | Needs command + projection fields if product requires mark-read |
| Dedicated run-completion / ending outcome screen | Ending fragments live in Notifications / CompleteChapter receipt | Needs approved completion projection + route before dedicated UI |
| Learner login / settings / sign-out product surface | Auth gates exist; no chrome | Presentation around existing session APIs only after product defines routes |

## C. Product / IA decisions (not data fabrication, but not silent)

| Decision | Options | Constraint |
| --- | --- | --- |
| Nest Decision visually under shell | Shell link vs route re-parent | Preserve `/app/runs/:id/decisions` URL + `SubmitDecision` contract |
| Nav grouping labels | Workplace / History / Learning | Labels only; **do not remove or merge routes** |
| Inbox vs Notifications visual distinction | Copy + chrome | Do not merge projections |
| Decision Log vs Decision history | Audit vs act | Keep both server-backed |

## Explicitly out of scope for visual transfer PRs

- Any change under `packages/domain`, `packages/application`, `packages/infrastructure` unless a separate contract PR is approved.
- New query keys, projection schema versions, or command payloads.
- Copying `src/lib/sim/**`, Lovable, or Supabase integration code from legacy.
- Mock authoritative JSON for demos.

When `projectsim-master` becomes readable, append a section **D. Legacy-only visuals with no PS2 field** listing each legacy UI widget and the missing contract id — still without fabricating data.
