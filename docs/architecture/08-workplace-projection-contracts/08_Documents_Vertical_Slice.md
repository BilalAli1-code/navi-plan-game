# Documents Vertical Slice

**Document ID:** PS-ARCH-024  
**Status:** Implemented  
**Roadmap:** PS-ROADMAP-020  
**Prerequisite:** PS-DOM-020 Authoritative Document Model

---

## 1. Purpose

Deliver a complete learner Documents vertical slice:

Authoritative `SimulationState.documents`
-> deterministic Documents projection
-> shared workplace registry / fan-out / saveIfNewer
-> `GET /api/v1/simulation-runs/{id}/documents`
-> OpenAPI + hand-written API client
-> `/app/runs/:simulationRunId/documents` inside WorkplaceShell

Documents is a derived read model. It is not authoritative Document state.

## 2. Authoritative source matrix

| Documents field | Authoritative source |
| --- | --- |
| `documentId` | `DocumentRuntime.documentId` |
| `documentDefinitionId` | runtime definition id |
| `documentDefinitionVersion` | runtime definition version pin |
| `creationSequence` | runtime creation sequence |
| `title` / `category` / `description` | learner-safe content snapshot |
| `contentType` | authoritative `plain_text` content type |
| `body` | immutable plain-text body snapshot |
| `status` | runtime lifecycle state (`available` in v1) |
| `summary.*` | derived from projected items |
| `capabilities.*` | always `"unsupported"` for upload/edit/comment |

Hidden / excluded: `originatingCommandId`, aggregate/outbox/causation metadata,
hidden authoring fields, markdown/HTML renderer state, comments, and edit/upload
state.

## 3. Projection contract

- Type: `documents`
- Schema version: `1`
- Envelope: shared workplace projection fields
- Document ordering: ascending by `creationSequence` (tie-break `documentId`)
- Empty available: `documents: []`, `isEmpty: true` (not an error)
- Semantic hash excludes `generatedAt` / `sourceEventId`

## 4. Registry and event routing

Production registry types:

- `simulation`
- `mission_control`
- `decision_log`
- `inbox`
- `meetings`
- `stakeholders`
- `documents`

| Authoritative event | simulation | mission_control | decision_log | inbox | meetings | stakeholders | documents |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Lifecycle + DecisionResolved / related | yes | yes | yes | yes | yes | yes | yes |
| `LearnerMessageDelivered` | no | no | no | yes | no | no | no |
| Meeting* lifecycle events | no | yes | no | no | yes | no | no |
| Stakeholder* authority events | no | no | no | no | no | yes | no |
| `DocumentInitialized` | no | no | no | no | no | no | yes |
| `ProjectionRebuilt` / `ProjectionBuildFailed` | no | no | no | no | no | no | no |

Partial rebuild failure remains retryable via shared event-ID inbox rules.

## 5. Persistence

- Type-keyed row in existing `simulation_projection`
- No Documents table or migration
- Shared `saveIfNewer` + source position
- Existing SimulationRun RLS covers authoritative Documents; projection RLS
  unchanged

## 6. API

`GET /api/v1/simulation-runs/{simulationRunId}/documents`

- Authn/authz via trusted session tenant
- Projection type and schema bound server-side
- `Cache-Control: private, no-store`
- GET may authorized query-time catch-up rebuild; it does not mutate
  authoritative Document state
- No Document mutation REST endpoints
- No generic `/projections/{type}` or workplace aggregation endpoint
- Operation ID: `getDocumentsProjection`

## 7. Frontend

- Route: `/app/runs/:simulationRunId/documents`
- Shell destinations (exact order): Mission Control, Inbox, Meetings,
  Stakeholders, Documents, Decision Log
- Query key: `["documents", actorId, simulationRunId]`
- Preserve server Document order; use authoritative ids as React keys
- Render body as React text with `white-space: pre-wrap`
- No upload, edit, comment, archive, markdown, or HTML rendering controls

## 8. Boundaries

- UploadArtifact remains separate from Documents
- Stakeholder chat remains out of Inbox
- Meetings participant snapshots remain unchanged
- Mission Control gains no Document counts/metrics in PS-020
- Notifications / Activities / Completed History remain PS-021+

## 9. Tests

- Domain write-side and builder/payload contract tests
- Registry fan-out and registration tests
- API empty-state + auth rejection tests
- OpenAPI contract tests
- Workplace shell navigation order tests
- Playwright empty/happy/rebuild convergence + axe coverage

## 10. Explicit non-goals (PS-020)

- Public mutation API
- Upload/edit/comment/archive lifecycle
- Markdown or HTML rendering
- AI author display
- Document-specific projection table or migration
- Notifications, Activities, Completed History
