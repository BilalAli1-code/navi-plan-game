# BC-008 — Component Inventory

## 1. Shared package (`@projectsim/ui`)

| Component | Path | Role | Duplicate elsewhere? |
|---|---|---|---|
| `DecisionWorkspace` | `packages/ui/src/decision/DecisionWorkspace.tsx` | Full decision flow | Web Decision Log is separate |
| `ProjectionFreshnessBanner` | `…/ProjectionFreshnessBanner.tsx` | Stale/rebuild banner | **Yes** — 15 workplace pages reimplement stale copy |
| `DecisionOptionGroup` | `…/DecisionOptionGroup.tsx` | Radio options | No |
| `DecisionHistoryList` | `…/DecisionHistoryList.tsx` | History list | Decision Log page separate layout |
| Types | `…/types.ts` | View models | Mirrored in web hooks |

**Note:** `ps-*` class names lack a stylesheet in `apps/web`.

## 2. Web feature pages (page-level “components”)

Each surface is a self-contained page module:

`apps/web/src/features/{surface}/*Page.tsx` + `*Page.css` + `use*Projection.ts` + `queryKeys.ts`

Surfaces: mission-control, inbox, meetings, stakeholders, documents, notifications, activities, completed-history, decision-log, performance, learner-progression, achievements, mastery, coaching, catalog, decision.

Shell: `WorkplaceShell.tsx` / `.css`
Auth: `auth/session.tsx`, `auth/supabase.ts`
API: `api/client.ts`

## 3. Design primitives (current — not a design system)

| Primitive | Implementation | Consistency |
|---|---|---|
| Typography | Browser defaults + per-page CSS | Weak hierarchy; no type scale tokens |
| Font sizes | Ad hoc rem/px per page | Inconsistent |
| Heading hierarchy | H1 page titles; some H2 sections | Mostly present; some unlabeled |
| Spacing | Per-page padding/margins | Repeated but not shared |
| Grid | Limited; some 720px media tweaks | Mostly single column |
| Cards | Ad hoc (`catalog-card`, bordered sections) | No shared Card |
| Tables | Rare / dl lists on MC | — |
| Lists | `<ul>` / button lists | Repeated patterns |
| Buttons | Per-page `button` styles, min-height 44px common | Teal vs blue borders |
| Badges / chips | `catalog-chip`; status text | Sparse |
| Status indicators | Text (“Current”, “Unavailable”, freshness) | Duplicated |
| Forms | Decision rationale textarea (ui pkg); catalog create | Limited |
| Dialogs / drawers | **None** | — |
| Panels | Master–detail on Documents / Stakeholders | Local only |
| Tabs | **None** | — |
| Icons | **None** (text-only UI) | — |
| Colors | Hard-coded hex | Dual accents + dark/light conflict |
| Alerts | `role="alert"` paragraphs | Consistent pattern, inconsistent chrome |
| Notifications | Notifications **page** (not toast system) | — |
| Progress indicators | Text loading lines | No skeletons |
| Skeletons | **None** | — |
| Loading animations | Minimal / none | Reduced-motion media queries present in some CSS |
| Tooltips | **None** | — |
| Focus indicators | Browser default + shell content focus | No shared focus ring token |

## 4. Duplicate / near-duplicate patterns (do not consolidate in baseline)

| Pattern | Copies | Notes |
|---|---|---|
| Auth gate block | ~17 pages | Slight variations on Achievements/Mastery/Coaching |
| Loading status | ~15 pages | Same aria pattern |
| Error + Retry | ~15 pages | Same structure |
| Stale / rebuild_failed copy | ~15 pages | Should eventually reuse `ProjectionFreshnessBanner` (future) |
| Eyebrow + header CSS | ~15 `*Page.css` files | Copy-pasted |
| `expectVersion` polling | Most workplace hooks | Shared idea, local code |
| Route builders | `routes.ts` + e2e helpers | Test mirror |

## 5. Approved design-system gap

`docs/architecture/07-ui-architecture/09_Design_System.md` defines semantic tokens and component families that are **not implemented** in code. Baseline treats this as documentation debt, not a defect to fix in this PR.
