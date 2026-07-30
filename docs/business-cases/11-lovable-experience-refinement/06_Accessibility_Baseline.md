# BC-008 — Accessibility Baseline

Inventory only. **Do not fix in this PR.**

## 1. Strengths already present

| Area | Evidence |
|---|---|
| Alerts | Widespread `role="alert"` on auth/load/action errors |
| Status | `role="status"` + `aria-live="polite"` on loading/stale/success |
| Landmarks | Sections with `aria-labelledby` / `aria-label` on most workplace pages |
| Shell | `aria-label="Workplace"`, menu `aria-expanded`/`aria-controls`, Escape closes, focus to `.workplace-content` |
| Current page | `NavLink` → `aria-current="page"` (unit tested) |
| Decision workspace | `aria-busy`, fieldset/radiogroup, focus to status after submit |
| Master–detail | `aria-pressed` on Documents/Stakeholders selectors |
| Inbox | `aria-expanded` on message toggles |
| Touch | `min-height: 44px` common on nav/buttons |
| Reduced motion | Media queries in several CSS files |
| Automated a11y | `e2e/learning-surfaces.a11y.spec.ts` (axe wcag2a/2aa on Achievements, Mastery, Coaching) |

## 2. Issues found

| ID | Severity | Area | Description | Surfaces |
|---|---|---|---|---|
| A11Y-001 | Critical | Navigation | No skip link to main content | Shell |
| A11Y-002 | Critical | Auth | No dedicated login form with labeled fields | Auth |
| A11Y-003 | Major | Decision | `ps-*` Decision UI unstyled — hierarchy/focus affordances weak | Decision Workspace |
| A11Y-004 | Major | Contrast | Dark global body vs forced light page text may fail contrast in places | Activities, Notifications, Completed History, others |
| A11Y-005 | Major | Auth gates | Achievements/Mastery/Coaching lack Dev Sign-in / Home links present elsewhere | Learning trio |
| A11Y-006 | Major | Orientation | Decision Workspace removes shell nav — lost landmark consistency mid-task | Decision |
| A11Y-007 | Major | Status | “Unavailable” counts rely heavily on text alone near numeric counts | Mission Control |
| A11Y-008 | Minor | Headings | Some section headings lack stable `id` for `aria-labelledby` (e.g. Performance counts) | Performance |
| A11Y-009 | Minor | Catalog errors | Inline alert without labelled section heading | Catalog |
| A11Y-010 | Minor | Deep link | `?decision=` ignored — no focus to target decision | DecisionPage |
| A11Y-011 | Minor | Icons | Text-only UI — no redundant non-color cues beyond copy for some statuses | Cross-cutting |
| A11Y-012 | Enhancement | Dialogs | No modal dialogs; when added later will need focus trap patterns | Future |
| A11Y-013 | Enhancement | Live regions | No toast/announcer for background projection rebuild completion | Cross-cutting |
| A11Y-014 | Minor | Terminology | Nav “Progress” vs page “Learner Progression” | Progress |

## 3. Keyboard / focus notes

- Shell moves focus to content on route change (`tabIndex={-1}`) — good for SPA continuity.
- Narrow menu Escape returns focus to toggle — good.
- Decision confirm flow manages focus to status — good.
- Tab order through 14 nav links is long on desktop — fatigue risk.

## 4. Screen reader naming

- Workplace run id exposed as text (“Run {id}”) — verbose but available.
- Empty states generally have readable sentences.
- Hidden content markers must remain absent from DOM (W7 leak tests) — keep during Lovable work.

## 5. Automated coverage gap

Axe suite currently covers **three** learning surfaces. Most workplace surfaces lack automated axe baselines in CI.
