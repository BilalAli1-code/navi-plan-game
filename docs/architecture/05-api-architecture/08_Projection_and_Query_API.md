# Projection and Query API

**Document ID:** PS-API-008  
**Version:** 1.0  
**Status:** Approved

## Projection Endpoints

```text
GET /api/v1/simulation-runs/{runId}/mission-control
GET /api/v1/simulation-runs/{runId}/dashboard
GET /api/v1/simulation-runs/{runId}/daily-briefing
GET /api/v1/simulation-runs/{runId}/inbox
GET /api/v1/simulation-runs/{runId}/meetings
GET /api/v1/simulation-runs/{runId}/timeline
GET /api/v1/simulation-runs/{runId}/completion-readiness
```

## Projection Metadata

```ts
interface ProjectionResponse<T> {
  data: T;
  meta: {
    projectionType: string;
    projectionVersion: number;
    sourceAggregateVersion: number;
    builtAt: string;
    stale: boolean;
  };
}
```

## Query Parameters

```text
?cursor=<opaque>
?limit=25
?status=pending
?chapterId=chapter_1
?includeArchived=true
```

## Rules

1. Projection endpoints are read-only.
2. Clients do not reconstruct cross-tab counts.
3. Archived items remain queryable.
4. Pagination cursors are opaque.
5. Projection responses identify freshness.
6. A client may poll until `sourceAggregateVersion` reaches the command receipt version.

## Implementation status note

As of PS-ROADMAP-008/009, the executable public API exposes only the canonical
simulation projection route. Per-surface routes above remain blueprint direction.
Shared envelope and workplace taxonomy are defined in
`docs/architecture/08-workplace-projection-contracts/` (ADR-006). New workplace
routes are deferred to later Milestone 2 slices.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Projection and Query API |
| 1.1 | Approved | Note executable status and PS-ROADMAP-009 contracts |
