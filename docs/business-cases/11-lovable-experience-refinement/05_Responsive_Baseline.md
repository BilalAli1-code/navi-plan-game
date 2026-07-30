# BC-008 — Responsive Baseline

## 1. Breakpoints in code

| Breakpoint | Usage |
|---|---|
| `max-width: 719px` / `matchMedia("(max-width: 719px)")` | WorkplaceShell narrow mode + hamburger |
| `min-width: 720px` | Padding/grid tweaks on MC, Catalog, Documents, Stakeholders, Decision Log, Case Details |
| `prefers-reduced-motion: reduce` | Several feature CSS files |

**Not implemented:** dedicated tablet layout, bottom nav, drawer panels, multi-column Mission Control dashboard.

## 2. Target viewports for baseline captures

| Label | Width × Height | Intent |
|---|---|---|
| Phone | 390 × 844 | iPhone-class |
| Large Phone | 430 × 932 | Large phone |
| Tablet | 768 × 1024 | iPad portrait |
| Laptop | 1280 × 800 | Common laptop |
| Desktop | 1440 × 900 | Desktop |
| Wide Desktop | 1920 × 1080 | Wide |

## 3. Per-surface responsive observations (code + e2e review)

| Surface | Overflow / crowding risks | Tap targets | Hidden controls | Notes |
|---|---|---|---|---|
| Shell nav | 14 links crowd at laptop; wraps/overflow risk before 719px switch | min-height 44px on links | Menu collapsed when narrow | Toggle required ≤719px |
| Mission Control | Dense dl/lists; vertical scroll long | Buttons ≥44px | None known | Single column |
| Inbox | Message bodies expand long | Expand controls OK | — | `inbox.responsive.spec.ts` |
| Documents | Master–detail stacks poorly on phone | List buttons OK | Detail may push list | Likely full-width stack |
| Stakeholders | Same as Documents | OK | Conversation pane | Phone crowding |
| Decision Workspace | Unstyled; unpredictable wrap | Radios/buttons depend on browser CSS | Shell nav absent | High risk |
| Catalog | Card list OK | CTA OK | — | 720px padding |
| Learning pages | Single column OK | OK | — | Blue accent pages |

## 4. Known responsive inconsistencies (no fixes)

1. Shell breakpoint is binary (719/720) — no tablet-optimized nav.
2. Dual accent colors persist across widths.
3. Dark body + light page overrides create different mobile “chrome” perception.
4. Decision route loses shell entirely at all widths.
5. Horizontal nav item count exceeds comfortable laptop width before hamburger engages.

## 5. Screenshot folders

See `screenshots/responsive/` and `07_Screenshot_Index.md`.
