# Performance and Rendering

**Document ID:** PS-UI-013  
**Version:** 1.0  
**Status:** Approved

## Goals

- Fast initial shell
- Responsive command feedback
- Efficient projection refresh
- Stable rendering with large histories
- Controlled AI streaming
- Minimal unnecessary re-renders

## Strategies

- Route-level code splitting
- Query caching
- Pagination and virtualization
- Memoization only where measured
- Stable component keys
- Lazy loading of secondary panels
- Image and asset optimization
- Projection-specific payloads
- Background refresh
- Streaming for appropriate AI responses

## Rules

1. Do not fetch entire simulation history for every screen.
2. Large inboxes and timelines use pagination or virtualization.
3. Query keys include Simulation Run context.
4. Projection payloads contain only required UI data.
5. Loading boundaries should preserve the surrounding shell.
6. Avoid cascading request chains where APIs can aggregate.
7. Track Core Web Vitals.
8. AI streaming must not block unrelated interface actions.
9. Performance budgets are established for key routes.
10. Optimization follows measurement, not assumption.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial performance architecture |
