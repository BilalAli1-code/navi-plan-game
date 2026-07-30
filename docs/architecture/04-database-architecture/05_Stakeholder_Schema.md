# Stakeholder Schema

**Document ID:** PS-DB-005  
**Version:** 1.0  
**Status:** Approved

## Core Tables

- `stakeholder.stakeholder_relationships`
- `stakeholder.relationship_state_history`
- `stakeholder.conversation_threads`
- `stakeholder.conversation_messages`
- `stakeholder.interactions`
- `stakeholder.commitments`
- `stakeholder.concerns`
- `stakeholder.escalations`

## Relationship Table

```sql
create table stakeholder.stakeholder_relationships (
  id uuid primary key,
  tenant_id uuid not null,
  simulation_run_id uuid not null,
  stakeholder_definition_id text not null,
  trust numeric(5,2) not null,
  support numeric(5,2) not null,
  sentiment text not null,
  posture text not null,
  aggregate_version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (simulation_run_id, stakeholder_definition_id)
);
```

## Rules

1. Messages are append-only.
2. Completion never deletes conversation history.
3. Every message records sender type and timestamp.
4. AI-generated messages store provenance.
5. Relationship changes reference their causes.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial stakeholder schema |
