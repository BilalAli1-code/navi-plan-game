# Architecture Risks and ADR Backlog

**Document ID:** PS-ARCH-015  
**Version:** 1.0  
**Status:** Approved

## Risks

| Risk | Mitigation |
|---|---|
| Runtime becomes a god object | Separate Runtime orchestration from Core Simulation |
| Shared package grows uncontrolled | Enforce Shared Kernel policy |
| UI recreates business logic | Require projection contracts |
| Eventual consistency confuses users | Return state versions and projection freshness |
| AI bypasses validation | Use typed commands and output schemas |
| Content becomes executable code | Keep content declarative and validated |
| Supabase coupling leaks into domain | Use repository interfaces |
| Multi-tenancy errors | Enforce tenant IDs and RLS |
| Replay diverges | Add state hashes and replay tests |
| Projection drift | Rebuild and compare projections in tests |

## ADR Backlog

- ADR-001: Single Simulation Runtime
- ADR-002: Runtime and Core Simulation Separation
- ADR-003: Monorepo with pnpm and Turborepo
- ADR-004: Supabase as MVP Backend
- ADR-005: Transactional Outbox
- ADR-006: CQRS-Style Projection Architecture — **Accepted** (`docs/adr/ADR-006-cqrs-style-projection-architecture.md`, PS-ROADMAP-009)
- ADR-007: AI Non-Authoritative Boundary
- ADR-008: Content Package Immutability
- ADR-009: Optimistic Concurrency
- ADR-010: Capability-Based Authorization
- ADR-011: Vercel and Supabase Deployment
- ADR-012: Mermaid for Architecture Diagrams

## Review Cadence

Review foundational decisions before implementation, package boundaries before extraction, operational architecture before production launch, and risks at every milestone.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial risk register and ADR backlog |
