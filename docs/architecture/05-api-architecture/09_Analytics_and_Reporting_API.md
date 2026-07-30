# Analytics and Reporting API

**Document ID:** PS-API-009  
**Version:** 1.0  
**Status:** Approved

## Analytics Endpoints

```text
GET /api/v1/analytics/learners/{learnerId}
GET /api/v1/analytics/cohorts/{cohortId}
GET /api/v1/analytics/organizations/{organizationId}
GET /api/v1/simulation-runs/{runId}/analytics
```

## Reporting Endpoints

```text
POST /api/v1/reports
GET /api/v1/reports/{reportId}
GET /api/v1/reports/{reportId}/status
POST /api/v1/reports/{reportId}/commands/export
GET /api/v1/report-artifacts/{artifactId}/download
```

## Report Request

```json
{
  "reportType": "final-simulation",
  "subjectType": "simulation-run",
  "subjectId": "run_123",
  "format": "pdf"
}
```

## Rules

1. Large reports are asynchronous.
2. Reports identify source versions and generation time.
3. Download URLs are short-lived and authorized.
4. Analytics endpoints enforce audience-specific access.
5. Forecasts include confidence and model version.
6. Analytics never mutates simulation state.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Analytics and Reporting API |
