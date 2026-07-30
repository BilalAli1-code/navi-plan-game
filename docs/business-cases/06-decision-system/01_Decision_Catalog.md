# BC-006 Phase 2 — Decision Catalog

**Status:** Draft for implementation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Canonical decision inventory for the complete Northstar Connected Care simulation.

---

## 1. Purpose

This document defines every authoritative learner decision required across the six-chapter Northstar simulation. Each decision must be deterministic, versioned, traceable to evidence, mapped to chapter progression, and resolved from authoritative simulation state plus the immutable content package version.

The catalog is the source for Phase 2 implementation of `DecisionDefinition`, option sets, eligibility, evidence requirements, outcomes, consequences, and scoring hooks.

---

## 2. Decision Design Rules

Every decision must include:

- stable decision identifier;
- chapter and narrative trigger;
- explicit eligibility conditions;
- learner-facing prompt;
- decision authority boundary;
- required evidence;
- option identifiers and option text;
- immediate outcome class;
- delayed consequence references;
- affected project metrics;
- stakeholder relationship effects;
- PMBOK Guide Eighth Edition competency mapping;
- experience-level tailoring;
- completion and replay rules.

Informational inbox items, meetings, documents, and stakeholder messages must never create a pending decision unless they reference an explicit decision contract.

---

## 3. Canonical Identifier Pattern

Use:

`decision.northstar.chapter-XX.<semantic-name>`

Option identifiers use:

`option.northstar.chapter-XX.<decision-name>.<option-name>`

All identifiers are immutable after publication.

---

## 4. Chapter One Decisions

### D1.1 — Define the Initial Project Objective

**ID:** `decision.northstar.chapter-01.define-objective`  
**Trigger:** Completion of initial evidence review.  
**Evidence:** authorization summary, business case, access dashboard, stakeholder concerns.  
**Authority:** Learner recommends the primary project objective within the approved mandate.

**Options:**

- prioritize technology deployment speed;
- prioritize patient-access outcomes;
- prioritize operational efficiency;
- prioritize privacy and quality controls;
- propose a balanced value objective with measurable outcomes.

**Strong judgment:** Connects capability delivery to patient access, operational value, safety, equity, and measurable outcomes.

### D1.2 — Select the Delivery Approach

**ID:** `decision.northstar.chapter-01.select-delivery-approach`

**Options:** predictive, adaptive, hybrid, staged hybrid.

**Strong judgment:** Tailors the approach to regulatory constraints, evolving requirements, vendor dependencies, and operational readiness.

### D1.3 — Establish Governance

**ID:** `decision.northstar.chapter-01.establish-governance`

**Options:** sponsor-led, cross-functional steering, staged governance, delegated workstream governance with escalation thresholds.

**Strong judgment:** Preserves clear decision rights, timely escalation, and cross-functional accountability.

---

## 5. Chapter Two Decisions

### D2.1 — Scope Baseline Strategy

**ID:** `decision.northstar.chapter-02.scope-baseline-strategy`

**Options:** broad fixed scope, minimum viable scope, phased scope, provisional scope with controlled elaboration.

### D2.2 — Governance and Escalation Model

**ID:** `decision.northstar.chapter-02.governance-escalation-model`

**Options:** centralized, delegated, tiered, risk-based hybrid.

### D2.3 — Launch Target Communication

**ID:** `decision.northstar.chapter-02.launch-target-communication`

**Options:** commit to target date, communicate range, defer commitment pending evidence, propose milestone-based commitment.

### D2.4 — Quality and Acceptance Threshold

**ID:** `decision.northstar.chapter-02.quality-acceptance-threshold`

**Options:** minimum contractual compliance, integrated clinical-operational acceptance, risk-tiered acceptance, staged acceptance.

### D2.5 — Vendor Responsibility Boundary

**ID:** `decision.northstar.chapter-02.vendor-responsibility-boundary`

**Options:** accept vendor assumptions, challenge and renegotiate, split responsibilities, escalate unresolved ambiguity.

### D2.6 — Planning Baseline Recommendation

**ID:** `decision.northstar.chapter-02.planning-baseline-recommendation`

**Options:** approve, approve with conditions, defer, reject.

---

## 6. Chapter Three Decisions

### D3.1 — Vendor Staffing Substitution

**ID:** `decision.northstar.chapter-03.vendor-staffing-substitution`

**Options:** accept, conditionally accept, reject, require corrective plan, escalate commercially.

### D3.2 — Clinical Participation Response

**ID:** `decision.northstar.chapter-03.clinical-participation-response`

**Options:** preserve schedule, adjust engagement model, escalate capacity, phase workshops, accept reduced participation.

### D3.3 — Integration Assumption Failure

**ID:** `decision.northstar.chapter-03.integration-assumption-failure`

**Options:** absorb, replan, raise change request, escalate dependency, reduce scope.

### D3.4 — Communication Breakdown Response

**ID:** `decision.northstar.chapter-03.communication-breakdown-response`

**Options:** blame accountable team, conduct systems review, revise communication controls, escalate governance breach.

### D3.5 — First Deliverable Acceptance

**ID:** `decision.northstar.chapter-03.first-deliverable-acceptance`

