# Migrations and Versioning

**Document ID:** PS-DB-012  
**Version:** 1.0  
**Status:** Approved

## Principles

- All schema changes are version-controlled.
- Production changes are applied through CI/CD.
- Manual production edits are prohibited.
- Migrations are forward-safe.
- Destructive changes use staged rollouts.
- Backfills are observable and restartable.

## Expand and Contract

```text
1. Add new schema element
2. Deploy compatible application code
3. Backfill data
4. Switch reads and writes
5. Verify
6. Remove obsolete element later
```

## Supabase Structure

```text
supabase/
├── migrations/
├── functions/
├── seed/
└── tests/
```

## Generated Types

Supabase-generated TypeScript types are infrastructure artifacts. Regenerate them after schema changes, but do not use them as domain contracts.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial migration strategy |
