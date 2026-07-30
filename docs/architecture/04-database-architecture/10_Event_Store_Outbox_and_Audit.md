# Event Store, Outbox, and Audit

**Document ID:** PS-DB-010  
**Version:** 1.0  
**Status:** Approved

## Event Table

```sql
create table eventing.domain_events (
  event_id uuid primary key,
  event_type text not null,
  event_version integer not null,
  aggregate_id uuid not null,
  aggregate_type text not null,
  aggregate_version bigint not null,
  sequence_number bigint not null,
  tenant_id uuid,
  simulation_run_id uuid,
  actor_id uuid,
  correlation_id uuid not null,
  causation_id uuid,
  payload jsonb not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  unique (aggregate_id, aggregate_version)
);
```

## Outbox Table

```sql
create table eventing.outbox_messages (
  id uuid primary key,
  event_id uuid not null unique,
  topic text not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  available_at timestamptz not null default now(),
  published_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
```

## Audit

`audit.audit_log` records actor, tenant, action, resource, result, request metadata, correlation ID, and timestamp. Audit data is separate from domain events because the purposes differ.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial event, outbox, and audit model |
