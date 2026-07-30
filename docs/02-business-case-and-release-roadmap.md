# ProjectSim 2.0 — Business Case and Release Roadmap

**Document ID:** BC-ROADMAP-001  
**Version:** 1.0  
**Status:** Active  
**Location:** `docs/02-business-case-and-release-roadmap.md`

---

## 1. Purpose

This roadmap defines the work that begins after the ProjectSim 2.0 platform sequence, PS-001 through PS-024.

The next work must not be named PS-025. It starts a separate Business Case and Release Roadmap using the prefixes `BC`, `REL`, and `PILOT`.

The governing sequence is:

```text
PS-001 through PS-024
Platform complete
        ↓
BC-001 through BC-008
Business case design, content, implementation, validation, and refinement
        ↓
REL-001
Production readiness certification
        ↓
PILOT-001 and PILOT-002
Controlled learner pilot and revisions
        ↓
REL-002
Version 1 release
```

GitHub remains the permanent source of truth. Cursor is used for engineering and content integration. Lovable is used for learner-facing experience refinement. All accepted changes must return to GitHub.

---

## 2. Non-Negotiable Rules

1. Do not create PS-025 for this work.
2. Keep business case content data-driven rather than hardcoded into React components.
3. GitHub is the canonical source for requirements, content, acceptance criteria, and version history.
4. Cursor implements schemas, loaders, validation, APIs, migrations, and tests.
5. Lovable refines presentation and learner experience but does not become a source of truth.
6. Complete and validate Chapter One before implementing the remaining chapters.
7. Preserve the authoritative command, transactional outbox, relay, projection, API, and Workplace path.
8. Keep deterministic simulation rules separate from AI-generated dialogue or coaching.
9. Validate educational quality and narrative coherence, not only technical correctness.
10. Fix software, content, usability, and assessment defects before expanding scope with new features.

---

# BC-001 — ProjectSim Flagship Business Case Simulation Design Blueprint

## Objective

Define the educational and narrative design for the flagship business case.

## Required Content

- target learner
- learning objectives
- learner role
- scenario duration
- chapters
- success conditions
- failure conditions
- assessment strategy
- expected decisions
- intended trade-offs

## Primary Tool

GitHub.

## Deliverable

Store the approved Simulation Design Blueprint as a canonical design document under `docs/business-cases/` and link it from the applicable documentation index.

## Definition of Done

- The target learner is explicit.
- Learning objectives are measurable.
- The learner role, authority, constraints, and information boundaries are defined.
- Scenario duration and expected workload are defined.
- The chapter structure is sufficient to guide BC-002 and BC-004.
- Success and failure conditions are explicit.
- Assessment measures and timing are defined.
- Expected decisions and intended trade-offs are documented.
- The blueprint does not require case-specific logic in shared platform code.
- The document is reviewed and approved in GitHub.

---

# BC-002 — ProjectSim Flagship Business Case Content Bible

## Objective

Define the complete business world and make it the source of truth for the case.

## Required Content

- company background
- market conditions
- central business problem
- financial context
- stakeholders
- stakeholder motivations
- relationships
- meetings
- Inbox content
- documents
- notifications
- activities
- decisions
- consequences
- crisis events
- endings

## Primary Tool

GitHub.

## Definition of Done

- All content follows the approved BC-001 blueprint.
- The business world is internally coherent.
- Stakeholder motivations and relationships are explicit.
- The timeline, financial context, and evidence are consistent.
- Every decision has sufficient evidence, intended trade-offs, and defined consequences.
- Hidden information and learner-visible information are clearly separated.
- The Content Bible is approved as the canonical source for implementation.

---

# BC-003 — Business Case Content Schema and Validation

## Objective

Ensure the business case can be represented safely, consistently, and versionably in the application.

## Required Work

- content schemas
- validation rules
- stable identifiers
- chapter definitions
- stakeholder definitions
- decision definitions
- consequence definitions
- document definitions
- content versioning
- validation tests

## Primary Tool

Cursor.

## Architecture Rule

The business case must be data-driven rather than hardcoded into React components.

## Definition of Done

- Schemas cover all required content types.
- References use stable identifiers.
- Validation detects missing, duplicate, invalid, and circular references where applicable.
- Content versions can be loaded and validated safely.
- Automated validation tests cover valid and invalid fixtures.
- Shared UI and platform code contain no flagship-case-specific rules.

---

# BC-004 — Implement Complete Chapter One Vertical Slice

## Objective

Build one complete chapter before writing and implementing the full case.

## Required Slice

- initial Workplace state
- stakeholders
- Inbox messages
- one or more documents
- a meeting
- a meaningful learner decision
- consequences
- an Activity
- Activity completion
- a Decision Log entry
- a chapter ending

## Tools

- GitHub for the specification
- Cursor for implementation and tests
- Lovable for learner-facing presentation

## Definition of Done

- Chapter One runs through all required layers.
- The learner receives sufficient evidence before the decision.
- The decision creates deterministic, visible consequences.
- Related activities and logs update consistently.
- The chapter ending is reached only through authoritative state.
- Automated tests cover the vertical slice.

---

# BC-005 — Chapter One Validation

## Objective

Run Chapter One through the complete production path.

## Required Production Path

```text
Authoritative command
→ Transactional outbox
→ Relay worker
→ Projections
→ APIs
→ Workplace
```

## Validate

- narrative coherence
- stakeholder responses
- decision consequences
- timing
- learner comprehension
- no duplicate content
- correct ordering
- accessibility
- responsive behavior

## Definition of Done

- The full path passes under normal, retry, refresh, and replay conditions.
- No content appears twice or out of order.
- Stakeholder responses match current state and information boundaries.
- Learners can understand the situation and available decision evidence.
- Accessibility and responsive checks pass.
- Blocking defects are resolved before BC-006 begins.

