# Indexing and Query Strategy

**Document ID:** PS-DB-011  
**Version:** 1.0  
**Status:** Approved

## Principles

1. Index foreign keys used in joins.
2. Index tenant-scoped access paths.
3. Index worker status and scheduling columns.
4. Use partial indexes for active or pending records.
5. Use GIN indexes selectively for JSONB search.
6. Avoid redundant indexes.
7. Validate with real query plans.

## Recommended Indexes

```sql
create index on simulation.simulation_runs (tenant_id, learner_id, status);
create index on simulation.simulation_actions (simulation_run_id, sequence_number);
create index on eventing.domain_events (aggregate_id, aggregate_version);
create index on eventing.domain_events (simulation_run_id, sequence_number);
create index on eventing.outbox_messages (available_at) where status = 'pending';
create index on projection.projection_snapshots (tenant_id, simulation_run_id, projection_type);
```

## Query Rules

- UI queries projections, not normalized write tables.
- Runtime queries by primary key and version.
- Workers use bounded batches.
- Large analytics queries use dedicated tables or materialized views.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial indexing strategy |
