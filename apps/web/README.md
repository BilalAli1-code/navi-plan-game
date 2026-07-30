# @projectsim/web

The ProjectSim 2.0 web application (React + Vite + TypeScript).

## Scripts

| Command          | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `pnpm dev`       | Start the Vite dev server (default port 5173).             |
| `pnpm build`     | Production build to `dist/`.                               |
| `pnpm preview`   | Serve the production build locally.                        |
| `pnpm lint`      | Lint with the shared ESLint preset.                        |
| `pnpm typecheck` | Type-check with strict TypeScript settings.                |
| `pnpm test`      | Run Vitest unit/component tests (jsdom).                   |
| `pnpm test:e2e`  | Run Playwright end-to-end tests against the preview build. |

The UI is presentational only: it never reads raw authoritative tables and
never computes completion, metrics, mastery, or stakeholder truth
(`docs/architecture/07-ui-architecture/`).