**Options:** accept, conditionally accept, reject and remediate, escalate for authority.

### D3.6 — Executive Status Position

**ID:** `decision.northstar.chapter-03.executive-status-position`

**Options:** optimistic summary, transparent balanced report, risk-first escalation, defer update pending analysis.

---

## 7. Chapter Four Decisions

### D4.1 — Immediate Containment

**ID:** `decision.northstar.chapter-04.immediate-containment`

**Options:** targeted pause, continue with controls, resource reallocation, immediate escalation, no containment.

### D4.2 — Vendor Response

**ID:** `decision.northstar.chapter-04.vendor-response`

**Options:** accept proposal, renegotiate, require corrective action, invoke remedies, replace scope, escalate commercially.

### D4.3 — Compliance and Quality Protection

**ID:** `decision.northstar.chapter-04.compliance-quality-protection`

**Options:** pause affected work, targeted remediation, specialist review, revise criteria through governance, reject shortcut, escalate residual risk.

### D4.4 — Change Request Disposition

**ID:** `decision.northstar.chapter-04.change-request-disposition`

**Options:** approve, approve with modification, defer, reject, split to later release, request further analysis.

### D4.5 — Team Conflict Response

**ID:** `decision.northstar.chapter-04.team-conflict-response`

**Options:** collaborate, compromise, direct, accommodate, avoid, facilitate escalation.

### D4.6 — Recovery Strategy

**ID:** `decision.northstar.chapter-04.recovery-strategy`

**Options:** extend schedule, reduce scope, increase investment, phase delivery, resequence work, replace failing component, combined controlled recovery.

### D4.7 — Steering Committee Commitment

**ID:** `decision.northstar.chapter-04.steering-committee-commitment`

**Options:** fixed guarantee, confidence range, conditional commitment, no commitment, request executive direction.

---

## 8. Chapter Five Decisions

### D5.1 — Recovery Communication Position

**ID:** `decision.northstar.chapter-05.recovery-communication-position`

### D5.2 — Readiness Segmentation

**ID:** `decision.northstar.chapter-05.readiness-segmentation`

### D5.3 — Defect Disposition

**ID:** `decision.northstar.chapter-05.defect-disposition`

### D5.4 — Adoption Response

**ID:** `decision.northstar.chapter-05.adoption-response`

### D5.5 — Vendor Stabilization Responsibility

**ID:** `decision.northstar.chapter-05.vendor-stabilization-responsibility`

### D5.6 — Operational Ownership Model

**ID:** `decision.northstar.chapter-05.operational-ownership-model`

### D5.7 — Deployment Strategy Recommendation

**ID:** `decision.northstar.chapter-05.deployment-strategy-recommendation`

**Options:** full deployment, phased deployment, pilot-first, limited deployment with conditions, postpone, deploy with formal risk acceptance and enhanced controls.

---

## 9. Chapter Six Decisions

### D6.1 — Incident Response Strategy

**ID:** `decision.northstar.chapter-06.incident-response-strategy`

### D6.2 — Continue, Pause, or Roll Back

**ID:** `decision.northstar.chapter-06.deployment-continuation`

### D6.3 — Hypercare Exit

**ID:** `decision.northstar.chapter-06.hypercare-exit`

### D6.4 — Acceptance Position

**ID:** `decision.northstar.chapter-06.acceptance-position`

### D6.5 — Residual Work Transfer

**ID:** `decision.northstar.chapter-06.residual-work-transfer`

### D6.6 — Benefits Reporting Position

**ID:** `decision.northstar.chapter-06.benefits-reporting-position`

### D6.7 — Vendor and Financial Closure

**ID:** `decision.northstar.chapter-06.vendor-financial-closure`

### D6.8 — Final Closure Recommendation

**ID:** `decision.northstar.chapter-06.final-closure-recommendation`

---

## 10. Eligibility Rules

A decision may become available only when:

- its chapter is unlocked;
- prerequisite activities are complete;
- required evidence is available;
- prerequisite decisions are resolved;
- no blocking state transition prevents action;
- the decision has not already been resolved for the current run;
- the learner retains required authority or is explicitly choosing an escalation path.

Eligibility must be evaluated by the shared Domain policy used by command submission and projections.

---

## 11. Experience-Level Tailoring

### Explorer

- clearer prompts;
- reduced option ambiguity;
- explicit evidence checklist;
- warnings before governance violations;
- stronger coaching.

### Practitioner

- moderate ambiguity;
- incomplete but sufficient evidence;
- multiple viable options;
- limited pre-decision coaching.

### Leader

- politically framed evidence;
- conflicting executive priorities;
- greater contractual ambiguity;
- second-order effects;
- no guaranteed optimal answer.

The underlying decision identity and authoritative outcome logic remain stable across levels.

---

## 12. Validation Requirements

The catalog is complete only when:

- every chapter-ending milestone has at least one binding decision;
- every decision maps to required evidence;
- every option maps to at least one outcome;
- every outcome references consequences;
- no informational item creates a hidden decision;
- identifiers are unique and immutable;
- decision authority is explicit;
- PMBOK and competency coverage is traceable;
- delayed consequences preserve source-decision identity;
- all decisions can be represented by the existing authoritative contracts.
