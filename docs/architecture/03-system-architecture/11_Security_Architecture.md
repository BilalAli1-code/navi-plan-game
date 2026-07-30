# Security Architecture

**Document ID:** PS-ARCH-011  
**Version:** 1.0  
**Status:** Approved

## Security Layers

- Authentication
- Authorization
- Tenant isolation
- Row-level security
- API validation
- Domain authorization
- Secrets management
- Audit logging
- AI data minimization
- Secure deployment

## Identity

Supabase Auth provides authentication. Domain services receive stable actor identifiers and authorization context.

## Authorization

Use capability-based permissions such as:

```text
simulation.run.start
simulation.run.view
content.publish
report.export
analytics.view.enterprise
```

## Data Isolation

Every tenant-scoped record includes `tenant_id`. Row-level security and application checks enforce isolation.

## AI Security

- Prompt-injection controls
- Bounded grounding
- Output validation
- Sensitive-data redaction
- Provider allowlists
- Audit of material interactions

## Invariants

1. No client directly updates authoritative simulation tables.
2. Service-role credentials never appear in the browser.
3. Tenant isolation exists at database and application layers.
4. Sensitive exports require authorization.
5. Secrets use managed secret stores.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial security architecture |
