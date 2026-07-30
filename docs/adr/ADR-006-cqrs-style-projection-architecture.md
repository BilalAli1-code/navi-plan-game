# ADR-006: CQRS-Style Projection Architecture

## Status

Accepted

## Context

Milestone 1 established a single authoritative runtime (`SimulationRun` /
`SimulationState`), a transactional outbox, and one learner-facing
`SimulationProjection` (`projectionType: "simulation"`, schema version 1)
consumed by the Decision vertical slice.

Milestone 2 requires a unified workplace with multiple related surfaces
(Mission Control, Inbox, Meetings, Stakeholders, Decision Log, Documents,
Notifications, Activities, and completed history). Blueprint documents already
list many named projections and per-surface query APIs, while the executable
system today has:

- one projection type
- one public projection GET route
- one Decision UI consumer
- a PostgreSQL `simulation_projection` table already keyed by
  `(tenant_id, simulation_run_id, projection_type)`

We must choose a topology that preserves one authoritative write model, reuses
existing rebuild / inbox / freshness / hashing semantics, and allows workplace
surfaces to converge without forcing unrelated contracts to version together.

## Decision

Adopt **hybrid topology A3**:

1. Retain a **shared projection envelope** with common identity, tenancy,
   SimulationRun scoping, source cursors, semantic hash, generatedAt, and
   schema-version fields.
2. Discriminate stored rows with a stable **`projectionType`**.
3. Define **typed learner-facing payloads** per workplace concern.
4. Persist workplace projection types using the **existing projection table
   family** (`simulation_projection` and `projection_event_inbox`), without
   inventing a second authoritative store.
5. Reuse **saveIfNewer**, event-ID inbox dedupe, synchronous get-query rebuild,
   and freshness semantics established in PS-ROADMAP-006/007/008.
6. Allow **independent payload schema versions per projectionType** where
   justified; do not force all workplace surfaces onto one giant payload.

The existing flat `SimulationProjection` remains the first concrete type and is
treated as envelope-compatible: its root blocks (`run`, `project`,
`availableDecisions`, `decisionHistory`) are the typed payload for
`projectionType: "simulation"`.

## Alternatives Considered

### A1 — Expand SimulationProjection into one large multi-section payload

Rejected as the long-term topology. It couples unrelated workplace surfaces into
a single schema version and forces consumers to load or version fields they do
not need. Acceptable only as a temporary local nesting inside a single type,
not as the workplace-wide model.

### A2 — Fully independent projection lifecycles per surface

Rejected. Independent metadata, freshness, hashing, and rebuild rules would
recreate consistency semantics per surface and risk divergent “truth” across
tabs. Workplace DoD requires shared convergence after one action.

### A3 — Shared envelope + typed payloads (selected)

Selected. Matches the existing table primary key, preserves CQRS rules already
enforced in code and `AGENTS.md`, and lets later slices add projection types
incrementally.

## Consequences

### Positive

- One authoritative write model remains SimulationRun / SimulationState.
- Cross-surface convergence can share source cursors and rebuild triggers.
- Payload schema versions can evolve independently per `projectionType`.
- No production migration is required for PS-ROADMAP-009 itself.
- Later workplace APIs can expose typed payloads under common meta rules.

### Negative / trade-offs

- Consumers must understand that multiple projection rows may exist per run.
- Rebuild fan-out rules must be explicit so one Domain event can refresh every
  affected `projectionType`.
- Blueprint docs that assume separate `projection.*` tables or immediately
  available per-surface public APIs remain aspirational until later slices;
  this ADR does not silently rewrite those blueprints.

### Non-consequences (explicitly out of scope for this ADR)

- No Inbox/Meetings/Mission Control product implementation *in this ADR*
- No new public workplace API routes *in this decision record*
- No new UI surfaces *in this ADR*
- No change to Decision lifecycle behavior
- No second authoritative runtime model

### Implementation status (non-normative)

- **PS-ROADMAP-010** delivered shared registry, type-keyed persistence, and
  fan-out seams.
- **PS-ROADMAP-011** delivered the first additional feature type
  (`mission_control` schema v1) on shared infrastructure, with an explicit
  learner-facing GET route (not a generic projection selector). See
  `docs/architecture/08-workplace-projection-contracts/02_Mission_Control_Vertical_Slice.md`.
- **PS-ROADMAP-012** delivered `decision_log` schema v1 on the same shared
  registry, fan-out, and `saveIfNewer` persistence, with an explicit
  learner-facing GET route. See
  `docs/architecture/08-workplace-projection-contracts/03_Decision_Log_Vertical_Slice.md`.
- **PS-ROADMAP-013** delivered a frontend-only Unified Workplace Shell that
  composes Mission Control and Decision Log without a new projection, API, or
  persistence model. See
  `docs/architecture/08-workplace-projection-contracts/04_Unified_Workplace_Shell.md`.
- An authoritative learner-message occurrence lifecycle exists on
  SimulationState (schema v3). See
  `docs/architecture/02-domain-model/17_Authoritative_Learner_Message_Lifecycle.md`.
- **PS-ROADMAP-014** delivered `inbox` schema v1 on the shared registry /
  fan-out / `saveIfNewer` path, with an explicit learner-facing GET route and
  WorkplaceShell navigation. Inbox remains a derived projection of
  `learnerMessages` (not a second write model). See
  `docs/architecture/08-workplace-projection-contracts/05_Inbox_Vertical_Slice.md`.
- This note does not change the accepted A3 decision.

## Migration Plan

1. **PS-ROADMAP-009 (this milestone):** document contracts, taxonomy, and rules;
   accept this ADR; add durable agent guidance. No production code or migration.
2. **Later M2 slices:** implement builders/repositories/APIs/UI per surface
   against these contracts; introduce new `projectionType` values as needed;
   add migrations only if storage shape must change beyond the existing table
   family.
3. **Compatibility:** keep `projectionType: "simulation"` schema version 1
   stable for Decision consumers while new types are added.

## References

- `docs/architecture/08-workplace-projection-contracts/00_Unified_Workplace_Projection_Contracts.md`
- `docs/architecture/03-system-architecture/08_Projection_and_CQRS_Architecture.md`
- `docs/architecture/02-domain-model/07_Projection_Aggregate.md`
- `docs/architecture/05-api-architecture/08_Projection_and_Query_API.md`
- `docs/architecture/07-ui-architecture/05_Workplace_Experience_Architecture.md`
- `docs/01-projectsim-2.0-implementation-roadmap.md` (Milestone 2)
- Executable baseline: `packages/domain/src/projection/*`,
  `packages/application/src/simulation/projection/*`,
  `supabase/migrations/20260725040000_ps_roadmap_006_simulation_projection.sql`
