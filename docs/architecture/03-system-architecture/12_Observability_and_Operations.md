# Observability and Operations

**Document ID:** PS-ARCH-012  
**Version:** 1.0  
**Status:** Approved

## Operational Questions

Operators must be able to determine:

- Which command failed?
- Which Simulation Run was affected?
- Which action and event caused the issue?
- Which content version was active?
- Which projection is stale?
- Which AI model and prompt version were used?
- Can the run be replayed?

## Correlation Fields

- Correlation ID
- Causation ID
- Simulation Run ID
- Aggregate ID
- Actor ID
- Tenant ID
- Content Package Version ID

## Telemetry

### Metrics
- Command latency
- Rejection rate
- Duplicate-detection rate
- Event-publication lag
- Projection freshness
- AI latency and cost
- Replay-mismatch count
- Error rate

### Logs
Structured JSON logs with redaction.

### Traces
Distributed tracing across API, Runtime, Core Simulation, projections, and AI.

## Dashboards

- Platform health
- Simulation processing
- Event pipeline
- Projection freshness
- AI usage
- Security events

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial observability architecture |
