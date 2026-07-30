# BC-006 — Simulation Engine Validation

Status: Draft for implementation
Phase: 3 — Simulation Engine
Business case: Northstar Flagship Simulation

## 1. Purpose

This document defines the validation strategy, invariants, test obligations, and acceptance criteria for the Northstar simulation engine specification.

## 2. Validation objectives

The engine must demonstrate:

- deterministic execution
- exactly-once consequence application
- authoritative state consistency
- chapter-gating correctness
- cross-surface projection convergence
- replay and rebuild equivalence
- stakeholder continuity
- metric traceability
- failure safety
- content-to-runtime completeness

## 3. Validation layers

### Definition validation

Checks static content and configuration before runtime.

### Domain validation

Checks aggregate invariants and pure transition behavior.

### Application validation

Checks command handling, authorization, idempotency, persistence, and event publication.

### Projection validation

Checks all learner and administrative surfaces derive consistent views.

### End-to-end validation

Checks full six-chapter paths, branching, recovery, and endings.

## 4. Definition completeness checks

Validation must confirm:

- every Phase 1 catalog item has a stable unique ID
- every required item maps to a chapter requirement
- every decision maps to Phase 2 options, scoring, and consequences
- every delayed consequence has a schedule definition
- every trigger target exists
- every stakeholder reference exists
- every metric key is canonical
- every ending rule references valid evidence
- no unbounded trigger or consequence cycles exist

## 5. State invariants

Automated tests must enforce:

1. exactly one active chapter per active run
2. completed chapters cannot become active again
3. a decision resolves at most once
4. a consequence applies at most once
5. metric values remain within bounds
6. one authoritative ending per completed run
7. informational content is never counted as a decision
8. archiving never deletes history
9. aggregate sequence increases monotonically
10. aggregate version increases on every mutation

## 6. Determinism tests

Given identical:

- business-case definition version
- initial state
- experience level
- ordered command stream
- seeded random source

The engine must produce identical:

- event types and ordering
- authoritative final state
- scheduled consequence ledger
- metric history
- stakeholder history
- chapter progress
- ending profile

Generated technical IDs and timestamps may be normalized for comparison.

## 7. Idempotency tests

Test duplicate submission of:

- start-run commands
- decision submissions
- activity completion
- meeting completion
- document submission
- stakeholder interactions
- consequence application workers

Expected result:

- one authoritative effect
- stable prior receipt returned
- no duplicate metric adjustment
- no duplicate content release
- no duplicate learning evidence

## 8. Chapter-gating tests

For every chapter:

- entry fails before prerequisites
- entry succeeds after prerequisites
- progress denominator includes only applicable required items
- incomplete required decisions block completion
- incomplete required meetings, documents, activities, reflections, or recovery actions block completion
- optional items do not block completion
- chapter completion unlocks only the correct next chapter

## 9. Cross-surface convergence tests

Mission Control, chapter dashboard, Inbox, Meetings, Documents, Stakeholder Chat, Decision Log, Performance, and Progress must agree on:

- pending decision count
- completed decision count
- requirement completion
- chapter progress
- archived status
- current metric values
- stakeholder conversation history

Each surface must read from the authoritative projection model, not maintain competing counts.

## 10. Delayed consequence tests

Cover:

- same-chapter delayed effects
- chapter-entry effects
- chapter-exit effects
- metric-threshold effects
- conditional cancellation
- supersession
- chained effects
- reload before application
- concurrent worker attempts
- retry after failure

Every test must prove exactly-once application and complete provenance.

## 11. Stakeholder behavior tests

Validate:

- chapter-specific message release
- trust and confidence adjustments
- unresolved concern persistence
- conversation history after decision completion
- escalation behavior
- coalition activation
- story-arc branching
- deterministic reactions for identical state

## 12. Metric tests

Validate:

- bounded values
- inverse risk normalization
- explicit secondary effects
- threshold crossing behavior
- critical overrides
- trend derivation
- composite-health reproducibility
- separation of project health from learner score

## 13. Replay and rebuild tests

The test suite must:

1. execute a run and persist events
2. discard current aggregate and projections
3. replay events in sequence
4. rebuild all projections
5. compare rebuilt state and views with the originals

Equivalent state is required across all authoritative fields and learner-visible projections.

## 14. Concurrency tests

Test simultaneous or stale commands for:

- competing decision submissions
- duplicate completion actions
- parallel consequence workers
- chapter completion versus late content completion

Expected behavior:

- optimistic or row-level concurrency control prevents lost updates
- one valid transition commits
- rejected commands return actionable conflict information

## 15. Failure and recovery tests

Inject failures during:

- event persistence
- outbox write
- projection update
- consequence application
- chapter transition

Verify:

- authoritative transactions remain atomic
- retries are safe
- outbox relay resumes delivery
- projection rebuild restores convergence
- failures do not fabricate learner completion

## 16. Experience-level tests

Explorer, Practitioner, and Leader runs must validate:

- correct applicable requirement set
- correct guidance and complexity
- comparable core outcomes
- valid level-specific branches
- no missing content references

## 17. Full-path scenarios

At minimum, execute:

- strong governance and high-trust path
- schedule-first path with later quality pressure
- weak stakeholder path with recovery
- compliance-escalation path
- vendor disruption path
- team-sustainability recovery path
- mixed-performance path
- every authoritative ending profile

## 18. Property-based testing candidates

Generate command sequences to verify:

- metrics never leave bounds
- sequences remain monotonic
- terminal states remain terminal
- no duplicate application IDs
- no chapter skipping
- projections never report more completed requirements than exist

## 19. Traceability matrix

Maintain traceability from:

```text
Phase 1 catalog item
  -> Phase 2 decision or consequence
  -> Phase 3 state field
  -> event and trigger
  -> projection
  -> automated test
```

Any unmapped mandatory content is a validation failure.

## 20. Phase 3 acceptance criteria

Phase 3 is complete when:

- all seven engine documents are approved
- all Phase 1 and Phase 2 entities are mapped to runtime behavior
- determinism and idempotency rules are implementation-ready
- chapter gating is fully specified
- metrics and stakeholder state have explicit provenance
- delayed consequences have exactly-once semantics
- validation coverage includes all six chapters and endings
- no unresolved contradiction remains between narrative, decision, and engine specifications

## 21. Implementation readiness checklist

- [ ] Canonical TypeScript contracts identified
- [ ] Domain events versioned
- [ ] Trigger definitions versioned
- [ ] State invariants converted to tests
- [ ] Projection contracts identified
- [ ] Persistence obligations identified
- [ ] Outbox and worker behavior identified
- [ ] Replay strategy identified
- [ ] Concurrency behavior identified
- [ ] End-to-end fixtures identified
- [ ] Traceability matrix complete
