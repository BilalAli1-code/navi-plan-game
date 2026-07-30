# Authoritative Document Model

**Document ID:** PS-DOM-020  
**Status:** Implemented  
**Roadmap item:** PS-ROADMAP-020  
**Prerequisite:** merged PS-ROADMAP-019  
**Owner aggregate:** SimulationRun / SimulationState

---

## 1. Purpose

PS-020 establishes learner-visible Documents as authoritative runtime facts on
SimulationRun. It provides the write-side model needed by the Documents
projection, API, and Workplace UI without introducing a separate Document
aggregate.

## 2. Authoritative owner

- **Owner:** SimulationRun (`SimulationState.documents`)
- **Not a projection:** runtime Documents are write-model facts, not
  `documents` projection rows
- **No second write model:** no Document repository, no Document-specific table,
  no Document-specific outbox
- **Persistence:** existing JSONB simulation state; no migration

## 3. Runtime identity and idempotency

```text
documentId  (one runtime Document per DocumentId per SimulationRun)
```

- Deterministic and immutable after initialization
- Duplicate-identical initialization -> accepted no-op, no second Document / no
  `DocumentInitialized`
- Conflicting initialization -> `DOCUMENT_IDENTITY_CONFLICT`
- Consequence-derived identity helper:
  `document:consequence:{consequenceId}`

## 4. Learner-safe content

Documents store an immutable plain-text snapshot:

- `title`
- `category` / `description` (optional)
- `body`
- `contentType: "plain_text"`
- definition id/version
- `creationSequence`, `createdAt`, `originatingCommandId`

Rejected from learner-visible fields: markup (`<`, `>`). No markdown or HTML
renderer is part of the authoritative model.

## 5. Lifecycle (v1)

Documents are `available` only in PS-020. Archive, edit, comment, upload, and AI
author display are later-slice concerns and are not represented in the runtime
model.

## 6. Commands and events

Every accepted `InitializeDocument` command emits `SimulationActionAccepted`.

| Command | Authoritative transition | Dedicated events | Duplicate behavior |
| --- | --- | --- | --- |
| `InitializeDocument` | Append runtime Document | `DocumentInitialized` | Identical -> no-op Domain event; conflict -> typed error |

`UploadArtifact` remains separate and is not a Documents command in PS-020.

## 7. State schema

- Previous: SimulationState schema version **5**
- Current: SimulationState schema version **6**
- Field: `documents: DocumentRuntime[]`
- Upcast: v1-v5 missing Documents collection -> `[]`
- Malformed Document state fails closed on rehydration

## 8. Boundaries

- **Stakeholders / Meetings / Inbox / Mission Control:** authority unchanged
- **Projection:** learner-facing Documents is derived from
  `SimulationState.documents`
- **Public API:** no public Document mutation endpoint
- **PS-021+:** Notifications, Activities, Completed History, upload/edit/comment
  behavior, and document archiving remain out of scope
