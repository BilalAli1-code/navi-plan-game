# Simulation Runtime Schema

**Document ID:** PS-DB-003  
**Version:** 1.0  
**Status:** Approved

## Core Tables

### `simulation.simulation_runs`

```sql
create table simulation.simulation_runs (
  id uuid primary key,
  tenant_id uuid not null,
  learner_id uuid not null,
  content_package_version_id uuid not null,
  status text not null,
  aggregate_version bigint not null default 0,
  last_processed_sequence bigint not null default 0,
  random_seed bigint not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### `simulation.simulation_actions`

```sql
create table simulation.simulation_actions (
  id uuid primary key,
  simulation_run_id uuid not null,
  sequence_number bigint not null,
  idempotency_key text not null,
  action_type text not null,
  action_version integer not null,
  actor_id uuid,
  payload jsonb not null,
  status text not null,
  rejection_code text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (simulation_run_id, sequence_number),
  unique (simulation_run_id, idempotency_key)
);
```

## Additional Tables

- `simulation.simulation_state_snapshots`
- `simulation.simulation_checkpoints`
- `simulation.scheduled_events`
- `simulation.chapter_progress`
- `simulation.day_progress`
- `simulation.activity_progress`
- `simulation.decisions`
- `simulation.decision_outcomes`
- `simulation.consequences`
- `simulation.project_metrics`
- `simulation.risks`
- `simulation.issues`

## Concurrency

Use optimistic concurrency with `aggregate_version`. Zero updated rows indicates a concurrency conflict.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial simulation runtime schema |
