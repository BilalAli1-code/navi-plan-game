# API Risks and ADR Backlog

**Document ID:** PS-API-016  
**Version:** 1.0  
**Status:** Approved

## Risks

| Risk | Mitigation |
|---|---|
| Database schema leaks into API | Separate API DTOs and domain contracts |
| Generic updates bypass rules | Explicit command endpoints |
| Duplicate mutation effects | Mandatory idempotency |
| Stale client writes | Optimistic concurrency |
| Overexposed learner data | Projection DTOs and field-level authorization |
| API and event contracts diverge | Shared governance and contract tests |
| AI endpoints become authoritative | Enforce non-authoritative boundary |
| Realtime used as source of truth | Realtime carries projection notifications only |
| Version proliferation | Stable v1 and deliberate deprecation |
| Inconsistent errors | Central error catalog |

## ADR Backlog

- ADR-API-001: REST as External API Style
- ADR-API-002: Explicit Command Endpoints
- ADR-API-003: Projection-First Query APIs
- ADR-API-004: OpenAPI 3.1
- ADR-API-005: Idempotency-Key Standard
- ADR-API-006: Optimistic Concurrency with `If-Match`
- ADR-API-007: Capability-Based Authorization
- ADR-API-008: External Webhook Contract Separation
- ADR-API-009: Realtime Projection Notifications
- ADR-API-010: API Error Catalog
- ADR-API-011: Major Version in URL
- ADR-API-012: AI Provider Abstraction

## Review Triggers

Revisit this architecture when native mobile clients, public partner APIs, GraphQL, high-volume webhooks, or external developer ecosystems become roadmap commitments.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial API risks and ADR backlog |
