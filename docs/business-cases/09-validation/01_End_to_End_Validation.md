# BC-006 Phase 5 — End-to-End Validation

## Status
Executed via Workstream 7 (`07_Workstream_7_Validation_Matrix.md`)

## Purpose
This document defines the end-to-end validation required to confirm that the Northstar flagship simulation operates as one coherent learner experience from Chapter 1 through Chapter 6.

## Validation Scope
The validation must cover:

- chapter entry and exit
- inbox items
- meetings
- documents
- activities
- decisions
- immediate consequences
- delayed consequences
- stakeholder reactions
- project-health metrics
- learner coaching
- assessment evidence
- completion outcomes
- replay and rebuild behavior

## Core Validation Principle
Every learner-visible outcome must be traceable to authoritative simulation state and every authoritative state transition must be explainable by an accepted command, emitted event, scheduled consequence, or deterministic chapter rule.

## End-to-End Journey

### Chapter 1
Validate that the learner can:

- enter the simulation with the correct business-case context
- receive the required opening content
- complete mandatory activities
- access eligible decisions only
- generate the expected state changes
- satisfy chapter-completion rules without skipping required work

### Chapter 2
Validate:

- continuity from Chapter 1
- stakeholder memory
- consequence carryover
- correct activation of chapter-specific inbox, meeting, and document content
- project-health changes based on prior choices

### Chapter 3
Validate:

- cumulative decision effects
- escalating complexity
- delayed consequence activation
- metric interactions
- adaptive coaching behavior

### Chapter 4
Validate:

- governance pressure
- cross-functional stakeholder reactions
- risk and issue propagation
- conditional branching
- recovery paths

### Chapter 5
Validate:

- late-stage delivery pressure
- value and benefits tradeoffs
- unresolved consequence handling
- completion gating
- final-outcome preparation

### Chapter 6
Validate:

- closing activities
- outcome determination
- learner-performance summary
- competency evidence
- reflection
- final simulation ending

## Reachability Validation
Every authored artifact must be classified as:

- required and reachable
- optional and reachable
- conditional and reachable
- intentionally unreachable in a specific experience mode

No orphaned content is permitted.

## Decision Validation
For every decision:

- trigger exists
- eligibility is deterministic
- all options are defined
- evidence requirements are explicit
- immediate consequences are defined
- delayed consequences are scheduled correctly
- metric changes are bounded
- stakeholder effects are traceable
- assessment evidence is captured
- duplicate submission is rejected or safely ignored

## Consequence Validation

- consequences execute exactly once
- canceled consequences do not fire
- superseded consequences are traceable
- cross-chapter consequences activate in the correct chapter
- replay reproduces the same outcome

## Cross-Surface Consistency
Mission Control, Inbox, Meetings, Documents, Activity views, Decision Log, Performance, and learner-progress surfaces must reflect the same authoritative state.

## Experience-Level Validation
Explorer, Practitioner, and Leader modes must differ only through approved tailoring rules such as:

- guidance depth
- evidence expectations
- ambiguity
- decision complexity
- coaching frequency

They must not alter core narrative integrity or authoritative outcome rules unless explicitly specified.

## Failure and Recovery
Validate:

- invalid commands
- duplicate commands
- unavailable decisions
- missing prerequisites
- out-of-order events
- projection rebuilds
- interrupted sessions
- resumed sessions
- retry behavior

## Exit Criteria
This validation passes only when:

- all six chapters are completable
- no required content is orphaned
- all decisions and consequences are traceable
- all learner-facing surfaces converge
- deterministic replay succeeds
- all release-blocking defects are resolved
