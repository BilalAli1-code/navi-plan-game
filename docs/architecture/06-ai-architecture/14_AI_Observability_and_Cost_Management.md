# AI Observability and Cost Management

**Document ID:** PS-AI-014  
**Version:** 1.0  
**Status:** Approved

## Interaction Telemetry

Record:

- Interaction ID
- Tenant ID
- Actor ID
- Simulation Run ID
- Persona version
- Prompt version
- Model policy
- Provider
- Model
- Input and output token counts
- Latency
- Cost
- Validation result
- Safety result
- Fallback use
- User feedback

## Dashboards

- AI request volume
- Success and failure rates
- Validation rejection rate
- Safety rejection rate
- Latency by task
- Cost by tenant
- Cost by persona
- Fallback frequency
- User satisfaction
- Model drift indicators

## Cost Controls

- Per-request budgets
- Per-tenant budgets
- Model tiers
- Context limits
- Response-length limits
- Caching where appropriate
- Batch processing for offline tasks
- Alerting on anomalies

## Rules

1. Logs redact sensitive content.
2. Cost is attributable.
3. Budget enforcement does not affect core simulation state.
4. High-cost tasks may require asynchronous execution.
5. Model-routing changes are monitored after release.
6. Raw prompt retention follows privacy policy.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial AI observability and cost architecture |
