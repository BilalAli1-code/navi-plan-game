# Engineering Risks and ADR Backlog

**Document ID:** PS-ENG-017  
**Version:** 1.0  
**Status:** Approved

## Risks

| Risk | Mitigation |
|---|---|
| AI-generated code bypasses architecture | Mandatory review and contract-first prompts |
| Monorepo becomes tightly coupled | Dependency rules and package ownership |
| Tests focus only on UI | Domain and replay test requirements |
| Supabase types leak into domain | Separate DTO and repository contracts |
| Lovable overwrites newer code | GitHub source-of-truth workflow |
| PRs become too large | Small branches and scoped deliverables |
| Tech debt remains undocumented | Issue and ADR backlog |
| Release failures lack rollback | Release checklist and runbooks |
| Security checks are manual | CI scanning and RLS tests |
| Observability is added late | Definition of Done requirements |

## ADR Backlog

- ADR-ENG-001: pnpm Workspace
- ADR-ENG-002: Turborepo
- ADR-ENG-003: Strict TypeScript
- ADR-ENG-004: Vitest for Unit and Integration Tests
- ADR-ENG-005: Playwright for End-to-End Tests
- ADR-ENG-006: TanStack Query
- ADR-ENG-007: GitHub Flow
- ADR-ENG-008: Conventional Commit Style
- ADR-ENG-009: GitHub Actions CI/CD
- ADR-ENG-010: AI-Assisted Development Policy
- ADR-ENG-011: Storybook for UI Components
- ADR-ENG-012: Production Readiness Checklist

## Review Triggers

Review this handbook when engineering team size, deployment topology, compliance scope, or release frequency materially changes.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial engineering risks and ADR backlog |
