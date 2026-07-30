# ProjectSim 2.0 — Master Deliverables Index

This file is the navigation page for the eight ProjectSim 2.0 blueprint deliverables and the active delivery roadmaps. The full content remains in the linked folders and canonical roadmap documents.

## Blueprint deliverables

| # | Deliverable | Repository location | Start here | Status |
|---|---|---|---|---|
| 1 | Product Strategy and Scope | `docs/business-cases/01-product-strategy-and-scope/` | [Product documentation](business-cases/01-product-strategy-and-scope/README.md) | Mapped |
| 2 | Domain Model | `docs/architecture/02-domain-model/` | [Domain model index](architecture/02-domain-model/README.md) | Mapped |
| 3 | System Architecture | `docs/architecture/03-system-architecture/` | [System architecture index](architecture/03-system-architecture/README.md) | Mapped |
| 4 | Database Architecture | `docs/architecture/04-database-architecture/` | [Database architecture index](architecture/04-database-architecture/README.md) | Mapped |
| 5 | API Architecture | `docs/architecture/05-api-architecture/` | [API architecture index](architecture/05-api-architecture/README.md) | Mapped |
| 6 | AI Architecture | `docs/architecture/06-ai-architecture/` | [AI architecture folder](architecture/06-ai-architecture/README.md) | Package needed |
| 7 | UI Architecture | `docs/architecture/07-ui-architecture/` | [UI architecture index](architecture/07-ui-architecture/README.md) | Mapped |
| 8 | Engineering Handbook | `docs/handbook/08-engineering-handbook/` | [Engineering handbook index](handbook/08-engineering-handbook/README.md) | Mapped |

## Canonical roadmaps

| Sequence | Roadmap | Canonical document | Status |
|---|---|---|---|
| PS-001 through PS-024 | Platform implementation | [ProjectSim 2.0 Implementation Roadmap](01-projectsim-2.0-implementation-roadmap.md) | Platform sequence complete |
| BC-001 through BC-008, REL-001, PILOT-001, PILOT-002, REL-002 | Business case, pilot, and release | [Business Case and Release Roadmap](02-business-case-and-release-roadmap.md) | Active — BC-001 next |

The work after PS-024 begins at **BC-001**. It must not be numbered PS-025 unless the Business Case and Release Roadmap is formally revised.

## Existing supporting folders

- `docs/adr/` — Architecture Decision Records (includes accepted ADR-006).
- `docs/architecture/08-workplace-projection-contracts/` — PS-ROADMAP-009 unified workplace projection contracts.
- `docs/diagrams/` — Shared architecture and workflow diagrams.
- `docs/assets/` — Images and other documentation assets.
- `docs/business-cases/` — Product and case-specific business context.
- `docs/handbook/` — Engineering, documentation, and delivery standards.

## Repository implementation areas

- `apps/web/` — Lovable-generated and developer-reviewed web UI.
- `packages/simulation-engine/` — Authoritative simulation logic.
- `packages/shared/` — Shared contracts, types, and utilities.
- `supabase/` — Database migrations, functions, and seed data.
- `tests/` — Cross-package and integration tests.