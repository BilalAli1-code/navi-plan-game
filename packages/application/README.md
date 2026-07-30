# @projectsim/application

Application / API coordination layer for ProjectSim 2.0.

Responsible for authentication context, authorization, input validation, and
command/query dispatch. It **coordinates** use cases but does not own business
rules — those live in `@projectsim/domain`.

Allowed dependency direction: `application → domain` (and, once implemented,
the simulation runtime). It must not import `@projectsim/ui`.

Reference: `docs/architecture/03-system-architecture/03_Monorepo_and_Package_Architecture.md`.

_Business logic is intentionally omitted from the initial scaffold._
