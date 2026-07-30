# Command Processing Architecture

**Document ID:** PS-ARCH-006  
**Version:** 1.0  
**Status:** Approved

## Flow

```mermaid
flowchart LR
    A[Receive] --> B[Authenticate]
    B --> C[Authorize]
    C --> D[Validate Schema]
    D --> E[Check Idempotency]
    E --> F[Load Aggregate]
    F --> G[Validate Invariants]
    G --> H[Execute]
    H --> I[Persist]
    I --> J[Publish Events]
    J --> K[Return Receipt]
```

## Typed Errors

```ts
interface DomainError {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}
```

## Rules

- Mutating commands require idempotency keys.
- Rejected commands leave authoritative state unchanged.
- Authorization occurs before execution and inside domain policies when needed.
- Command results include state versions and emitted-event references.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial command architecture |
