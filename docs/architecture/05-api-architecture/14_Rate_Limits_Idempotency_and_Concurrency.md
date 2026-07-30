# Rate Limits, Idempotency, and Concurrency

**Document ID:** PS-API-014  
**Version:** 1.0  
**Status:** Approved

## Rate Limiting

Rate limits may vary by:

- Actor
- Tenant
- Endpoint category
- Subscription plan
- AI cost profile
- Integration client

## Response Headers

```text
RateLimit-Limit
RateLimit-Remaining
RateLimit-Reset
Retry-After
```

## Idempotency

All mutating simulation commands require:

```text
Idempotency-Key: <opaque unique key>
```

The key is scoped to actor, endpoint, and aggregate where appropriate.

## Concurrency

Version-sensitive updates use optimistic concurrency.

```text
If-Match: "23"
```

A mismatch returns:

```text
412 Precondition Failed
```

## Rules

1. Reusing a key with different payload returns a conflict.
2. Successful results are replayed for safe retries.
3. Idempotency records have documented retention.
4. Rate limiting does not corrupt command sequencing.
5. AI endpoints have separate cost-aware limits.
6. Bulk operations have explicit maximum sizes.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial rate, idempotency, and concurrency controls |
