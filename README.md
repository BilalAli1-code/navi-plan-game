# ProjectSim 2.0

ProjectSim 2.0 is an AI-powered project leadership simulation platform designed to help professionals build practical project management and leadership capability through realistic, scenario-based learning.

Built with an architecture-first approach, the platform prioritizes clear system boundaries, reusable domain components, and scalable delivery workflows from day one.

## Vision

ProjectSim 2.0 aims to become the leading simulation environment for project leadership development by:

- Delivering high-fidelity, AI-driven project scenarios that mirror real-world complexity.
- Enabling experiential learning for project managers, team leads, and PMP candidates.
- Supporting repeatable decision-making practice with structured feedback loops.
- Providing a foundation for long-term product evolution across web, simulation, and data services.

## Repository Structure

This repository follows a monorepo layout to keep product, simulation, and platform capabilities aligned:

```text
projectsim-2/
├── apps/
│   └── web/                     # Frontend application
├── packages/
│   ├── simulation-engine/       # Core simulation logic and orchestration
│   └── shared/                  # Shared types, utilities, and cross-cutting modules
├── supabase/
│   ├── migrations/              # Database schema migrations
│   ├── functions/               # Edge/serverless functions
│   └── seed/                    # Seed data
├── docs/
│   ├── architecture/            # Architecture artifacts
│   ├── adr/                     # Architecture Decision Records
│   ├── diagrams/                # System and flow diagrams
│   ├── handbook/                # Team and delivery documentation
│   ├── business-cases/          # Product/business context
│   └── assets/                  # Documentation assets
├── tests/                       # Cross-package and integration test assets
└── .github/workflows/           # CI/CD workflow definitions
```

## Development Workflow

ProjectSim 2.0 uses an architecture-first, iterative workflow:

1. **Define architecture intent** in `docs/architecture` and ADRs in `docs/adr`.
2. **Design bounded changes** across app, packages, and data layers before implementation.
3. **Implement incrementally** in the relevant monorepo package or app with shared contracts in `packages/shared`.
4. **Validate behavior** through tests and workflow automation.
5. **Document outcomes** in architecture notes, diagrams, and handbook content.

This workflow supports consistency, traceability, and safe evolution of platform capabilities.

## Current Workplace Surfaces

The run-scoped Workplace currently includes Mission Control, Inbox, Meetings,
Stakeholders, Documents, Notifications, Activities, Completed History, and
Decision Log. Activities are authoritative SimulationRun state
(`SimulationState.activities`, schema v8) exposed through active-only
`activities` and completed-only `completed_history` projections with read-only
`GET …/activities` and `GET …/completed-history`. Public Activity mutation,
workflow features, and relay-worker operations remain out of scope.

## Technology Stack

The platform is organized around the following stack domains:

- **Application Layer:** Web frontend in `apps/web`.
- **Domain & Simulation Layer:** Reusable simulation services in `packages/simulation-engine`.
- **Shared Platform Layer:** Shared contracts/utilities in `packages/shared`.
- **Data & Backend Services:** Supabase migrations, seed data, and edge functions in `supabase/*`.
- **Engineering Enablement:** Repository-level documentation in `docs/*`, automated checks in `.github/workflows`, and test assets in `tests/`.

As implementation expands, this architecture provides a scalable base for AI scenario generation, simulation orchestration, analytics, and learning feedback features.
