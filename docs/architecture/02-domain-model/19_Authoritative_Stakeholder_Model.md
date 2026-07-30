# Authoritative Stakeholder Model

**Document ID:** PS-DOM-019  
**Status:** Implemented  
**Roadmap item:** PS-ROADMAP-018  
**Prerequisite:** merged PS-ROADMAP-017  
**Prerequisite for:** PS-ROADMAP-019 (Stakeholder projection, API, and Workplace UI)  
**Owner aggregate:** SimulationRun / SimulationState

---

## 1. Purpose

PS-018 establishes the authoritative runtime Stakeholder model on SimulationRun.
It unblocks PS-019 without implementing Stakeholder projection, API, OpenAPI,
Workplace route, navigation, chat UI, or AI replies.

## 2. Authoritative owner

- **Owner:** SimulationRun (`SimulationState`)
- **Not a projection:** runtime Stakeholders and conversations are write-model
  facts, not `stakeholders` projection rows
- **No second write model:** no Stakeholder repository, no stakeholders write
  table, no Stakeholder-specific outbox
- **Relationship to PS-DOM-005:** the older approved blueprint
  (`05_Stakeholder_Aggregate.md`) describes a broader `StakeholderRelationship`
  surface (trust, sentiment, commitments, etc.). That relationship-scoring
  aggregate is **not** implemented here. PS-018 places the smallest coherent v1
  runtime model on SimulationRun — the same ownership pattern as Meetings
  (PS-016) and learner messages (PS-014). No accepted ADR defines a separate
  Stakeholder aggregate with its own transaction, repository, and outbox
  boundaries.

## 3. Definition versus runtime

| Concept | Role |
| --- | --- |
| Stakeholder definition identity (`stakeholderId`) | Content-authored identity carried in `InitializeStakeholder` |
| Definition version | Immutable pin on the runtime Stakeholder |
| Runtime Stakeholder | Authoritative SimulationRun fact with learner-safe profile snapshot |
| Conversation / message | Authoritative chat history owned by SimulationRun (v1) |

Hidden authoring fields (goals, evaluator instructions, AI prompts, scores)
must not enter learner-safe runtime snapshots.

## 4. Runtime identity

```text
stakeholderId  (one runtime instance per StakeholderId per SimulationRun)
```

- Deterministic and immutable after initialization
- Survives retries, replay, upcasting, and PostgreSQL round trips
- Duplicate-identical initialization → accept, bump aggregate version, no second
  Stakeholder / no `StakeholderInitialized`
- Conflicting initialization → `STAKEHOLDER_IDENTITY_CONFLICT`

## 5. Ordering

Canonical Stakeholder order is monotonic `initializationSequence` (1-based)
within the run.

## 6. Learner-safe profile snapshot

Persisted on the runtime Stakeholder:

- `displayName` (required)
- `roleLabel`, `organization`, `department`, `biography` (optional)
- definition id/version
- `initializationSequence`, `initializedAt`, `originatingCommandId`

Rejected from learner-visible text: markup (`<`, `>`).

Not persisted: facilitator notes, hidden goals, scoring weights, AI prompts,
private branching conditions, unrevealed information.

## 7. Existing Stakeholder signals

Decision consequences may still emit `StakeholderSignalEmitted`. Those signals
remain consequence/event facts owned by the decision resolution path. PS-018
does **not** duplicate them into a second Stakeholder signal ledger or invent
trust/influence/sentiment aggregate scores.

## 8. Relationship-state scope (v1)

**Out of scope.** No `trustScore`, `influenceScore`, `sentimentScore`, or other
speculative CRM fields.

## 9. Conversation model (v1)

