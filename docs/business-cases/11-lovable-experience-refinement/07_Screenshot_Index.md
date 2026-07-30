# BC-008 — Screenshot Index

**Capture stamp:** `2026-07-29T02-09-46-466Z`
**Tool:** `scripts/capture-baseline.mjs` (documentation tooling only)
**Fixture:** E2E decision-lifecycle scaffold run (authenticated)
**Manifest:** `screenshots/manifest-2026-07-29T02-09-46-466Z.json`

Do not overwrite prior captures; new runs use a new timestamp suffix.

## 1. Viewports

| Name | Approx size |
|---|---|
| phone | 390×664 CSS viewport (iPhone 13 device) |
| large-phone | 430×932 |
| tablet | iPad (gen 7) |
| laptop | 1280×800 |
| desktop | 1440×900 |
| wide-desktop | 1920×1080 |

## 2. Surface folders

| Folder | Contents |
|---|---|
| `shell/` | Home entry per viewport |
| `catalog/` | Catalog list per viewport |
| `mission-control/` | Mission Control per viewport |
| `inbox/` | Inbox per viewport |
| `meetings/` | Meetings per viewport |
| `stakeholders/` | Stakeholders per viewport |
| `documents/` | Documents per viewport |
| `activities/` | Activities per viewport |
| `decision/` | Decision Workspace per viewport |
| `performance/` | Performance per viewport |
| `progress/` | Learner Progression per viewport |
| `achievements/` | Achievements per viewport |
| `mastery/` | Mastery per viewport |
| `coaching/` | Coaching per viewport |
| `responsive/` | Mirrors for MC / Inbox / Decision / Documents across viewports |
| `auth/` | Unauthenticated catalog gate (desktop) |
| `states/` | Completed History, Notifications, Decision Log empties; expectVersion catch-up |

## 3. Naming convention

```text
{surface}-{viewport}-{stamp}.png
```

Example: `mission-control-desktop-2026-07-29T02-09-46-466Z.png`

## 4. Counts (this capture)

| Category | PNG count (approx) |
|---|---:|
| Primary surfaces × 6 viewports | 13 × 6 = 78 |
| Shell home × 6 | 6 |
| Responsive mirrors | 4 × 6 = 24 |
| Auth + states | 1 + 4 = 5 |
| **Total PNGs** | **113** (+ 1 manifest JSON) |

## 5. Capture limitations (honest)

- Scaffold decision-lifecycle fixture — not full Northstar six-chapter content density.
- Loading skeletons not separately staged (text loading is transient).
- Error-state injection limited to unauthenticated + expectVersion hold.
- Blocked/crisis/completed-run dedicated screenshots deferred until those states are stably seedable without product changes.
- Decision Workspace shows current unstyled `ps-*` baseline (intentional for Lovable comparison).

## 6. How to re-capture

1. Start API (`scripts/e2e/run-api.mjs` with Postgres + e2e seams) and web preview (`pnpm --filter @projectsim/web run build:e2e` then `preview` on :4173 with `VITE_ENABLE_E2E_AUTH_HOOK=1`).
2. From repo root: `node docs/business-cases/11-lovable-experience-refinement/scripts/capture-baseline.mjs`
3. Update this index with the new stamp; do not delete prior stamps.
