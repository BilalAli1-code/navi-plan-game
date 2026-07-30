# BC-006 Phase 5 — Quality Assurance and Test Plan

## Status
Ready for test design

## Purpose
This document defines the quality strategy and test obligations for the Northstar flagship simulation across content, domain behavior, persistence, projections, learning experience, accessibility, security, and release readiness.

## Quality Objectives

- deterministic simulation behavior
- authoritative state consistency
- complete content reachability
- correct chapter progression
- exactly-once consequence application
- fair and explainable assessment
- accessible learner experience
- secure tenant isolation
- resilient persistence and recovery

## Test Levels

### 1. Content Validation Tests
Validate:

- schema conformance
- stable and unique identifiers
- valid cross-references
- chapter assignments
- decision option completeness
- consequence targets
- PMBOK mappings
- experience-level variants
- absence of orphaned artifacts

### 2. Domain Unit Tests
Cover:

- valid command acceptance
- invalid transition rejection
- decision eligibility
- chapter completion
- metric bounds
- stakeholder state transitions
- ending determination
- scheduled consequence creation
- duplicate protection

Domain tests must use deterministic clocks and identifier generators.

### 3. Application Integration Tests
Cover:

- command dispatch
- authorization
- idempotency receipts
- sequencing
- aggregate persistence
- event persistence
- outbox writes
- retry behavior
- concurrent submissions

### 4. Persistence Integration Tests
Validate:

- migrations
- transaction boundaries
- row-level security
- tenant isolation
- optimistic concurrency
- event ordering
- durable idempotency
- projection checkpoints
- outbox relay claims and retries

### 5. Projection Tests
For each projection:

- rebuild from the authoritative event stream
- incremental update
- duplicate event handling
- out-of-order rejection or buffering
- empty-state semantics
- unavailable-state semantics
- consistency with other surfaces

### 6. API Contract Tests
Validate:

- request schemas
- response schemas
- authorization failures
- validation errors
- idempotency behavior
- concurrency conflicts
- version negotiation
- stable error semantics

### 7. User Interface Tests
Cover:

- chapter navigation
- decision submission
- meeting and inbox completion
- document and activity state
- stakeholder conversation continuity
- progress and performance views
- unavailable and loading states
- recovery after refresh or reconnect

### 8. Learning Experience Tests
Validate:

- coaching trigger accuracy
- feedback timing
- experience-level tailoring
- mastery evidence capture
- practice adaptation
- reflection persistence
- assessment fairness
- explanation traceability

### 9. Accessibility Tests
Cover:

- keyboard navigation
- screen-reader semantics
- focus order
- color-independent meaning
- contrast
- reduced-motion behavior
- readable language
- time flexibility
- accessible alternatives for complex interactions

### 10. Security Tests
Validate:

- tenant isolation
- server-side authorization
- input validation
- injection resistance
- sensitive-data minimization
- logging hygiene
- AI context boundaries
- least-privilege service access

### 11. Performance and Reliability Tests
Measure:

- command latency
- projection update latency
- projection rebuild duration
- chapter-load time
- delayed consequence throughput
- outbox backlog recovery
- concurrent-run behavior
- retry storms

### 12. End-to-End Journey Tests
At minimum, maintain:

- one canonical successful path
- one degraded but recoverable path
- one poor-outcome path
- one path for each experience level
- one cross-chapter delayed-consequence path
- one interrupted-and-resumed path
- one deterministic replay path

## Regression Suite
The regression suite must protect:

- canonical IDs
- chapter gates
- decision counts
- completion percentages
- consequence schedules
- stakeholder continuity
- scoring outputs
- ending classifications
- cross-surface state convergence

## Defect Severity

### Critical
Data loss, tenant isolation failure, impossible completion, nondeterministic outcomes, duplicate consequence application, or materially incorrect learner assessment.

### High
Broken required journey, incorrect chapter gating, inconsistent authoritative surfaces, inaccessible required interaction, or unrecoverable command failure.

### Medium
Incorrect optional content, minor scoring discrepancy, degraded coaching, or localized UI inconsistency.

### Low
Cosmetic, copy, or non-blocking usability defect.

## Release Test Gates
Release requires:

- all critical and high defects resolved
- all required journey tests passing
- deterministic replay passing
- traceability coverage complete
- accessibility acceptance met
- security validation complete
- migration and rollback rehearsal complete
- observability confirmed

## Test Evidence
Each release candidate must retain:

- test-run identifiers
- commit SHA
- content version
- environment
- execution timestamp
- pass/fail summary
- defect references
- approved waivers
