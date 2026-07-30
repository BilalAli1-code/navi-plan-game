# Analytics and Reporting Schema

**Document ID:** PS-DB-008  
**Version:** 1.0  
**Status:** Approved

## Analytics Tables

- `analytics.fact_simulation_actions`
- `analytics.fact_decision_outcomes`
- `analytics.fact_learning_evidence`
- `analytics.fact_stakeholder_interactions`
- `analytics.dim_learner`
- `analytics.dim_content_package`
- `analytics.dim_organization`
- `analytics.metric_snapshots`
- `analytics.insights`
- `analytics.forecasts`

## Reporting Tables

- `reporting.report_definitions`
- `reporting.report_requests`
- `reporting.generated_reports`
- `reporting.report_artifacts`
- `reporting.export_jobs`

## Rules

1. Analytics is derived from authoritative events and state.
2. Calculations identify version and source period.
3. Reports are immutable snapshots.
4. Large exports run asynchronously.
5. Analytics never drives operational simulation state.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial analytics and reporting schema |
