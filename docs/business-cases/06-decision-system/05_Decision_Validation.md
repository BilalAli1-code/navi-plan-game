# BC-006 Phase 2 — Decision Validation

**Status:** Draft for validation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Validation plan, traceability, acceptance criteria, and implementation-readiness checks for the complete Northstar decision system.

---

## 1. Purpose

This document defines how BC-006 Phase 2 will be reviewed and accepted before implementation begins. Validation must prove that the decision catalog, consequence model, outcome and ending model, and scoring system are complete, internally consistent, deterministic, safe, and compatible with ProjectSim's authoritative architecture.

---

## 2. Documents Under Validation

1. `01_Decision_Catalog.md`
2. `02_Consequence_Catalog.md`
3. `03_Outcome_and_Ending_Model.md`
4. `04_Scoring_and_Assessment.md`
5. `05_Decision_Validation.md`

Canonical Phase 1 dependencies include the six chapter narratives, stakeholder arcs, project timeline, meeting catalog, inbox catalog, document catalog, activity catalog, PMBOK mapping, and narrative validation.

---

## 3. Validation Principles

The decision system must:

- preserve one authoritative simulation state;
- resolve decisions deterministically;
- keep content version-pinned;
- apply consequences exactly once by logical identity;
- preserve immutable historical outcomes;
- keep learner-facing projections read-only and rebuildable;
- prevent informational messages from becoming hidden decisions;
- preserve decision authority and governance boundaries;
- protect hidden outcomes, weights, and future events;
- support Explorer, Practitioner, and Leader modes without changing professional standards silently.

---

## 4. Completeness Matrix

Every decision must have:

- unique stable ID;
- chapter assignment;
- narrative trigger;
- eligibility conditions;
- learner prompt;
- required evidence;
- authority boundary;
- at least two meaningful options where appropriate;
- option IDs;
- outcome mapping;
- immediate consequence mapping;
- delayed consequence mapping where applicable;
- competency mapping;
- scoring rubric;
- experience-level treatment;
- learner-safe feedback;
- replay and idempotency behavior.

A missing required field fails validation.

---

## 5. Chapter Coverage Validation

### Chapter One

Validate objective, delivery approach, and governance decisions.

### Chapter Two

Validate scope, governance, launch communication, quality, vendor responsibility, and baseline approval decisions.

### Chapter Three

Validate vendor mobilization, clinical participation, integration, communication, deliverable acceptance, and executive status decisions.

### Chapter Four

Validate containment, vendor recovery, compliance protection, change control, conflict response, recovery strategy, and steering commitment decisions.

### Chapter Five

Validate recovery communication, readiness segmentation, defect disposition, adoption response, vendor responsibility, operational ownership, and deployment strategy decisions.

### Chapter Six

Validate incident response, deployment continuation, hypercare exit, acceptance, residual work transfer, benefits reporting, vendor/financial closure, and final closure decisions.

Each chapter-ending milestone must be controlled by one or more explicit authoritative decisions.

---

## 6. Cross-Document Traceability

For every decision, reviewers must confirm links to:

- chapter event;
- inbox trigger or meeting trigger where applicable;
- supporting documents;
- required activities;
- relevant stakeholders;
- consequence definitions;
- project metrics;
- delayed event chains;
- PMBOK Guide Eighth Edition themes;
- competency evidence;
- chapter exit state;
- possible ending effects.

Broken or ambiguous references fail validation.

---

## 7. Consequence Validation

Reviewers must confirm:

- every option resolves to an authored outcome;
- every outcome has at least one consequence or explicit no-change rationale;
- consequence order is deterministic;
- metric changes stay within approved bounds;
- no consequence bypasses Domain invariants;
- stakeholder effects are emitted as signals rather than direct cross-context mutation;
- delayed consequences retain source-decision identity;
- retries do not duplicate effects;
- compensating behavior creates new records instead of rewriting history;
- no option is universally positive across all dimensions.

---

## 8. Outcome and Ending Validation

Reviewers must prove that:

