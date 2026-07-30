# Supabase and Database Engineering Standards

**Document ID:** PS-ENG-006  
**Version:** 1.0  
**Status:** Approved

## Rules

1. All schema changes use migrations.
2. Production data changes are reviewed.
3. RLS is enabled for client-accessible tables.
4. Service-role operations remain server-side.
5. Generated Supabase types are infrastructure artifacts.
6. Domain code does not import generated database types.
7. Authoritative simulation tables are not directly writable by clients.
8. Transactions group state, actions, and outbox events.
9. Indexes are justified by query patterns.
10. Migrations use expand-and-contract for breaking changes.

## Migration Checklist

- Forward migration tested
- Existing data considered
- RLS policies updated
- Index impact reviewed
- Generated types refreshed
- Rollback or remediation documented
- Staging validation completed

## Edge Functions

Edge Functions should:

- Validate input
- Verify authentication
- Resolve authorization
- Call application services
- Avoid duplicating domain logic
- Emit structured logs
- Return standard API errors

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Supabase engineering standards |
