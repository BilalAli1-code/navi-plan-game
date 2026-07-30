# BC-006 Phase 5 — Implementation Readiness

## Status
Ready for implementation planning

## Purpose
This document defines the conditions that must be satisfied before the Northstar flagship simulation moves from specification into production implementation.

## Readiness Principles

- GitHub is the source of truth.
- Existing ProjectSim domain and application boundaries must be preserved.
- Business-case content must remain data-driven.
- Case-specific behavior must not be hard-coded into shared engine code.
- Commands, events, consequences, projections, and assessment evidence must be deterministic and traceable.
- PMBOK Guide Eighth Edition alignment must remain explicit and reviewable.

## Implementation Workstreams

### 1. Content Packaging
Prepare authoritative runtime definitions for:

- chapters
- inbox items
- meetings
- documents
- activities
- decisions
- consequences
- stakeholder states
- coaching interventions
- assessment mappings
- endings

All runtime definitions require stable identifiers, schema validation, versioning, and source-document traceability.

### 2. Domain Model
Confirm or implement domain concepts for:

- simulation run
- chapter state
- learner action
- decision submission
- stakeholder relationship
- project-health metric
- scheduled consequence
- assessment evidence
- ending determination

Domain rules must reject invalid transitions and prevent duplicate application.

### 3. Application Services
Application services must coordinate:

- command authorization
- idempotency
- sequencing
- aggregate loading
- command handling
- event persistence
- outbox publication
- projection updates

### 4. Persistence
Persistence readiness requires:

- migrations for new durable state
- tenant-safe row-level security
- transactional writes
- durable idempotency receipts
- event ordering
- outbox support
- replay and rebuild procedures

### 5. Projection Layer
Authoritative projections are required for:

- Mission Control
- Inbox
- Meetings
- Documents
- Activities
- Decision Log
- Stakeholder conversations
- project health
- learning progress
- performance and mastery

No surface may maintain an independent interpretation of decision or completion state.

### 6. API Boundaries
APIs must expose intent-based operations and authoritative read models. They must define:

- request and response contracts
- authentication and authorization
- validation errors
- idempotency behavior
- optimistic concurrency behavior
- versioning
- unavailable and empty semantics

### 7. Learning Services
Learning implementation must support:

- coaching triggers
- feedback timing
- adaptive practice
- mastery evidence
- reflection capture
- experience-level tailoring
- accessible alternatives

AI-generated feedback must remain constrained by authoritative simulation facts.

## Suggested Implementation Sequence

1. define validated content schemas
2. encode Northstar content fixtures
3. implement or extend aggregate state
4. implement decision commands and events
5. implement immediate consequences
6. implement delayed consequence scheduling
7. implement chapter progression and gating
8. implement stakeholder state transitions
9. build authoritative projections
10. connect learner-facing APIs
11. connect UI surfaces
12. implement assessment and coaching services
13. add end-to-end and replay tests
14. perform release validation

## Repository Placement
Implementation should follow the repository's established package boundaries. Content fixtures belong in business-case content modules, while reusable engine behavior belongs in shared domain or application packages.

## Migration and Compatibility

- Existing simulation runs must not be silently reinterpreted by new content versions.
- Runtime definitions must carry a content-version identifier.
- New fields should follow expand-and-contract migration practices.
- Projection rebuilds must support old event versions where required.

## Testing Readiness
Before implementation begins, teams must have:

- test data strategy
- deterministic clock and ID adapters
- fixture-validation tests
- domain unit-test structure
- application integration-test structure
- persistence integration-test structure
- full journey test scenarios

## Observability
Required signals include:

- command acceptance and rejection
- duplicate detection
- event publication failures
- projection lag
- delayed consequence backlog
- chapter-gating failures
- content-validation failures
- assessment-processing failures

## Security and Privacy

- tenant isolation must be verified
- learner input must be treated as untrusted
- sensitive free-text content must follow retention and access rules
- AI services must receive only necessary context
- authorization must be enforced server-side

## Readiness Gates
Implementation may begin when:

- Phase 1–4 documents are complete
- Phase 5 traceability is established
- all canonical IDs are stable
- schemas are agreed
- package ownership is agreed
- unresolved architecture questions are documented
- test strategy is approved

Production release requires additional completion of QA and release-readiness gates.
