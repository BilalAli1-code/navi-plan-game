# @projectsim/ui

Shared design-system package for ProjectSim 2.0.

Houses presentational, reusable UI primitives and components consumed by
`apps/web`. Components must remain presentational: the UI never reads raw
authoritative tables and never calculates completion, metrics, mastery, or
stakeholder truth.

The `tsconfig.json` is preconfigured for `react-jsx`; React will be added as a
dependency when the first components are implemented.

Reference: `docs/architecture/07-ui-architecture/`.

_Components and business logic are intentionally omitted from the initial scaffold._