| Decision | Choice |
| --- | --- |
| Required in v1? | **Yes** — `SendStakeholderMessage` already existed as a public command contract |
| Cardinality | **Exactly one** conversation per runtime Stakeholder per SimulationRun |
| Exists before first message? | **No** — opened on first accepted `SendStakeholderMessage` |
| Identity | `conversation:{stakeholderId}` |
| Lifecycle / archive / close | **Not in v1** |
| Directions | `learner_to_stakeholder` only |
| AI replies | **Not in v1** |
| Inbox boundary | Learner→Stakeholder messages live **only** in Stakeholder conversation authority. They do **not** append `learnerMessages` / Inbox. System-delivered Inbox messages remain the `deliver_learner_message` consequence path. |

Message identity:

```text
stakeholder_message:{commandId}
```

Message order: monotonic `conversationSequence` (1-based) within the conversation.

Duplicate-identical message → accept, bump version, no second occurrence / no
message Domain event. Conflicting identity reuse →
`STAKEHOLDER_MESSAGE_IDENTITY_CONFLICT`.

Provided `conversationId` on `SendStakeholderMessage` must equal the
deterministic identity or the command is rejected
(`STAKEHOLDER_CONVERSATION_IDENTITY_CONFLICT`). Omitting it uses the default.

## 10. Commands and events

Every accepted Stakeholder command still emits `SimulationActionAccepted`.

| Command | Authoritative transition | Dedicated events | Duplicate behavior |
| --- | --- | --- | --- |
| `InitializeStakeholder` | Append runtime Stakeholder | `StakeholderInitialized` | Identical → no-op Domain event; conflict → typed error |
| `SendStakeholderMessage` | Open conversation (first message) + append message | `StakeholderConversationOpened` (first only), `StakeholderMessageSent` | Identical message → no-op Domain events; conflict → typed error |

`SendStakeholderMessage` requires a prior `InitializeStakeholder` for the
recipient (`STAKEHOLDER_NOT_FOUND` otherwise).

## 11. Consistency

- Command idempotency: existing `commandId` receipts
- Occurrence idempotency: identity + semantic equality / conflict
- Optimistic concurrency: SimulationRun `aggregateVersion`
- Exactly-once: one runtime Stakeholder per id; one message per command-derived id
- Transactional outbox: state + events via existing `SimulationRunRepository.save`

## 12. State schema

- Previous: SimulationState schema version **4**
- PS-018 introduced: SimulationState schema version **5**
- Fields:
  - `stakeholders: StakeholderRuntime[]`
  - `stakeholderConversations: StakeholderConversation[]`
- Upcast: v1–v4 missing Stakeholder collections → `[]`
- Persistence: existing `simulation_state.authoritative_state` JSONB
- Migration: **none** (no new table)

## 13. Public API and frontend

| Surface | Change |
| --- | --- |
| Stakeholder GET / OpenAPI / client | **None** |
| Stakeholder route / shell nav | **None** |
| Chat UI / composer / optimistic messages | **None** |
| Projection registry `stakeholders` handler | **None** (reserved type only) |
| Mission Control Stakeholder metrics | **None** |

Existing generic command-processing infrastructure may accept Stakeholder
commands; no dedicated Stakeholder REST controller is introduced.

## 14. Boundaries

- **Meetings:** do not rewrite historical Meeting participant snapshots
- **Inbox:** do not change learner-message authority or Inbox projection
- **Decision Log / Mission Control:** no Stakeholder counts or unread chat metrics
- **PS-019:** Stakeholder projection, API, and Workplace UI — see
  `docs/architecture/08-workplace-projection-contracts/07_Stakeholders_Vertical_Slice.md`

## 15. Explicit non-goals (PS-018)

- Stakeholder projection / registry / rebuild / catch-up
- Stakeholder API / OpenAPI / TanStack Query / UI / navigation
- Chat interface, read/delivery receipts, typing, presence
- AI-generated Stakeholder replies
- Trust / influence / sentiment scoring aggregates
- Documents projection/API/UI (PS-020) and later Notifications / Activities /
  Completed History
- Production relay worker (PS-023)
- Unified workplace E2E suite (PS-024)
