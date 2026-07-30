-- BC-003 — Business case content schema + SimulationRun experience level.
--
-- Additive only:
-- 1) content.* tables for immutable package versions, assets, validation,
--    and publication history (PS-DB-004 / BC-003).
-- 2) nullable experience_level on simulation_state for run pinning.
--
-- Content definitions are shared platform data (not tenant-owned rows).
-- Tenant isolation for learner catalog selection is enforced in Application.
-- Rollback: drop content schema objects and experience_level column
-- (existing SimulationRun rows remain valid with NULL experience_level).

-- ---------------------------------------------------------------------------
-- SimulationRun experience level (optional; legacy rows stay NULL)
-- ---------------------------------------------------------------------------
alter table simulation_state
  add column if not exists experience_level text;

alter table simulation_state
  drop constraint if exists simulation_state_experience_level_check;

alter table simulation_state
  add constraint simulation_state_experience_level_check
  check (
    experience_level is null
    or experience_level in ('explorer', 'practitioner', 'leader')
  );

-- ---------------------------------------------------------------------------
-- Content schema
-- ---------------------------------------------------------------------------
create schema if not exists content;

create table if not exists content.learning_programs (
  id text primary key,
  title text not null,
  summary text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists content.business_cases (
  id text primary key,
  learning_program_id text references content.learning_programs (id),
  title text not null,
  short_title text not null default '',
  summary text not null default '',
  industry text not null default '',
  organization_type text not null default '',
  project_type text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists content.content_packages (
  id text primary key,
  business_case_id text not null references content.business_cases (id),
  created_at timestamptz not null default now(),
  unique (business_case_id)
);

create table if not exists content.content_package_versions (
  id text primary key,
  content_package_id text not null references content.content_packages (id),
  business_case_id text not null references content.business_cases (id),
  version text not null,
  status text not null,
  availability text not null default 'available',
  is_default_for_new_runs boolean not null default false,
  schema_version integer not null,
  runtime_compatibility text not null,
  definition jsonb not null,
  checksum text not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (content_package_id, version),
  unique (business_case_id, version),
  check (
    status in (
      'draft',
      'validating',
      'validated',
      'in_review',
      'approved',
      'published',
      'retired'
    )
  ),
  check (
    availability in ('available', 'coming_soon', 'restricted', 'retired')
  )
);

create index if not exists content_package_versions_case_status_idx
  on content.content_package_versions (business_case_id, status, availability);

create table if not exists content.content_assets (
  id text primary key,
  business_case_id text not null references content.business_cases (id),
  content_package_version_id text references content.content_package_versions (id),
  kind text not null,
  uri text not null,
  checksum text not null,
  mime_type text not null default '',
  locale text,
  accessibility_label jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists content.content_validation_results (
  id text primary key,
  content_package_version_id text not null references content.content_package_versions (id),
  business_case_id text not null,
  content_version text not null,
  checksum text not null,
  status text not null check (status in ('passed', 'failed')),
  validator_version text not null,
  result jsonb not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists content_validation_results_version_idx
  on content.content_validation_results (content_package_version_id, created_at desc);

create table if not exists content.content_publications (
  id text primary key,
  content_package_version_id text not null references content.content_package_versions (id),
  business_case_id text not null,
  content_version text not null,
  checksum text not null,
  published_at timestamptz not null default now(),
  published_by text,
  notes text not null default ''
);

-- Published immutability trigger: refuse UPDATE of definition/checksum/version
-- once status = published (corrections require a new version row).
create or replace function content.prevent_published_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'published' then
    if new.definition is distinct from old.definition
       or new.checksum is distinct from old.checksum
       or new.version is distinct from old.version
       or new.business_case_id is distinct from old.business_case_id
       or new.content_package_id is distinct from old.content_package_id
       or new.schema_version is distinct from old.schema_version
       or new.runtime_compatibility is distinct from old.runtime_compatibility
    then
      raise exception 'CONTENT_PACKAGE_VERSION_IMMUTABLE: published content_package_versions cannot be mutated in place';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists content_package_versions_immutable_published
  on content.content_package_versions;

create trigger content_package_versions_immutable_published
  before update on content.content_package_versions
  for each row
  execute function content.prevent_published_mutation();

-- Content tables are platform-shared. Enable RLS with read-for-authenticated
-- tenants; writes remain service-role / migration controlled.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'learning_programs',
    'business_cases',
    'content_packages',
    'content_package_versions',
    'content_assets',
    'content_validation_results',
    'content_publications'
  ]
  loop
    execute format('alter table content.%I enable row level security', tbl);
    execute format('alter table content.%I force row level security', tbl);
    execute format('drop policy if exists %I on content.%I', tbl || '_read', tbl);
    execute format(
      'create policy %I on content.%I for select using (app_current_tenant() is not null)',
      tbl || '_read',
      tbl
    );
  end loop;
end;
$$;
