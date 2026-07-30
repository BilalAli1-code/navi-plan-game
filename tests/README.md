# @projectsim/integration-tests

Cross-package integration tests for the ProjectSim 2.0 monorepo
(`docs/handbook/02_Repository_and_Workspace_Standards.md`).

Tests here exercise interactions **between** workspace packages. Package-scoped
unit tests live inside each package; database/RLS tests live in `supabase/tests/`;
end-to-end journeys live in `apps/web/e2e/`.

Run via the workspace: `pnpm test` (Turborepo builds dependencies first).
