# Repository and Workspace Standards

**Document ID:** PS-ENG-002  
**Version:** 1.0  
**Status:** Approved

## Monorepo

ProjectSim uses a pnpm workspace and Turborepo.

## Structure

```text
apps/
packages/
supabase/
tests/
docs/
.github/
```

## Rules

1. Applications live in `apps/`.
2. Shared business capabilities live in `packages/`.
3. Supabase migrations and functions live in `supabase/`.
4. Cross-package integration tests live in `tests/`.
5. Documentation lives in `docs/`.
6. Generated files are clearly identified.
7. Package boundaries match architecture boundaries.
8. Circular dependencies are prohibited.
9. Every package has a clear owner and purpose.
10. Root scripts orchestrate package scripts.

## Package Requirements

Each package should include:

- `package.json`
- `tsconfig.json`
- `src/`
- `README.md`
- Tests
- Explicit exports
- Ownership metadata where supported

## Environment Files

```text
.env.example
.env.local
.env.test
```

Secrets must never be committed.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial repository standards |
