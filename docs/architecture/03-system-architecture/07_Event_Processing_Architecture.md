# Event Processing Architecture

**Document ID:** PS-ARCH-007  
**Version:** 1.0  
**Status:** Approved

## Preferred Pattern

Use a transactional outbox.

```mermaid
sequenceDiagram
    participant Domain
    participant DB
    participant Outbox
    participant Publisher
    participant Bus
    participant Consumer

    Domain->>DB: Save aggregate state
    Domain->>Outbox: Save events in same transaction
    Publisher->>Outbox: Read unpublished events
    Publisher->>Bus: Publish
    Bus->>Consumer: Deliver at least once
    Consumer->>Consumer: Deduplicate and process
```

## Delivery Semantics

- At-least-once delivery
- Idempotent consumers
- No global ordering assumption
- Aggregate sequence is authoritative
- Dead-letter handling for repeated failures

## Consumers

- Projection builders
- Learning signal handlers
- Stakeholder signal handlers
- Analytics consumers
- Reporting workflows
- AI context invalidation
- Audit pipelines

## Versioning

Breaking changes require a new event version or event type. Historical events remain immutable.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial event processing architecture |
