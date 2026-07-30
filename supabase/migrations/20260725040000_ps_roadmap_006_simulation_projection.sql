-- PS-ROADMAP-006 — Derived Simulation Projection cache.
--
-- Explicitly non-authoritative. Deleting rows does not affect SimulationRun.
-- Domain command processing must never read this table.

create table if not exists simulation_projection (
  tenant_id                 text not null,
  simulation_run_id         text not null,
  projection_type           text not null default 'simulation',
  projection_schema_version integer not null check (projection_schema_version > 0),
  source_aggregate_version  integer not null check (source_aggregate_version >= 0),
  source_state_version      integer not null check (source_state_version >= 0),
  source_action_sequence    integer not null check (source_action_sequence >= 0),
  source_event_id           text,
  content_package_version_id text not null,
  projection_payload        jsonb not null,
  projection_hash           text not null,
  generated_at              timestamptz not null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  primary key (tenant_id, simulation_run_id, projection_type)
);

create index if not exists simulation_projection_tenant_run_idx
  on simulation_projection (tenant_id, simulation_run_id);

-- Event-ID inbox for projection consumer deduplication (sequenceNumber is not unique).
create table if not exists projection_event_inbox (
  tenant_id    text not null,
  event_id     text not null,
  processed_at timestamptz not null default now(),
  primary key (tenant_id, event_id)
);

do $$
declare
  tbl text;
begin
  foreach tbl in array array['simulation_projection', 'projection_event_inbox']
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

do $$
declare
  grantee text;
begin
  foreach grantee in array array['projectsim_app', 'authenticated']
  loop
    if exists (select 1 from pg_roles where rolname = grantee) then
      execute format(
        'grant select, insert, update, delete on simulation_projection, projection_event_inbox to %I',
        grantee
      );
    end if;
  end loop;
end $$;
