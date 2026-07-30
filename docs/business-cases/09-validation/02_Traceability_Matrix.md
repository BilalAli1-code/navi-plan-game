# BC-006 Phase 5 — Traceability Matrix

## Status
Ready for population and validation

## Purpose
This document defines the authoritative traceability model for the Northstar flagship simulation. It ensures that every authored requirement is connected to narrative content, decision behavior, engine rules, learning outcomes, tests, and implementation artifacts.

## Traceability Dimensions
Each traceable item must map across the following dimensions:

1. requirement identifier
2. business-case phase
3. chapter
4. source document
5. learner-facing artifact
6. decision or action
7. command
8. event
9. consequence
10. projection or UI surface
11. PMBOK Guide Eighth Edition alignment
12. assessment evidence
13. implementation owner
14. validation test
15. release status

## Required Source Sets

### Phase 1 — Narrative
- simulation blueprint
- chapter narratives
- stakeholder story arcs
- project timeline
- meeting catalog
- inbox catalog
- document catalog
- activity catalog
- PMBOK mapping
- narrative validation

### Phase 2 — Decision System
- decision catalog
- consequence catalog
- outcome and ending model
- scoring and assessment
- decision validation

### Phase 3 — Simulation Engine
- simulation state model
- event and trigger model
- chapter progression and gating
- metric and project-health model
- stakeholder state and behavior
- delayed consequences and scheduling
- simulation-engine validation

### Phase 4 — Learning Experience
- learning journey model
- coaching and feedback model
- practice and assessment experience
- progression experience
- performance and reflection
- accessibility and learning support
- learning-experience validation

## Canonical Matrix Fields

| Field | Description |
|---|---|
| Trace ID | Stable identifier for the trace record |
| Requirement | Concise requirement statement |
| Source | Authoritative specification file |
| Chapter | Applicable chapter or cross-chapter scope |
| Artifact ID | Meeting, inbox, document, activity, or decision identifier |
| Runtime Rule | State, trigger, gating, metric, or consequence rule |
| PMBOK Alignment | Principle, performance domain, or competency |
| Assessment Evidence | Observable evidence captured from learner behavior |
| Implementation Target | Package, module, service, projection, or UI surface |
| Test ID | Automated or manual validation identifier |
| Status | Planned, implemented, verified, blocked, or waived |

## Minimum Traceability Rules

- Every required narrative artifact must map to at least one trigger and one learner-facing surface.
- Every decision must map to an eligibility rule, accepted command, emitted event, consequence set, assessment rule, and test.
- Every delayed consequence must map to a scheduling rule and an eventual activation or cancellation condition.
- Every chapter-completion requirement must map to authoritative state and an automated validation test.
- Every PMBOK learning objective must map to observable learner evidence.
- Every projection must map to an authoritative source of state.
- Every release criterion must map to one or more executable tests or documented review procedures.

## Orphan Detection
The matrix must identify and block:

- content with no trigger
- decisions with no consequences
- consequences with no source decision or rule
- metrics that cannot change
- learning objectives with no assessment evidence
- UI surfaces that derive conflicting state
- tests that do not trace to a requirement
- requirements that have no implementation owner

## Coverage Reporting
Coverage reports must include:

- requirements traced
- requirements implemented
- requirements verified
- orphaned artifacts
- missing tests
- missing PMBOK mappings
- unresolved release blockers

## Change Control
When a source specification changes:

1. identify all affected trace records
2. update implementation obligations
3. update tests
4. update release status
5. preserve prior-version history

## Acceptance Criteria
The traceability matrix is complete when:

- all Phase 1–4 documents are represented
- all canonical artifacts have stable IDs
- all decision and consequence chains are traceable
- all learning objectives have assessment evidence
- all release gates have validation coverage
- no unresolved orphaned item remains