- every chapter exit state is reachable;
- every final ending has at least one valid path;
- safety and compliance failures can override otherwise positive metrics;
- responsible delay and responsible stop can receive strong professional evaluation;
- technical delivery and benefits realization remain distinct;
- project closure requires accepted ownership for residual work;
- endings use cumulative authoritative state rather than one score;
- ending resolution is deterministic and versioned;
- final explanations reference actual learner history.

---

## 9. Scoring Validation

The scoring model must demonstrate that:

- every decision maps to relevant rubric dimensions;
- multiple defensible options can score well;
- project outcome luck does not replace decision-quality assessment;
- ethical and governance threshold failures are handled explicitly;
- XP, mastery, and achievements are idempotent;
- required activities contribute only when authoritatively completed;
- informational reading alone does not create false competency evidence;
- experience-level scaffolding does not weaken safety or ethics standards;
- final competency profiles are traceable to evidence.

---

## 10. Architecture Compatibility

Implementation must remain compatible with existing repository rules:

- authoritative state remains in SimulationRun / SimulationState;
- decisions resolve from authoritative state plus immutable content package version;
- current resolver versions remain explicit;
- command retries reuse stable command and idempotency identity;
- projections never determine eligibility, outcomes, scores, or completion;
- event consumers deduplicate by event ID;
- hidden content never enters learner-facing projection payloads;
- content-specific behavior stays inside the Northstar package;
- shared UI and command handlers remain case-neutral.

Any required architectural change must be raised separately and may not be hidden inside content implementation.

---

## 11. Informational-versus-Decision Validation

For every inbox item, meeting, and stakeholder message:

- confirm whether it is informational, actionable, preparation-required, escalation, or decision-triggering;
- confirm that only explicit decision-triggering items reference pending decision contracts;
- confirm that informational items never increase pending decision counts;
- confirm that one decision appears once across Mission Control, Inbox, Meetings, Stakeholder surfaces, and Decision Log;
- confirm that completion derives from authoritative state across every surface.

---

## 12. Experience-Level Validation

### Explorer

Validate guidance, evidence prompts, terminology support, and recovery coaching without selecting answers for the learner.

### Practitioner

Validate realistic ambiguity, sufficient evidence, and limited coaching.

### Leader

Validate strategic ambiguity, political pressure, contractual complexity, second-order effects, and accountability without creating arbitrary unfairness.

The same stable decision identities should be reused unless a documented content contract requires level-specific alternatives.

---

## 13. Required Test Coverage for Implementation

Phase 2 implementation should include:

- schema validation tests for every decision, option, outcome, consequence, competency, and ending;
- duplicate identifier tests;
- broken-reference tests;
- deterministic resolver tests;
- idempotent retry tests;
- consequence ordering tests;
- delayed consequence scheduling tests;
- metric bound failure tests;
- eligibility parity tests between command and projections;
- chapter-gate tests;
- ending reachability tests;
- scoring evidence traceability tests;
- informational-message classification tests;
- cross-surface convergence tests after decision resolution;
- content-version pinning tests;
- legacy snapshot compatibility tests where state schema changes are required.

---

## 14. Acceptance Criteria

Phase 2 is accepted when:

1. all five Phase 2 documents are present and internally consistent;
2. every canonical decision has complete traceability;
3. every option maps deterministically to outcome and consequence definitions;
4. delayed chains preserve originating identities;
5. chapter exits and final endings are reachable and validated;
6. scoring is evidence-based and idempotent;
7. professional, ethical, privacy, quality, and governance thresholds are explicit;
8. informational communications remain separate from decisions;
9. architecture compatibility is confirmed;
10. no unresolved high-severity narrative or contract gaps remain;
11. implementation tasks can be created without inventing missing decision-system behavior.

---

## 15. Validation Sign-Off Record

Record:

- reviewer names or roles;
- date;
- documents and versions reviewed;
- unresolved findings;
- accepted deviations;
- required implementation conditions;
- approval status: approved, approved with conditions, revision required, or rejected.

Until sign-off is complete, Phase 2 remains draft for implementation.
