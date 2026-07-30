# @projectsim/domain

Framework-independent domain layer for ProjectSim 2.0.

Holds bounded-context models, business rules, invariants, and repository
**interfaces**. Per the architecture:

- Must not perform database or network calls, and must not contain UI concerns.
- Must not import `@projectsim/infrastructure` or `@projectsim/ui`.
- Must not import Supabase-generated database types.

References: `docs/handbook/05_Domain_and_Application_Coding_Standards.md`,
`docs/architecture/03-system-architecture/03_Monorepo_and_Package_Architecture.md`.

_Business logic is intentionally omitted from the initial scaffold._
