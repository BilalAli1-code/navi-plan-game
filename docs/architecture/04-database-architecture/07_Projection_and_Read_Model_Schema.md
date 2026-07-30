# Projection and Read Model Schema

**Document ID:** PS-DB-007  
**Version:** 1.0  
**Status:** Approved

## Core Tables

- `projection.mission_control`
- `projection.program_dashboard`
- `projection.daily_briefing`
- `projection.inbox`
- `projection.meeting_center`
- `projection.stakeholder_view`
- `projection.learning_view`
- `projection.completion_readiness`
- `projection.timeline`
- `projection.executive_summary`

## Generic Projection Shape

```sql
create table projection.projection_snapshots (
  projection_type text not null,
  projection_key text not null,
  tenant_id uuid not null,
  simulation_run_id uuid,
  source_version bigint not null,
  projection_version bigint not null,
  payload jsonb not null,
  built_at timestamptz not null default now(),
  primary key (projection_type, projection_key)
);
```

## Rules

1. Projections are rebuildable.
2. Projection rows identify source versions.
3. Projection tables are never mutation targets for commands.
4. Projection rebuilds are idempotent.
5. Client access uses projection-specific views or APIs.

## Implementation status note

Executable storage today uses `public.simulation_projection` keyed by
`(tenant_id, simulation_run_id, projection_type)` plus
`projection_event_inbox` (PS-ROADMAP-006). Separate `projection.*` tables listed
above remain blueprint aspirational. PS-ROADMAP-009 / ADR-006 prefer the existing
table family for new workplace `projectionType` values unless a later ADR adopts
physical schema changes.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial projection schema |
| 1.1 | Approved | Note executable table family and PS-ROADMAP-009 direction |
