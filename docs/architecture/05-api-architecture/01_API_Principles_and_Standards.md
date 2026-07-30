# API Principles and Standards

**Document ID:** PS-API-001  
**Version:** 1.0  
**Status:** Approved

## Principles

- Domain language over technical language
- Stable contracts over database exposure
- Explicit commands over generic updates
- Idempotent mutation handling
- Typed errors
- Pagination by default
- Traceability through correlation IDs
- Backward-compatible evolution
- Least-privilege access
- Projection-first reads

## HTTP Conventions

| Operation | Method |
|---|---|
| Read resource | `GET` |
| Create resource | `POST` |
| Execute command | `POST` |
| Replace client-owned configuration | `PUT` |
| Partial non-domain update | `PATCH` |
| Delete eligible resource | `DELETE` |

## Headers

```text
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: <uuid>
X-Correlation-ID: <uuid>
If-Match: "<version>"
```

## Response Envelope

```ts
interface ApiResponse<T> {
  data: T;
  meta?: {
    requestId: string;
    correlationId: string;
    apiVersion: string;
  };
}
```

## Naming

- JSON fields use `camelCase`
- URLs use plural lowercase nouns
- Commands use explicit verbs
- Dates use ISO 8601 UTC
- IDs are opaque strings

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial API standards |
