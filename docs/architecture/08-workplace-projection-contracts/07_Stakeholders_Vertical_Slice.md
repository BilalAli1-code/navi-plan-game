# Stakeholders Vertical Slice

**Document ID:** PS-ARCH-023  
**Status:** Implemented  
**Roadmap:** PS-ROADMAP-019  
**Prerequisite:** PS-DOM-019 Authoritative Stakeholder Model (PS-ROADMAP-018)

---

## 1. Purpose

Deliver a complete learner Stakeholders vertical slice:

Authoritative `SimulationState.stakeholders` + `stakeholderConversations`
→ deterministic Stakeholders projection
→ shared workplace registry / fan-out / saveIfNewer
→ `GET /api/v1/simulation-runs/{id}/stakeholders`
→ OpenAPI + hand-written API client
→ `/app/runs/:simulationRunId/stakeholders` inside WorkplaceShell

Stakeholders is a derived read model. It is not authoritative Stakeholder state.

## 2. Authoritative source matrix

| Stakeholders field | Authoritative source |
| --- | --- |
| `stakeholderId` | `StakeholderRuntime.stakeholderId` |
| `stakeholderDefinitionId` | runtime definition id |
| `stakeholderDefinitionVersion` | runtime definition version pin |
| `initializationSequence` | runtime initialization sequence |
| `profile.*` | learner-safe profile snapshot |
| `conversation.conversationId` | `StakeholderConversation.conversationId` |
| `conversation.messages[].messageId` | message occurrence id |
| `conversation.messages[].conversationSequence` | authoritative sequence |
| `conversation.messages[].direction` | authoritative direction |
| `conversation.messages[].author` | contract-stable `{ kind: "learner", label: "You" }` |
| `conversation.messages[].body` / `occurredAt` | authoritative message fields |
| `summary.*` | derived from projected items |
| `capabilities.*` | always `"unsupported"` for sendMessage/editProfile |

Hidden / excluded: `originatingCommandId`, `authorActorId`, aggregate/outbox/causation metadata, hidden goals, prompts, scoring, trust/influence/sentiment, AI reply state.

When no authoritative conversation exists yet, `conversation` is `null` (no fabricated conversation id).

## 3. Projection contract

- Type: `stakeholders`
- Schema version: `1`
- Envelope: shared workplace projection fields
- Stakeholder ordering: ascending by `initializationSequence` (tie-break `stakeholderId`)
- Message ordering: ascending by `conversationSequence` (tie-break `messageId`)
- Empty available: `stakeholders: []`, `isEmpty: true` (not an error)
- Semantic hash excludes `generatedAt` / `sourceEventId`

## 4. Registry and event routing

Production registry types:

- `simulation`
- `mission_control`
- `decision_log`
- `inbox`
- `meetings`
- `stakeholders`

| Authoritative event | simulation | mission_control | decision_log | inbox | meetings | stakeholders |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Lifecycle + DecisionResolved / related | yes | yes | yes | yes | yes | yes |
| `LearnerMessageDelivered` | no | no | no | yes | no | no |
| Meeting* lifecycle events | no | yes | no | no | yes | no |
| Stakeholder* authority events | no | no | no | no | no | yes |
| `ProjectionRebuilt` / `ProjectionBuildFailed` | no | no | no | no | no | no |

Partial rebuild failure remains retryable via shared event-ID inbox rules.

## 5. Persistence

- Type-keyed row in existing `simulation_projection`
- No Stakeholders table or migration
- Shared `saveIfNewer` + source position
- Existing SimulationRun RLS covers authoritative stakeholders; projection RLS unchanged

## 6. API

`GET /api/v1/simulation-runs/{simulationRunId}/stakeholders`

- Authn/authz via trusted session tenant
- Projection type and schema bound server-side
- `Cache-Control: private, no-store`
- GET may authorized query-time catch-up rebuild; it does not mutate authoritative Stakeholder state
- No Stakeholder mutation REST endpoints
- No generic `/projections/{type}` or workplace aggregation endpoint
- Operation ID: `getStakeholdersProjection`

## 7. Frontend

- Route: `/app/runs/:simulationRunId/stakeholders`
- Shell destinations (exact order): Mission Control, Inbox, Meetings, Stakeholders, Decision Log
- Query key: `["stakeholders", actorId, simulationRunId]`
- Preserve server stakeholder/message order; use authoritative ids as React keys
- Author/direction communicated with text labels (not color alone)
- No message composer, optimistic send, profile edit, trust/influence, AI reply UI
- Browser formats timestamps for display only; never derives conversation order from `Date.now()`

## 8. Boundaries

- Inbox remains system-delivered `learnerMessages` only — no Stakeholder chat merge
- Meetings participant snapshots remain unchanged
- Mission Control gains no Stakeholder counts/metrics in PS-019
- Decision Log / StakeholderSignalEmitted remain decision-path facts
- Documents are implemented by PS-020; Notifications / Activities / Completed
  History remain PS-021+

## 9. Tests

- Domain builder/payload contract tests
- Registry fan-out and registration tests
- API empty-state + auth rejection tests
- OpenAPI contract tests
- Workplace shell navigation order tests
- Playwright empty/happy/rebuild convergence + axe coverage

## 10. Explicit non-goals (PS-019)

- Mutation API / message-send REST
- Message composer / optimistic UI
- AI-generated replies
- Relationship / trust / influence scores
- Unread / presence / typing / receipts
- Mission Control Stakeholder metrics
- Notifications, Activities, Completed History, and later workplace surfaces
