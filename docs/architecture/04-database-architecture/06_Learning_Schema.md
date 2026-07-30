# Learning Schema

**Document ID:** PS-DB-006  
**Version:** 1.0  
**Status:** Approved

## Core Tables

- `learning.learner_mastery_profiles`
- `learning.competency_states`
- `learning.learning_objective_states`
- `learning.mastery_evidence`
- `learning.reflections`
- `learning.assessment_attempts`
- `learning.recommendations`
- `learning.achievements`
- `learning.exam_readiness_snapshots`
- `learning.coaching_history`

## Mastery Evidence

```sql
create table learning.mastery_evidence (
  id uuid primary key,
  tenant_id uuid not null,
  learner_id uuid not null,
  simulation_run_id uuid,
  competency_key text not null,
  learning_objective_key text,
  source_type text not null,
  source_id uuid,
  evidence_strength numeric(5,2) not null,
  payload jsonb not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);
```

## Rules

1. Mastery evidence is append-only.
2. Competency state is derived from evidence and policy.
3. Reflections are permanent learning artifacts.
4. Assessment attempts never overwrite history.
5. Recommendation generation records policy version.
6. Exam-readiness snapshots are reproducible.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial learning schema |
