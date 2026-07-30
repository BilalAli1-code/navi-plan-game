# Scalability and Resilience

**Document ID:** PS-ARCH-013  
**Version:** 1.0  
**Status:** Approved

## Scaling Strategy

- Stateless API and application services scale horizontally.
- PostgreSQL remains the authoritative system of record.
- Immutable content uses cache and CDN distribution.
- Projection reads scale separately from writes.
- Event consumers scale independently.
- AI calls remain isolated from core command processing.

## Resilience Patterns

- Idempotency
- Optimistic concurrency
- Transactional outbox
- Retry with backoff
- Circuit breakers
- Bulkheads
- Dead-letter handling
- Checkpoints and replay
- Graceful degradation

## Failure Isolation

| Failure | Expected Behavior |
|---|---|
| AI unavailable | Use fallback; simulation continues |
| Analytics unavailable | Queue events; simulation continues |
| Projection delayed | Show last known state and refresh |
| Event consumer fails | Retry without duplicate effects |
| Runtime crashes | Recover from persisted state and history |
| Content cache misses | Reload immutable content version |

## Capacity Direction

The MVP should support thousands of active learners, hundreds of concurrent simulation actions, and independent scaling of AI and projections.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial scalability and resilience architecture |
