-- PS-ROADMAP-023 — Per-projection processing targets for production relay.
--
-- Durable work units for registry-driven fan-out with independent retry /
-- exhaustion. Does not mutate authoritative SimulationRun state.
-- Rows are retained (no silent delete of exhausted work).

create table if not exists projection_processing_target (
  tenant_id                   text not null,
  event_id                    text not null,
  projection_type             text not null,
  simulation_run_id           text not null,
  event_type                  text not null,
  status                      text not null
    check (status in ('pending', 'claimed', 'succeeded', 'retrying', 'exhausted')),
  attempt_count               integer not null default 0
    check (attempt_count >= 0),
  next_attempt_at             timestamptz not null default now(),
  claimed_by                  text,
  claimed_at                  timestamptz,
  claim_expires_at            timestamptz,
  completed_at                timestamptz,
  exhausted_at                timestamptz,
  last_error_classification   text,
  last_error_summary          text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  primary key (tenant_id, event_id, projection_type)
);

create index if not exists projection_processing_target_claimable_idx
  on projection_processing_target (tenant_id, next_attempt_at, event_id, projection_type)
  where status in ('pending', 'retrying');

create index if not exists projection_processing_target_stale_claim_idx
  on projection_processing_target (tenant_id, claim_expires_at)
  where status = 'claimed';

create index if not exists projection_processing_target_exhausted_idx
  on projection_processing_target (tenant_id, exhausted_at desc)
  where status = 'exhausted';

create index if not exists projection_processing_target_run_type_idx
  on projection_processing_target (tenant_id, simulation_run_id, projection_type);

do $$
declare
  tbl text := 'projection_processing_target';
begin
  execute format('alter table %I enable row level security', tbl);
  execute format('alter table %I force row level security', tbl);
  execute format('drop policy if exists %I on %I', tbl || '_tenant_isolation', tbl);
  execute format(
    'create policy %I on %I for all using (tenant_id = app_current_tenant()) with check (tenant_id = app_current_tenant())',
    tbl || '_tenant_isolation', tbl
  );
end $$;

do $$
declare
  grantee text;
begin
  foreach grantee in array array['projectsim_app', 'authenticated']
  loop
    if exists (select 1 from pg_roles where rolname = grantee) then
      execute format(
        'grant select, insert, update, delete on projection_processing_target to %I',
        grantee
      );
    end if;
  end loop;
end $$;
