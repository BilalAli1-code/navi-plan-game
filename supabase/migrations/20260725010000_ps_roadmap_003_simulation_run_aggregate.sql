-- PS-ROADMAP-003 — Evolve simulation_state into the SimulationRun aggregate snapshot.
--
-- Forward-only expand of the existing authoritative table (no second state table).
-- Legacy rows keep tenant_id / simulation_run_id / aggregate_version /
-- last_sequence_number. Ownership columns stay NULL when unknown — application
-- rehydration fails closed rather than inventing learner/content identities.
--
-- Architecture note: approved PS-DB-003 describes simulation.simulation_runs with
-- UUID columns; this repo already ships public.simulation_state (text IDs). We
-- evolve the live table in place to avoid a second source of truth.

alter table simulation_state
  add column if not exists learner_id text,
  add column if not exists business_case_id text,
  add column if not exists content_package_version_id text,
  add column if not exists runtime_version text,
  add column if not exists status text,
  add column if not exists current_chapter_id text,
  add column if not exists current_day_id text,
  add column if not exists started_at timestamptz,
  add column if not exists paused_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists created_at timestamptz,
  add column if not exists authoritative_state jsonb,
  add column if not exists state_schema_version integer;

-- Rename sequence column conceptually: keep physical name for compatibility,
-- expose as last_processed_sequence in the domain mapper.

-- Backfill status / timestamps / empty state for legacy rows that only had
-- version+sequence. Ownership stays NULL (operator must backfill before load).
update simulation_state
   set status = case
                  when last_sequence_number > 0 then 'active'
                  else 'created'
                end,
       runtime_version = coalesce(runtime_version, ''),
       created_at = coalesce(created_at, updated_at, now()),
       started_at = case
                      when last_sequence_number > 0 then coalesce(started_at, updated_at, now())
                      else started_at
                    end,
       authoritative_state = coalesce(
         authoritative_state,
         jsonb_build_object(
           'schemaVersion', 1,
           'projectMetrics', '{}'::jsonb,
           'chapterProgress', '[]'::jsonb,
           'dayProgress', '[]'::jsonb,
           'activityProgress', '[]'::jsonb,
           'decisions', '[]'::jsonb,
           'consequences', '[]'::jsonb
         )
       ),
       state_schema_version = coalesce(state_schema_version, 1)
 where status is null
    or authoritative_state is null
    or created_at is null
    or state_schema_version is null;

-- New writes must supply lifecycle fields. Legacy incomplete rows remain until
-- operator backfill; CHECK applies only when status is present.
alter table simulation_state
  drop constraint if exists simulation_state_status_check;

alter table simulation_state
  add constraint simulation_state_status_check
  check (
    status is null
    or status in (
      'created',
      'active',
      'paused',
      'completed',
      'cancelled',
      'failed',
      'archived'
    )
  );

create index if not exists simulation_state_tenant_learner_idx
  on simulation_state (tenant_id, learner_id);

create index if not exists simulation_state_tenant_status_idx
  on simulation_state (tenant_id, status);
