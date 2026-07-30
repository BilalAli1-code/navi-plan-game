# Security Engineering

**Document ID:** PS-ENG-012  
**Version:** 1.0  
**Status:** Approved

## Secure Development Rules

1. Validate all external input.
2. Authorize every protected action.
3. Keep secrets out of source control.
4. Use least privilege.
5. Enforce tenant isolation.
6. Redact sensitive logs.
7. Keep dependencies current.
8. Review file uploads.
9. Validate AI grounding and outputs.
10. Audit privileged actions.

## Required Controls

- SAST
- Dependency scanning
- Secret scanning
- RLS tests
- Authentication tests
- Authorization tests
- Secure headers
- Rate limiting
- Audit logging
- Incident response procedures

## Threat Review Triggers

Perform a threat review when adding:

- New external integrations
- File upload
- Public sharing
- Enterprise administration
- AI provider access
- Webhooks
- Payment processing
- Privileged exports
- New tenant boundaries

## Vulnerability Handling

Security defects are prioritized by exploitability and impact. Critical issues may bypass normal release cadence.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial security engineering standards |
