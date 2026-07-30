-- PS-004B — Supabase/PostgreSQL persistence for simulation command processing.
--
-- Creates the durable tables backing the application ports (aggregate state +
-- optimistic concurrency, idempotency receipts with retention, and a
-- transactional-outbox event table) and enforces tenant isolation via
-- Row-Level Security. Tenant is resolved from the request JWT claims GUC, the
-- Supabase convention (`request.jwt.claims`), so the same policies work locally
-- and on Supabase.
--
-- No domain/application contract is expressed here; this is infrastructure only.

-- Resolve the current tenant from the JWT claims GUC. Returns NULL when unset,
-- which makes every RLS policy deny by default (fail-closed).
create or replace function app_current_tenant() returns text
  language sql
  stable
as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'tenant_id';
$$;

-- Authoritative per-run aggregate state (version + last action sequence).
-- Primary key is composite so tenants can safely share opaque run-id spaces
-- without colliding under RLS (a tenant cannot see another tenant's row, so a
-- single-column PK would race on insert across tenants).
create table if not exists simulation_state (
  tenant_id            text not null,
  simulation_run_id    text not null,
  aggregate_version    integer not null check (aggregate_version >= 0),
  last_sequence_number integer not null check (last_sequence_number >= 0),
  updated_at           timestamptz not null default now(),
  primary key (tenant_id, simulation_run_id)
);

-- Durable command receipts for idempotent retries, with a retention horizon.
-- Composite PK (tenant_id, command_id) mirrors tenant-scoped command identity.
create table if not exists idempotency_receipts (
  tenant_id   text not null,
  command_id  text not null,
  result      jsonb not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  primary key (tenant_id, command_id)
);
create index if not exists idempotency_receipts_expires_at_idx
  on idempotency_receipts (expires_at);

-- Transactional outbox: durable event storage. `published_at IS NULL` marks a
-- pending event awaiting relay (relay/worker intentionally out of scope here).
create table if not exists event_outbox (
  id                bigint generated always as identity primary key,
  event_id          text not null unique,
  tenant_id         text not null,
  event_type        text not null,
  aggregate_id      text not null,
  aggregate_type    text not null,
  aggregate_version integer not null,
  sequence_number   integer not null,
  simulation_run_id text,
  payload           jsonb not null,
  occurred_at       timestamptz not null,
  recorded_at       timestamptz not null,
  published_at      timestamptz
);
create index if not exists event_outbox_pending_idx
  on event_outbox (id) where published_at is null;

-- --- Row-Level Security (tenant isolation) ---
-- FORCE so even the table owner is subject to policies; fail-closed by default.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['simulation_state', 'idempotency_receipts', 'event_outbox']
  loop
    execute format('alter table %I enable row level security', tbl);
    execute format('alter table %I force row level security', tbl);
    execute format('drop policy if exists %I on %I', tbl || '_tenant_isolation', tbl);
    execute format(
      'create policy %I on %I for all using (tenant_id = app_current_tenant()) with check (tenant_id = app_current_tenant())',
      tbl || '_tenant_isolation', tbl
    );
  end loop;
end $$;

-- --- Grants (portable: applies to whichever app roles exist) ---
do $$
declare
  grantee text;
begin
  foreach grantee in array array['projectsim_app', 'authenticated']
  loop
    if exists (select 1 from pg_roles where rolname = grantee) then
      execute format('grant usage on schema public to %I', grantee);
      execute format('grant select, insert, update, delete on simulation_state, idempotency_receipts, event_outbox to %I', grantee);
      execute format('grant usage, select on all sequences in schema public to %I', grantee);
      execute format('grant execute on function app_current_tenant() to %I', grantee);
    end if;
  end loop;
end $$;
