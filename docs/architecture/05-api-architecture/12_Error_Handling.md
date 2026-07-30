# Error Handling

**Document ID:** PS-API-012  
**Version:** 1.0  
**Status:** Approved

## Error Envelope

```ts
interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  fieldErrors?: Record<string, string[]>;
  details?: Record<string, unknown>;
  requestId: string;
  correlationId: string;
}
```

## Status Mapping

| Status | Meaning |
|---|---|
| `400` | Malformed request |
| `401` | Authentication required |
| `403` | Insufficient permission |
| `404` | Resource not found or hidden |
| `409` | Conflict or duplicate |
| `412` | Version precondition failed |
| `422` | Valid syntax but rejected business rule |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |
| `503` | Temporary dependency failure |

## Domain Error Examples

```text
SIMULATION_RUN_NOT_ACTIVE
DECISION_ALREADY_RESOLVED
ACTIVITY_NOT_AVAILABLE
CONTENT_VERSION_NOT_PUBLISHED
AGGREGATE_VERSION_CONFLICT
IDEMPOTENCY_KEY_REUSED
TENANT_ACCESS_DENIED
AI_OUTPUT_VALIDATION_FAILED
```

## Rules

1. Internal stack traces are never returned.
2. Error codes remain stable.
3. Messages are safe for intended audiences.
4. Retryability is explicit.
5. Validation errors identify fields.
6. Every error is correlated to server logs.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial error handling standard |
