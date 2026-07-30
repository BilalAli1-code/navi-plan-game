# Database Risks and ADR Backlog

**Document ID:** PS-DB-015  
**Version:** 1.0  
**Status:** Approved

## Risks

| Risk | Mitigation |
|---|---|
| JSONB overuse | Model stable entities relationally |
| Direct client writes | Restrict authoritative writes to server paths |
| RLS misconfiguration | Automated policy tests |
| Event table growth | Retention, partitioning, archival |
| Projection drift | Rebuild and consistency checks |
| Schema-domain coupling | Repository interfaces and domain contracts |
| Duplicate effects | Idempotency constraints and transactional writes |
| Migration failure | Expand-contract and staging validation |
| Tenant leakage | Tenant keys, RLS, integration tests |
| Generated type misuse | Keep infrastructure and domain types separate |

## ADR Backlog

- ADR-DB-001: PostgreSQL as System of Record
- ADR-DB-002: Supabase as Managed Backend
- ADR-DB-003: PostgreSQL Schema Boundaries
- ADR-DB-004: UUID Identifier Strategy
- ADR-DB-005: Transactional Outbox Tables
- ADR-DB-006: JSONB for Versioned Content
- ADR-DB-007: Projection Snapshot Storage
- ADR-DB-008: Tenant Isolation with RLS
- ADR-DB-009: Optimistic Concurrency
- ADR-DB-010: Append-Only Learning Evidence
- ADR-DB-011: Backup and Recovery Objectives
- ADR-DB-012: Event and Audit Retention

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial database risks and ADR backlog |
