-- PS-ROADMAP-003 follow-up: legacy ownership visibility and placeholder cleanup.
--
-- 1) Undo empty-string runtime_version placeholders from the prior expand migration
--    (never fabricate ownership/runtime identities).
-- 2) Expose incomplete rows for operators via a diagnostic view.
--
-- Detection query (equivalent to the view):
--   select * from simulation_state_incomplete_ownership;
--
-- Operator repair (example — supply real identifiers; do not invent):
--   update simulation_state
--      set learner_id = '<learner>',
--          business_case_id = '<case>',
--          content_package_version_id = '<cpv>',
--          runtime_version = '<runtime>'
--    where tenant_id = '<tenant>'
--      and simulation_run_id = '<run>';

update simulation_state
   set runtime_version = null
 where runtime_version = '';

create or replace view simulation_state_incomplete_ownership as
select
  tenant_id,
  simulation_run_id,
  status,
  aggregate_version,
  last_sequence_number,
  learner_id,
  business_case_id,
  content_package_version_id,
  runtime_version,
  created_at,
  updated_at
from simulation_state
where learner_id is null
   or business_case_id is null
   or content_package_version_id is null
   or runtime_version is null
   or btrim(runtime_version) = ''
   or status is null
   or authoritative_state is null;

comment on view simulation_state_incomplete_ownership is
  'PS-ROADMAP-003: rows that cannot be rehydrated as SimulationRun until ownership/runtime fields are operator-backfilled. Never fabricate identifiers.';

-- Operator/app visibility: SELECT only. Underlying simulation_state RLS still applies.
do $$
declare
  grantee text;
begin
  foreach grantee in array array['projectsim_app', 'authenticated']
  loop
    if exists (select 1 from pg_roles where rolname = grantee) then
      execute format(
        'grant select on simulation_state_incomplete_ownership to %I',
        grantee
      );
    end if;
  end loop;
end $$;