---

# BC-006 — Complete Flagship Business Case

## Objective

Implement the remaining chapters after Chapter One is proven.

## Illustrative Structure

- Chapter 1 — Orientation and initial problem
- Chapter 2 — Investigation and stakeholder tension
- Chapter 3 — Strategic decision
- Chapter 4 — Crisis or unexpected consequence
- Chapter 5 — Recovery and final recommendation
- Chapter 6 — Outcome and reflection

The exact structure must come from the approved Simulation Design Blueprint.

## Definition of Done

- Every approved chapter is implemented.
- Content loads from validated structured definitions.
- Decisions, consequences, activities, and endings follow the Content Bible.
- Cross-chapter state and stakeholder behavior remain consistent.
- The complete case is playable end to end.

---

# BC-007 — Content Quality Review

## Objective

Review the complete case for educational, narrative, and business quality.

## Review Areas

- internal consistency
- realistic business logic
- timeline consistency
- financial consistency
- stakeholder consistency
- duplicate information
- hidden-information boundaries
- decision fairness
- consequence clarity
- learner workload
- assessment validity

## Definition of Done

- All blocking content defects are resolved.
- Timeline, financial, stakeholder, and decision logic reconcile.
- Learners receive fair evidence without unintended spoilers.
- Workload matches the blueprint.
- Assessment results are supported by observable learner behavior.

---

# BC-008 — Lovable Experience Refinement

## Objective

Refine the learner-facing experience after the content works structurally.

## Focus Areas

- readability
- information hierarchy
- narrative pacing
- document presentation
- stakeholder presentation
- decision presentation
- urgency cues
- mobile behavior
- learner guidance

## Lovable Boundary

Lovable must not become the source of truth. Every accepted Lovable change must be committed back to GitHub and reviewed against the approved content and architecture.

## Definition of Done

- The experience presents approved content clearly without altering its meaning.
- Responsive and accessibility requirements pass.
- Urgency and guidance are understandable without revealing hidden information.
- Accepted changes are present in GitHub.

---

# REL-001 — Production Readiness Certification

## Objective

Certify the complete business case and supporting platform for controlled production use.

## Validate

- clean deployment
- migrations
- environment configuration
- secrets
- backup and restoration
- rollback
- API startup
- relay startup
- health checks
- readiness checks
- logging
- monitoring
- accessibility
- security
- row-level security
- operational runbooks

## Definition of Done

- Production-readiness evidence is documented.
- Deployment and rollback are verified.
- Backup and restoration are tested.
- APIs and workers pass health and readiness checks.
- Security and RLS tests pass.
- Operational runbooks are complete.

---

# PILOT-001 — Controlled Learner Pilot

## Objective

Run the complete simulation with a small, controlled learner group.

## Measure

- where learners become confused
- whether decisions feel meaningful
- whether consequences are understandable
- whether the Workplace becomes overwhelming
- whether documents provide sufficient evidence
- whether stakeholders behave believably
- completion time
- technical failures
- accessibility problems

## Definition of Done

- Pilot participants and conditions are documented.
- Observations and metrics are captured consistently.
- Findings are specific enough to classify and act on.
- No uncontrolled production rollout occurs before review.

---

# PILOT-002 — Pilot Revisions

## Objective

Classify and resolve pilot findings without allowing uncontrolled feature expansion.

## Finding Categories

- software defects
- content defects
- usability problems
- assessment problems
- genuinely new feature requests

## Priority Rule

Fix defects first. Do not turn every piece of pilot feedback into a feature.

## Definition of Done

- Every finding is classified.
- Blocking and high-priority defects are resolved.
- Deferred feature requests are separated from release blockers.
- Revised content and code pass applicable validation again.

---

# REL-002 — Version 1 Release

## Objective

Release ProjectSim 2.0 Version 1 after pilot revisions are complete.

## Required Work

- rerun convergence testing
- rerun production-readiness testing
- finalize documentation
- tag the release
- deploy the release
- monitor the first production runs

## Definition of Done

- Required convergence and production-readiness tests pass.
- Release documentation is finalized.
- The release is tagged and deployed.
- Initial production runs are monitored.
- Critical release issues have an owner and response plan.

---

## 3. Three-Tool Workflow

### GitHub — Source of Truth

Use GitHub for:

- roadmap issues
- requirements
- architecture
- Simulation Design Blueprint
- Business Case Content Bible
- acceptance criteria
- content reviews
- pull requests
- version history

### Cursor — Engineering and Content Integration

Use Cursor for:

- backend implementation
- content schemas
- content loaders
- validation
- seed and import tooling
- automated tests
- API integration
- production fixes

### Lovable — Learner Experience

Use Lovable for:

- UI refinement
- visual hierarchy
- page composition
- responsive layouts
- content presentation
- learner experience improvements

All accepted Lovable changes must be committed back into GitHub.

---

## 4. Immediate Next Sequence

Execute in this order:

1. BC-001 — ProjectSim Flagship Business Case Simulation Design Blueprint
2. BC-002 — ProjectSim Flagship Business Case Content Bible
3. BC-003 — Business Case Content Schema and Validation
4. BC-004 — Implement Complete Chapter One Vertical Slice

BC-001 is the immediate next work item. BC-002 must derive from the approved blueprint. BC-003 must provide the safe data-driven representation. BC-004 must prove one complete chapter before the full case is implemented.

---

## 5. Approval and Change Control

This roadmap is canonical when it is:

- committed to GitHub
- linked from `docs/00-projectsim-2.0-master-index.md`
- represented by the BC-001 GitHub issue
- reviewed and merged into `main`

Changes to the sequence or identifier system require an explicit roadmap revision. The next item must not be renamed PS-025 unless this roadmap is formally revised.