# Authentication and Authorization

**Document ID:** PS-API-003  
**Version:** 1.0  
**Status:** Approved

## Authentication

Supabase Auth issues user sessions and access tokens.

The API validates:

- Token signature
- Expiration
- Subject
- Session state
- Tenant membership where required

## Authorization Context

```ts
interface AuthorizationContext {
  actorId: string;
  tenantId?: string;
  roles: string[];
  capabilities: string[];
  sessionId: string;
}
```

## Capability Examples

```text
simulation.run.start
simulation.run.view
simulation.run.reset
content.create
content.review
content.publish
report.generate
report.export
analytics.view.enterprise
organization.manage
```

## Rules

1. Client-provided tenant IDs are never trusted without membership validation.
2. Service-role credentials remain server-side.
3. Authorization is checked at route and domain-policy levels.
4. Admin access is explicit and audited.
5. API responses never expose unauthorized fields.
6. Enrollment is required for learner access to assigned programs.

## Common Responses

- `401 Unauthorized` — missing or invalid authentication
- `403 Forbidden` — valid identity without required capability
- `404 Not Found` — resource absent or intentionally hidden

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial authentication and authorization model |
