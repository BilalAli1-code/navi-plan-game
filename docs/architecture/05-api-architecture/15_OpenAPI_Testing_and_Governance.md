# OpenAPI, Testing, and Governance

**Document ID:** PS-API-015  
**Version:** 1.0  
**Status:** Approved

## OpenAPI

Public HTTP APIs are documented in OpenAPI 3.1.

Recommended structure:

```text
docs/api/openapi/
├── openapi.yaml
├── paths/
├── schemas/
├── examples/
└── security/
```

## Testing Layers

- Schema validation tests
- Route tests
- Authorization tests
- Domain integration tests
- Contract tests
- Idempotency tests
- Concurrency tests
- RLS tests
- Webhook-signature tests
- Load tests
- Backward-compatibility tests

## Governance

Every endpoint must have:

- Owner
- Purpose
- Authentication requirement
- Authorization policy
- Request schema
- Response schema
- Error codes
- Idempotency behavior
- Versioning policy
- Observability fields

## Review Gates

API changes require review from:

- Domain owner
- Platform/API owner
- Security when access changes
- Data architecture when persistence changes
- Product when external behavior changes

## Definition of Done

An endpoint is complete when implementation, OpenAPI, tests, authorization, logging, and operational metrics are delivered together.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial API governance standard |
