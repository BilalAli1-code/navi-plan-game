# Identity, Tenancy, and Authorization

**Document ID:** PS-DB-009  
**Version:** 1.0  
**Status:** Approved

## Core Tables

- `identity.user_profiles`
- `identity.organizations`
- `identity.organization_memberships`
- `identity.roles`
- `identity.permissions`
- `identity.role_permissions`
- `identity.membership_roles`
- `identity.enrollments`
- `identity.consent_records`
- `identity.notification_preferences`

## Supabase Authentication

Supabase Auth owns authentication credentials and sessions. ProjectSim stores domain profiles and memberships using the Auth user ID.

## Multi-Tenancy

Every tenant-scoped table includes `tenant_id`. Tenant context is derived from authenticated membership and is never trusted from arbitrary client input.

## Rules

1. RLS is enabled for client-accessible tables.
2. Service-role operations remain server-side.
3. Authorization uses capabilities.
4. Membership history is retained.
5. Privileged actions are audited.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial identity and tenancy schema |
