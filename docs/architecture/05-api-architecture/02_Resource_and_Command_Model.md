# Resource and Command Model

**Document ID:** PS-API-002  
**Version:** 1.0  
**Status:** Approved

## Resource APIs

Resource APIs expose stable read or administrative models.

Examples:

```text
GET /api/v1/programs
GET /api/v1/business-cases/{businessCaseId}
GET /api/v1/simulation-runs/{simulationRunId}
GET /api/v1/simulation-runs/{simulationRunId}/mission-control
```

## Command APIs

Business changes use explicit command endpoints.

Examples:

```text
POST /api/v1/simulation-runs/{simulationRunId}/commands/start
POST /api/v1/simulation-runs/{simulationRunId}/commands/submit-decision
POST /api/v1/simulation-runs/{simulationRunId}/commands/complete-activity
POST /api/v1/simulation-runs/{simulationRunId}/commands/pause
```

## Command Contract

```ts
interface CommandRequest<TPayload> {
  commandId: string;
  commandType: string;
  commandVersion: number;
  expectedAggregateVersion?: number;
  payload: TPayload;
}
```

## Command Receipt

```ts
interface CommandReceipt {
  commandId: string;
  status: "accepted" | "rejected";
  aggregateVersion?: number;
  projectionVersionHint?: number;
  emittedEventIds?: string[];
  error?: ApiError;
}
```

## Rules

1. Generic `PATCH` is prohibited for authoritative domain behavior.
2. Commands are named by business intent.
3. A command either succeeds once or returns the original result on retry.
4. Queries never mutate state.
5. Resource representations do not expose persistence internals.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial resource and command model |
