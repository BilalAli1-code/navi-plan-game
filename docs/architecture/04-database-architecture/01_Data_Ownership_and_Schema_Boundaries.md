# Data Ownership and Schema Boundaries

**Document ID:** PS-DB-001  
**Version:** 1.0  
**Status:** Approved

## Recommended PostgreSQL Schemas

| Schema | Ownership |
|---|---|
| `identity` | Users, organizations, memberships, permissions |
| `content` | Business Cases and published content |
| `simulation` | Simulation runs, actions, state, checkpoints |
| `stakeholder` | Relationships, conversations, commitments |
| `learning` | Evidence, mastery, reflections, assessments |
| `eventing` | Domain events, outbox, consumer checkpoints |
| `projection` | Read models for UI and AI grounding |
| `analytics` | Derived metrics, trends, forecasts |
| `reporting` | Report requests and generated artifacts |
| `audit` | Security and administrative audit records |

## Ownership Rules

1. One schema owns each authoritative table.
2. Cross-schema foreign keys are limited to stable identifiers.
3. Business rules do not live in ad hoc triggers.
4. Database constraints enforce structural integrity.
5. Domain invariants remain in domain services unless safely duplicated as constraints.
6. Projection tables never become authoritative.
7. Analytics tables never drive operational state.

## Naming

- Tables: plural `snake_case`
- Primary keys: `id`
- Foreign keys: `<entity>_id`
- Timestamps: `created_at`, `updated_at`, `occurred_at`
- Versions: `aggregate_version`, `content_version`, `schema_version`

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial schema-boundary rules |
