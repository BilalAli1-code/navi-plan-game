# ProjectSim 2.0 Implementation Roadmap

**Document ID:** PS-ROADMAP-001  
**Version:** 1.0  
**Status:** Ready for implementation  
**Location:** `docs/01-projectsim-2.0-implementation-roadmap.md`

---

## 1. Purpose

This roadmap converts the eight completed ProjectSim 2.0 deliverables into an ordered implementation plan for GitHub, Cursor, Lovable, and Supabase.

The eight source deliverables are:

1. Product Strategy and Scope
2. Domain Model
3. System Architecture
4. Database Architecture
5. API Architecture
6. AI Architecture
7. UI Architecture
8. Engineering Handbook

GitHub is the permanent source of truth. Cursor is used for code and tests. Lovable is used for UI implementation and visual refinement. Supabase provides the database and backend services.

---

## 2. Non-Negotiable Rules

1. Maintain one authoritative simulation state.
2. Process learner actions through one command pipeline.
3. Calculate progress in one place.
4. Do not place business logic in UI components.
5. Do not allow AI to modify authoritative state.
6. Persist every important learner action.
7. Make important state changes auditable.
8. Keep business cases content-driven.
9. Avoid case-specific logic in shared platform code.
10. Include automated tests with every implementation slice.

---

## 3. Delivery Method

ProjectSim 2.0 will be built through **vertical slices**.

A vertical slice is one complete feature implemented through every required layer:

- user interface
- API
- application service
- domain logic
- database
- projections
- analytics
- AI integration, when applicable
- automated tests

A feature is not complete when only its UI or database exists.

---

# Milestone 0 — Repository Baseline

## Objective

Prepare the repository for controlled implementation.

## Required Work

- Confirm all eight deliverables are under `docs/`.
- Confirm `docs/00-projectsim-2.0-master-index.md` links to every deliverable.
- Add this implementation roadmap.
- Confirm the repository opens and runs in Cursor.
- Confirm Lovable is connected to the correct GitHub repository.
- Confirm Supabase configuration and environment variables.
- Confirm package-manager and workspace configuration.
- Establish branch, pull-request, and review standards.
- Create GitHub milestones and the first implementation issues.

## Definition of Done

- Documentation is discoverable.
- The repository builds locally.
- Tests can be executed.
- Environment variables are documented.
- GitHub, Cursor, Lovable, and Supabase are connected.
- No architecture document remains outside the repository.

---

# Milestone 1 — Authoritative Simulation State

## Objective

Create the single source of truth for simulation runs, learner actions, decisions, consequences, events, and progress.

## Core Capabilities

- simulation-run creation and resume
- learner-action recording
- decision submission
- decision consequence processing
- project-metric updates
- day and chapter progression
- event eligibility and completion
- projection generation
- idempotent command processing
- audit history

## First Vertical Slice — Complete Decision Lifecycle

Implement this flow:

1. A simulation event introduces a decision.
2. The decision appears once in authoritative state.
3. The learner selects an option.
4. The client submits one decision command.
5. The server validates eligibility.
6. The response is persisted.
7. Deterministic consequences are applied.
8. Project metrics are updated.
9. Learning effects are recorded.
10. Stakeholder effects are recorded.
11. Related activities are completed.
12. New eligible events are triggered.
13. The simulation projection is regenerated.
14. Every relevant UI view shows the same result.
15. Automated tests verify the full flow.

## Definition of Done

- A decision cannot be submitted twice.
- Retries do not apply duplicate consequences.
- Refreshing the browser preserves state.
- Mission Control and Decision Log show the same status.
- Progress comes from authoritative actions.
- Integration tests pass.

---

# Milestone 2 — Unified Workplace Experience

## Objective

Build one synchronized simulation workplace.

## Core Capabilities

- Mission Control
- Inbox
- Meetings
- Stakeholder Chat
- Decision Log
- Documents
- Notifications
- Activity history
- Completed-item history

## Contracts gate

Before implementing workplace product slices, accept and follow:

- `docs/architecture/08-workplace-projection-contracts/`
- `docs/adr/ADR-006-cqrs-style-projection-architecture.md` (PS-ROADMAP-009)

These define the shared projection envelope, taxonomy, convergence rules, and
non-goals. They do not themselves implement workplace features or APIs.

## Definition of Done

- All workplace views consume shared projections.
- Completing one action updates every related view.
- Completed items remain available in history.
- Duplicate activities and decisions do not appear.
- Refreshing and reopening preserve the same state.
- Responsive behavior works on supported screen sizes.
- Unified Workplace Convergence Suite (PS-ROADMAP-024) validates the full
  Domain → outbox → relay → projections → APIs → Workplace path under
  duplicate/retry/rebuild/replay/RLS/browser conditions. See
  `docs/architecture/08-workplace-projection-contracts/12_Unified_Workplace_Convergence_Suite.md`.

---

# Milestone 3 — Learning and Assessment

## Objective

Connect learner behavior to measurable learning outcomes.

## Core Capabilities

- competency mappings
- PMBOK-domain mappings
- mastery tracking
- decision-quality scoring
- communication scoring
- reflections
- practice questions
- performance summaries
- exam-readiness indicators

## Definition of Done

- Scored activities use approved rubrics.
- Mastery is updated through the learning service.
- UI components do not calculate mastery.
- Learners can see strengths, gaps, and progress.
- Assessments reflect actual simulation behavior.

---

# Milestone 4 — AI Experience

## Objective

Add controlled AI coaching and stakeholder interactions.

## Core Capabilities

