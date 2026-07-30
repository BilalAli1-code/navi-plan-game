# Core Relational Model

**Document ID:** PS-DB-002  
**Version:** 1.0  
**Status:** Approved

## High-Level ERD

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERSHIPS : contains
    USERS ||--o{ ORGANIZATION_MEMBERSHIPS : joins
    LEARNING_PROGRAMS ||--o{ BUSINESS_CASES : contains
    BUSINESS_CASES ||--o{ CONTENT_PACKAGE_VERSIONS : publishes
    USERS ||--o{ SIMULATION_RUNS : owns
    CONTENT_PACKAGE_VERSIONS ||--o{ SIMULATION_RUNS : executes
    SIMULATION_RUNS ||--o{ SIMULATION_ACTIONS : records
    SIMULATION_RUNS ||--o{ DOMAIN_EVENTS : emits
    SIMULATION_RUNS ||--o{ STAKEHOLDER_RELATIONSHIPS : contains
    SIMULATION_RUNS ||--o{ MASTERY_EVIDENCE : produces
    SIMULATION_RUNS ||--o{ PROJECTION_SNAPSHOTS : projects
```

## Identifier Strategy

Use UUIDs for externally visible identifiers and stable IDs across API contracts, events, audit records, projections, and reports.

## Timestamp Strategy

Store timestamps in UTC using `timestamptz`. Distinguish `created_at`, `updated_at`, `occurred_at`, `recorded_at`, `effective_at`, and `scheduled_for`.

## JSONB Policy

Use JSONB for versioned content documents, event payloads, projection payloads, flexible metadata, and AI provenance. Do not use JSONB to avoid modeling stable relational entities.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial relational model |
