-- PS-004C — Outbox relay enrichment + tenant memberships for production authorization.
--
-- Aligns the outbox closer to docs/architecture/04-database-architecture/
-- 10_Event_Store_Outbox_and_Audit.md (status, attempt_count, available_at,
-- last_error) and introduces a membership table used by the capability-based
-- authorizer. Tenant isolation remains RLS-enforced via app_current_tenant().

-- --- Outbox relay columns (additive; safe for expand-and-contract) ---
alter table event_outbox
  add column if not exists status text not null default 'pending',
  add column if not exists attempt_count integer not null default 0,
  add column if not exists available_at timestamptz not null default now(),
  add column if not exists last_error text;

-- Backfill status from published_at for any rows written by PS-004B.
update event_outbox
   set status = 'published'
 where published_at is not null
   and status = 'pending';

create index if not exists event_outbox_relay_claim_idx
  on event_outbox (available_at, id)
  where status = 'pending';

-- --- Tenant memberships (capability-based authorization) ---
create table if not exists tenant_memberships (
  tenant_id    text not null,
  actor_id     text not null,
  roles        text[] not null default '{}',
  capabilities text[] not null default '{}',
  created_at   timestamptz not null default now(),
  primary key (tenant_id, actor_id)
);

alter table tenant_memberships enable row level security;
alter table tenant_memberships force row level security;

drop policy if exists tenant_memberships_tenant_isolation on tenant_memberships;
create policy tenant_memberships_tenant_isolation on tenant_memberships
  for all
  using (tenant_id = app_current_tenant())
  with check (tenant_id = app_current_tenant());

do $$
declare
  grantee text;
begin
  foreach grantee in array array['projectsim_app', 'authenticated']
  loop
    if exists (select 1 from pg_roles where rolname = grantee) then
      execute format(
        'grant select, insert, update, delete on tenant_memberships to %I',
        grantee
      );
    end if;
  end loop;
end $$;