- Maya AI Mentor
- stakeholder persona conversations
- Program Director briefings
- decision explanations
- reflection feedback
- adaptive coaching
- structured memory
- prompt guardrails
- AI monitoring and failure handling

## AI Rules

- AI may explain authoritative state.
- AI may generate coaching and dialogue.
- AI may not create or alter scores.
- AI may not unlock content.
- AI may not overwrite simulation state.
- AI must use approved context.
- AI failures must not corrupt the simulation.

## Definition of Done

- Stakeholders remain in role.
- AI does not reveal hidden facts.
- Structured memory is used.
- Responses reflect current simulation context.
- Failed AI calls are recoverable.
- AI behavior tests pass.

---

# Milestone 5 — Business Case and Content System

## Objective

Make the platform reusable across multiple business cases.

## Core Capabilities

- business-case schemas
- chapter definitions
- event definitions
- stakeholder definitions
- decision definitions
- consequence rules
- content validation
- content versioning
- content publishing
- Content Bible alignment
- seed and migration workflow

## Definition of Done

- The first business case is playable end to end.
- Content loads from structured definitions.
- Shared components contain no case-specific logic.
- Validation catches missing or broken references.
- Content versions can be published safely.
- A second case can reuse the same engine.

---

# Milestone 6 — Analytics and Reporting

## Objective

Create reporting from authoritative simulation history.

## Core Capabilities

- learner-progress reports
- project-performance reports
- competency reports
- decision-quality reports
- communication analytics
- stakeholder analytics
- executive review
- instructor reporting
- export-ready reporting models

## Definition of Done

- Reports are derived from persisted actions and projections.
- Analytics do not become operational state.
- Metrics are reproducible.
- Learner and instructor views use consistent definitions.

---

# Milestone 7 — Production Readiness

## Objective

Prepare ProjectSim 2.0 for controlled release.

## Core Capabilities

- security review
- row-level security
- authorization tests
- performance testing
- accessibility testing
- logging and error monitoring
- backup and recovery
- migration safety
- CI/CD
- release and rollback procedures
- operational runbooks

## Definition of Done

- Critical tests pass in CI.
- Production environments are documented.
- Secrets are protected.
- Backup and recovery are tested.
- Release and rollback procedures are verified.
- Production monitoring is active.

---

## 4. GitHub Milestones

Create these milestones:

1. `M0 — Repository Baseline`
2. `M1 — Authoritative Simulation State`
3. `M2 — Unified Workplace Experience`
4. `M3 — Learning and Assessment`
5. `M4 — AI Experience`
6. `M5 — Content System`
7. `M6 — Analytics and Reporting`
8. `M7 — Production Readiness`

---

## 5. Initial GitHub Issues

Create these issues first:

1. `Validate ProjectSim 2.0 Repository Baseline`
2. `Define Canonical Simulation Action Contract`
3. `Implement Simulation Run Persistence`
4. `Implement Decision Submission Command`
5. `Apply Decision Consequences Exactly Once`
6. `Generate Authoritative Simulation Projection`
7. `Connect Decision UI to Authoritative API`
8. `Add End-to-End Decision Lifecycle Tests`

---

## 6. Branch Strategy

Use one branch per issue or vertical slice.

Examples:

```text
docs/ps-001-implementation-roadmap
feature/ps-002-simulation-action-contract
feature/ps-003-simulation-run-persistence
feature/ps-004-decision-submission
feature/ps-005-decision-consequences
feature/ps-006-simulation-projection
feature/ps-007-decision-ui
test/ps-008-decision-lifecycle
```

Do not implement directly on `main`.

---

## 7. Cursor Responsibilities

Cursor is used to:

- read the applicable architecture documents
- implement domain and application logic
- implement APIs and database integration
- create database migrations
- create and update tests
- refactor duplicate logic
- run validation before pull requests

Every Cursor task must reference:

- the GitHub issue
- applicable architecture documents
- acceptance criteria
- files allowed to change
- tests required

---

## 8. Lovable Responsibilities

Lovable is used for:

- UI composition
- responsive layouts
- design-system application
- component visual states
- accessibility
- interaction and feedback design

Lovable must not:

- create another source of truth
- calculate simulation progress
- apply decision consequences
- update authoritative scores directly
- bypass approved APIs
- overwrite architecture documents

All Lovable work must return to GitHub for review.

---

## 9. Pull Request Requirements

Every pull request must include:

- linked GitHub issue
- implementation summary
- architecture documents referenced
- files changed
- migration notes, when applicable
- screenshots for UI changes
- tests added or updated
- manual validation steps
- known limitations
- confirmation that no duplicate source of truth was introduced

---

## 10. Definition of Done for a Vertical Slice

A vertical slice is complete only when:

- acceptance criteria are met
- domain rules are enforced
- state is persisted
- API behavior is defined
- UI uses authoritative projections
- loading and error states exist
- permissions are enforced
- tests pass
- documentation is updated
- code review is complete
- the branch is merged into `main`

---

## 11. Immediate Next Action

1. Add this file to:

   `docs/01-projectsim-2.0-implementation-roadmap.md`

2. Add a link to it in:

   `docs/00-projectsim-2.0-master-index.md`

3. Commit it on:

   `docs/ps-001-implementation-roadmap`

4. Create the GitHub milestone:

   `M0 — Repository Baseline`

5. Create the first issue:

   `Validate ProjectSim 2.0 Repository Baseline`

6. Open the repository in Cursor and complete Milestone 0 before starting feature implementation.

---

## 12. Approval

This roadmap becomes active when:

- it is committed to GitHub
- it is linked from the master index
- Milestone 0 exists
- the first implementation issue is created
- the repository baseline has been validated
