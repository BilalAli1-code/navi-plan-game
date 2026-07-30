# State Management

**Document ID:** PS-UI-008  
**Version:** 1.0  
**Status:** Approved

## State Categories

| State Type | Owner |
|---|---|
| Authoritative business state | Server/domain |
| Projection data | Query cache |
| Form state | Local form layer |
| Navigation state | Router |
| Temporary interaction state | Local component |
| Authentication state | Auth provider |
| Feature flags | Configuration service |

## Recommended Tools

- TanStack Query for server and projection state
- React Router for navigation
- React Hook Form for forms
- Local React state for temporary interaction state
- Context only for narrow cross-cutting concerns

## Rules

1. Do not duplicate server projections in global client stores.
2. Do not derive authoritative counts from cached raw lists.
3. Invalidate or refresh projection queries after accepted commands.
4. Use command receipts and aggregate versions to confirm freshness.
5. Draft form content may persist locally where appropriate.
6. Authentication context contains identity, not domain state.
7. Avoid a single global store containing every UI and domain concern.
8. Reset run-scoped client state when Simulation Run context changes.
9. Persist only safe and necessary browser state.
10. Error recovery must not silently replay commands without idempotency keys.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial state-management architecture |
