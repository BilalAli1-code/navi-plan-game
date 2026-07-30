# Simulation Runtime API

**Document ID:** PS-API-004  
**Version:** 1.0  
**Status:** Approved

## Endpoints

### Create Run

```http
POST /api/v1/simulation-runs
```

```json
{
  "programId": "program_123",
  "businessCaseId": "case_123",
  "contentPackageVersionId": "version_123"
}
```

### Start Run

```http
POST /api/v1/simulation-runs/{runId}/commands/start
```

### Submit Decision

```http
POST /api/v1/simulation-runs/{runId}/commands/submit-decision
Idempotency-Key: 4c6c...
If-Match: "17"
```

```json
{
  "commandId": "cmd_123",
  "commandType": "SubmitDecision",
  "commandVersion": 1,
  "expectedAggregateVersion": 17,
  "payload": {
    "decisionId": "decision_456",
    "optionId": "option_b",
    "rationale": "Selected based on stakeholder and risk impact."
  }
}
```

### Complete Activity

```http
POST /api/v1/simulation-runs/{runId}/commands/complete-activity
```

### Pause and Resume

```http
POST /api/v1/simulation-runs/{runId}/commands/pause
POST /api/v1/simulation-runs/{runId}/commands/resume
```

### Read Run Summary

```http
GET /api/v1/simulation-runs/{runId}
```

## Rules

- Mutations require idempotency keys.
- Version-sensitive commands use `If-Match` or `expectedAggregateVersion`.
- Accepted commands return a receipt.
- Rejected commands do not alter state.
- Runtime endpoints never invoke AI inside the authoritative transaction.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Simulation Runtime API |
