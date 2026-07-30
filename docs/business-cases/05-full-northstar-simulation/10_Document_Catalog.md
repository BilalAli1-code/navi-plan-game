# BC-006 Phase 1 — Northstar Document Catalog

**Status:** Draft for implementation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Canonical project artifacts, evidence packages, records, and document-evolution rules for the complete Northstar Connected Care simulation.

## 1. Purpose

This document defines the canonical document and artifact set used across all six Northstar chapters. It identifies stable document IDs, lifecycle ownership, narrative availability, required content, decision support, update behavior, and continuity expectations.

Documents are part of the simulated workplace evidence system. They support learner judgment but do not independently mutate authoritative project state.

## 2. Canonical Document Rules

1. Every document has one stable identifier within the pinned business-case version.
2. A document may be created, revised, approved, superseded, accepted, transferred, or archived.
3. Documents evolve across chapters; the simulation must not recreate disconnected versions of the same artifact without an explicit version relationship.
4. A learner-facing document may support one or more decisions, meetings, activities, milestones, or assessments.
5. A document link does not grant decision eligibility and does not complete an activity by itself.
6. Approval and acceptance states must derive from authoritative actions and events.
7. Documents must preserve provenance, version, author or owner, approval state, and relationship to prior versions.
8. Hidden sections, scoring keys, unrevealed outcomes, and future consequence branches must never appear in learner-facing content.
9. Documents that contain incomplete, conflicting, or uncertain evidence must label those limitations honestly.
10. Deleted or superseded artifacts remain available in audit history when they influenced a decision.
11. Content must be accessible without relying on color, images, or inaccessible attachments.
12. The Workplace document surface is a derived projection and may not become a second source of truth.

## 3. Canonical Document Contract

Each document definition must provide:

- `id`;
- `chapterId` of first availability;
- `title`;
- `documentType`;
- `summary`;
- authored body or asset reference;
- `ownerStakeholderId` or owning role;
- `availableWhen`;
- `versionLabel`;
- `status`;
- `supersedesDocumentId`, when applicable;
- `relatedDecisionIds`;
- `relatedMeetingIds`;
- `relatedActivityIds`;
- `evidenceTags`;
- `containsHiddenSections`;
- accessibility metadata;
- retention and archive classification.

Recommended statuses are:

- `draft`;
- `working`;
- `submitted`;
- `challenged`;
- `approved`;
- `approved_with_conditions`;
- `rejected`;
- `accepted`;
- `conditionally_accepted`;
- `superseded`;
- `transferred`;
- `closed`;
- `archived`.

## 4. Artifact Families

| Family | Purpose | Typical Examples |
|---|---|---|
| Authorization and strategy | Define mandate, value, constraints, and authority | Authorization summary, business case, charter |
| Planning and baselines | Integrate scope, schedule, resources, quality, risk, governance, and procurement | Project management plan, scope baseline, milestone schedule |
| Governance and decisions | Record authority, approvals, changes, escalations, and commitments | Decision matrix, change request, steering decision record |
| Delivery and control | Track execution, quality, dependencies, issues, performance, and corrective action | Status report, dependency log, defect register |
| Readiness and transition | Demonstrate operational, technical, adoption, compliance, and support readiness | Readiness checklist, operating model, rollback plan |
| Closure and benefits | Confirm acceptance, transfer ownership, reconcile obligations, and preserve learning | Acceptance package, benefits plan, closure report |

## 5. Version and Evolution Rules

- Mutable working documents must expose a clear version label.
- A baseline may change only through an authorized change or recovery decision.
- A revised forecast does not automatically replace an approved baseline.
- A register or log retains historical entries; it is not replaced with only the latest state.
- Corrected documents must retain the relationship to the superseded version.
- Final closure records must point to the authoritative accepted or transferred versions of relevant artifacts.

## 6. Chapter One — Initiation Documents

The following IDs preserve the validated Chapter One implementation.

### `document.authorization-summary` — Program Authorization Summary

**Type:** Authorization  
**Owner:** Executive Sponsor / Steering Committee  
**Purpose:** Establish Northstar’s mandate, approved budget envelope, constraints, conditional authority, and open questions.

Required content:

- Connected Care program purpose;
- approved project budget of $4.8 million;
- $480,000 executive contingency reserve;
- twelve-clinic scope context;
- authority boundaries;
- unresolved success measures;
- privacy and data-access conditions;
- open rollout and standardization questions.

Supports:

- initial objective decision;
- governance decision;
- kickoff preparation;
- authorization review activity.

### `document.business-case-initial` — Initial Business Case

**Type:** Business case  
**Owner:** Sponsor and Finance  
**Purpose:** Present expected value, investment categories, assumptions, benefit sensitivity, and unresolved quality or equity concerns.

Required content:

- expected annual value after stabilization;
- investment categories;
- adoption and utilization assumptions;
- vendor and integration assumptions;
- benefit-measurement limitations;
- patient, clinical, privacy, and equity concerns.

### `document.access-performance-dashboard` — Access Performance Dashboard

**Type:** Performance evidence  
**Owner:** Patient Access / Analytics  
**Purpose:** Show current wait times, abandonment, utilization, patient experience, and evidence gaps.

Must distinguish:

- confirmed data;
- incomplete clinic data;
- averages that conceal local variation;
- operational symptoms from root causes.

### `document.stakeholder-briefing` — Initial Stakeholder Briefing

**Type:** Stakeholder analysis  
**Owner:** Project Manager / Business Analyst  
**Purpose:** Introduce key stakeholders, interests, influence, concerns, and early relationships.

### `document.scope-assumptions` — Initial Scope and Assumptions Brief

**Type:** Scope and assumptions  
**Owner:** Project Manager  
**Purpose:** Record what is believed to be inside, outside, uncertain, or dependent on later discovery.

### `document.risk-constraints` — Initial Risk and Constraints Brief

**Type:** Risk evidence  
**Owner:** Project Manager  
**Purpose:** Record early privacy, clinical, adoption, technical, vendor, financial, and governance exposure.

### Chapter One completion artifact expectations

Chapter One produces or confirms:

- initial objective framing;
- selected delivery posture;
- initial governance model;
- updated stakeholder understanding;
- explicit assumptions and risks carried into planning.

## 7. Chapter Two — Planning Documents

| ID | Title | Type | Primary Owner | Required Role in Narrative |
|---|---|---|---|---|
| `document.c2.project-management-plan` | Integrated Project Management Plan | Integrated plan | Learner / PMO | Connect all planning components and approval conditions |
| `document.c2.scope-statement` | Scope Statement | Scope | Learner / Business Owner | Define included, excluded, deferred, and conditional scope |
| `document.c2.requirements-register` | Requirements Register | Requirements | Business Analyst | Trace clinical, operational, technical, privacy, adoption, and reporting needs |
| `document.c2.delivery-decomposition` | Delivery Decomposition | Scope / delivery | Learner / Workstream Leads | Break scope into manageable deliverables or work packages |
| `document.c2.milestone-schedule` | Milestone Schedule | Schedule | Learner | Sequence milestones, dependencies, target dates, and confidence assumptions |
| `document.c2.resource-plan` | Resource and Capacity Plan | Resources | Learner / Functional Leads | Identify roles, capacity, backfill, constraints, and external needs |
| `document.c2.governance-plan` | Governance Plan | Governance | Learner / Program Director | Define forums, cadence, tolerances, reporting, and escalation routes |
| `document.c2.decision-authority-matrix` | Decision Authority Matrix | Governance | Program Director / Learner | Identify recommend, approve, consult, and escalate rights |
| `document.c2.stakeholder-engagement-plan` | Stakeholder Engagement Plan | Stakeholders | Learner / Change Lead | Define desired engagement, resistance response, and feedback approach |
| `document.c2.communications-plan` | Communications Plan | Communications | Learner | Define audiences, purpose, cadence, channels, ownership, and escalation |
| `document.c2.risk-register-v2` | Risk Register — Planning Baseline | Risk | Learner / Risk Owners | Expand risk statements, ownership, responses, triggers, and residual risk |
| `document.c2.dependency-map` | Integrated Dependency Map | Systems / schedule | Learner / Technical Lead | Show internal, vendor, regulatory, operational, and decision dependencies |
| `document.c2.quality-strategy` | Quality Management Strategy | Quality | Quality Lead / Learner | Define prevention, assurance, control, evidence, and escalation expectations |
| `document.c2.acceptance-framework` | Acceptance Criteria Framework | Quality / acceptance | Business Owner / Quality Lead | Define what evidence supports deliverable, readiness, and final acceptance |
| `document.c2.procurement-plan` | Procurement and Vendor Strategy | Procurement | Procurement / Learner | Define sourcing, contracting, onboarding, monitoring, and escalation approach |
| `document.c2.vendor-responsibility-matrix` | Vendor Responsibility Matrix | Procurement | Procurement / Vendor Lead | Resolve internal and vendor boundaries |
| `document.c2.change-control-approach` | Integrated Change-Control Approach | Governance | Learner / PMO | Define intake, analysis, authority, decision, and baseline-update rules |
| `document.c2.assumptions-constraints-log` | Assumptions and Constraints Log | Integration | Learner | Preserve uncertainty and challenge unsupported commitments |
| `document.c2.benefits-measurement-draft` | Benefits Measurement Draft | Value | Business Owner / Finance | Define preliminary measures, data sources, timing, and ownership |
| `document.c2.baseline-approval-package` | Planning Baseline Approval Package | Approval | Learner | Present integrated evidence, residual risks, objections, and recommendation |
| `document.c2.baseline-decision-record` | Planning Baseline Decision Record | Governance record | Steering Committee | Record approval, conditions, deferral, rejection, rationale, and owners |

### Chapter Two content requirements

The planning package must:

- distinguish target dates from committed dates;
- identify estimate confidence;
- expose resource and vendor assumptions;
- include quality, privacy, safety, adoption, and transition work;
- show unresolved objections;
- avoid presenting contingent scope as approved;
- connect benefits to measurable outcomes.

## 8. Chapter Three — Early Execution Documents

| ID | Title | Type | Primary Owner | Evolution Rule |
|---|---|---|---|---|
| `document.c3.execution-brief` | Chapter Execution Brief | Execution | Learner | Derived from the approved plan; does not replace it |
| `document.c3.team-working-agreement` | Team Working Agreement | Team | Learner / Team | Updated when coordination failures reveal needed changes |
| `document.c3.responsibility-matrix-update` | Responsibility Matrix — Execution Update | Resources | Learner | Revises ownership while preserving planning history |
| `document.c3.vendor-mobilization-record` | Vendor Mobilization Record | Procurement | Procurement / Vendor Lead | Records staffing, onboarding, substitutions, and conditions |
| `document.c3.integrated-schedule-update` | Integrated Schedule Update | Schedule | Learner | Forecast update; baseline changes require authorization |
| `document.c3.dependency-log` | Dependency Log | Integration | Learner / Workstream Leads | Retains owners, dates, status, and impact history |
| `document.c3.issue-log` | Issue Log | Issue | Learner | Converts materialized risks into governed issues where appropriate |
| `document.c3.risk-register-update` | Risk Register — Execution Update | Risk | Learner / Risk Owners | Updates probability, impact, response, and triggers |
| `document.c3.quality-review-checklist` | First Deliverable Quality Checklist | Quality | Quality Lead | Uses approved criteria without inventing new acceptance standards |
| `document.c3.nonconformance-log` | Defect and Nonconformance Log | Quality | Quality / Technical Lead | Records severity, evidence, owner, remediation, and retest |
| `document.c3.deliverable-acceptance-record` | First Deliverable Acceptance Record | Acceptance | Business Owner / Quality | Records accept, conditional accept, reject, or escalation result |
| `document.c3.status-report` | Early Execution Status Report | Measurement | Learner | Shows progress, forecast, risks, issues, quality, and decisions needed |
| `document.c3.corrective-action-plan` | Early Corrective-Action Plan | Improvement | Learner / Owners | Records root cause, action, owner, due date, and verification |
| `document.c3.decision-action-log` | Decision and Action Log | Governance | Learner | Preserves decision identity and follow-through |
| `document.c3.stakeholder-engagement-update` | Stakeholder Engagement Update | Stakeholders | Learner / Change Lead | Reflects trust, participation, conflict, and response actions |
| `document.c3.lessons-improvement-notes` | Early Lessons and Improvement Notes | Learning | Learner / Team | Captures reusable improvement without waiting for closure |

## 9. Chapter Four — Mid-Project Recovery Documents

### `document.c4.health-assessment` — Mid-Project Health Assessment

Must include:

- current state by scope, schedule, finance, quality, risk, stakeholders, resources, procurement, and governance;
- confidence and trend;
- tolerance breaches;
- confirmed facts versus assumptions;
- decisions or support required.

### `document.c4.variance-analysis` — Integrated Variance Analysis

Must compare:

- approved baseline;
- current forecast;
- causal factors;
- trend and confidence;
- business-value implications.

### `document.c4.root-cause-analysis` — Root-Cause Analysis

Must avoid superficial blame and evaluate process, decision, dependency, capability, governance, and communication causes.

### `document.c4.issue-log-update` — Issue Log — Recovery Update

Must contain issue statement, owner, impact, urgency, containment, resolution target, and escalation status.

### `document.c4.risk-register-update` — Risk Register — Recovery Update

Must contain changed exposure, secondary risks, residual risk, ownership, and response status.

### `document.c4.integrated-impact-assessment` — Integrated Impact Assessment

Must assess scope, schedule, finance, quality, resources, risk, procurement, stakeholders, value, and compliance.

### `document.c4.vendor-corrective-action` — Vendor Corrective-Action Plan

Must define failure, causal factors, actions, owners, dates, acceptance evidence, commercial implications, and escalation rules.

### `document.c4.compliance-assessment` — Compliance, Privacy, and Quality Assessment

Must identify the concern, evidence, affected work, required controls, authority, residual risk, and whether work may continue.

### `document.c4.change-request` — Formal Change Request Record

Must document request origin, rationale, impact, options, recommendation, authority, disposition, and authorized baseline updates.

### `document.c4.recovery-plan` — Integrated Recovery Plan

Must contain:

- root-cause summary;
- current health statement;
- containment;
- corrective and preventive actions;
- owners and due dates;
- dependencies;
- forecast impact;
- quality and compliance protections;
- stakeholder re-engagement;
- communication commitments;
- escalation triggers;
- measures of recovery effectiveness.

### `document.c4.revised-forecast` — Revised Forecast

Must show completion forecast, cost forecast, confidence, assumptions, tolerance status, and scenario range. It does not become a baseline until authorized.

### `document.c4.stakeholder-recovery-plan` — Stakeholder Recovery Plan

Must identify trust gaps, affected groups, engagement actions, commitments, owners, and follow-up measures.

### `document.c4.steering-decision-record` — Steering Committee Recovery Decision Record

Must capture decision, rationale, conditions, dissent, authorized tolerances, owners, review timing, and communication direction.

## 10. Chapter Five — Delivery and Readiness Documents

| ID | Title | Type | Required Evidence |
|---|---|---|---|
| `document.c5.recovery-progress-report` | Recovery Progress Report | Measurement | Recovery action status, trends, residual exposure, forecast |
| `document.c5.integrated-readiness-checklist` | Integrated Readiness Checklist | Readiness | Criteria and evidence across technology, operations, clinical, quality, privacy, support, data, training, vendor, and contingency |
| `document.c5.site-readiness-scorecard` | Site and Department Readiness Scorecard | Readiness | Segmented status, gaps, owners, due dates, confidence |
| `document.c5.defect-exception-register` | Defect and Exception Register | Quality | Severity, impact, workaround, owner, release disposition, residual risk |
| `document.c5.residual-risk-register` | Residual Risk Register | Risk | Exposure, controls, owner, acceptance authority, monitoring |
| `document.c5.adoption-issue-log` | Adoption Issue Log | Stakeholders | Resistance signals, root causes, affected groups, interventions, follow-up |
| `document.c5.training-effectiveness-report` | Training Completion and Effectiveness Report | Resources / adoption | Attendance, competence, confidence, gaps, reinforcement plan |
| `document.c5.support-operating-model` | Support Operating Model | Operations | Service ownership, support tiers, incident process, hours, staffing, escalation |
| `document.c5.transition-responsibility-matrix` | Transition Responsibility Matrix | Governance / resources | Accepted operational, technical, clinical, data, vendor, and benefits ownership |
| `document.c5.vendor-obligation-assessment` | Vendor Obligation Assessment | Procurement | Contract, changes, acceptance criteria, issue history, responsibility conclusion |
| `document.c5.deployment-options-analysis` | Deployment Options Analysis | Decision support | Full, phased, pilot, conditional, or delayed options with trade-offs |
| `document.c5.contingency-rollback-plan` | Contingency and Rollback Plan | Risk / operations | Thresholds, authority, steps, communications, evidence preservation, recovery |
| `document.c5.integrated-readiness-recommendation` | Integrated Readiness Recommendation | Approval | Readiness by domain, unresolved items, residual risk, recommendation, conditions |
| `document.c5.executive-decision-brief` | Go-Live Executive Decision Brief | Governance | Decision requested, evidence, alternatives, risks, conditions, ownership |
| `document.c5.go-live-decision-record` | Go-Live Decision Record | Governance record | Authorization, conditions, delay, risk acceptance, next steps |

## 11. Chapter Six — Closure and Benefits Documents

| ID | Title | Type | Required Role |
|---|---|---|---|
| `document.c6.deployment-authorization` | Deployment Authorization Record | Governance | Confirm conditions, authority, thresholds, participants, and timing |
| `document.c6.command-center-plan` | Deployment Coordination Plan | Operations | Define roles, cadence, escalation, communications, and decision rights |
| `document.c6.incident-log` | Deployment Incident Log | Issue / operations | Preserve timeline, impact, evidence, actions, decisions, and ownership |
| `document.c6.deployment-decision-record` | Continue, Pause, Restrict, or Rollback Decision Record | Governance | Record evidence, recommendation, authority, rationale, and conditions |
| `document.c6.contingency-activation-record` | Contingency or Rollback Activation Record | Risk / operations | Record activation threshold, scope, authority, actions, and recovery path |
| `document.c6.hypercare-dashboard` | Hypercare Dashboard | Measurement | Show incident, defect, support, adoption, vendor, and operational trends |
| `document.c6.stabilization-exit-assessment` | Stabilization and Hypercare Exit Assessment | Transition | Evaluate exit criteria, trend, ownership, capacity, and residual exposure |
| `document.c6.formal-acceptance-package` | Formal Acceptance Package | Acceptance | Trace delivered scope, criteria, exceptions, warranties, and approvals |
| `document.c6.residual-transfer-register` | Residual Risk, Issue, Defect, and Action Transfer Register | Transition | Name owners, dates, priority, capacity, funding, and governance |
| `document.c6.operational-handover` | Operational Handover Document | Transition | Confirm service ownership, procedures, support, data, compliance, and escalation |
| `document.c6.knowledge-transfer-record` | Knowledge-Transfer Record | Learning / operations | Confirm material transferred, recipient, completion, and remaining gaps |
| `document.c6.benefits-realization-plan` | Benefits Realization Plan | Value | Define benefits, measures, baselines, targets, timing, data, owners, escalation |
| `document.c6.benefit-measurement-schedule` | Benefit Baseline and Measurement Schedule | Measurement | Separate delivered capability, early indicator, forecast, and realized benefit |
| `document.c6.final-financial-report` | Final Financial Report | Finance | Reconcile actuals, commitments, contingency, forecast, and continuing cost |
| `document.c6.procurement-closure-record` | Procurement Closure Record | Procurement | Verify deliverables, changes, invoices, claims, warranties, and open obligations |
| `document.c6.vendor-performance-evaluation` | Vendor Performance Evaluation | Procurement | Assess delivery, quality, collaboration, responsiveness, and transition |
| `document.c6.lessons-register` | Lessons Learned Register | Learning | Capture validated lessons, evidence, recommendation, and improvement owner |
| `document.c6.organizational-asset-updates` | Organizational Process Asset Update Record | PMO | Identify standards, templates, guidance, and controls to update |
| `document.c6.resource-release-plan` | Resource Release and Recognition Plan | Resources | Sequence release, preserve continuity, provide feedback, and recognize contributions |
| `document.c6.final-project-report` | Final Project Report | Closure | Summarize delivery, outcomes, performance, acceptance, obligations, benefits, and learning |
| `document.c6.closure-approval-record` | Project Closure Approval Record | Governance record | Confirm closure, conditions, transferred accountability, and records location |

## 12. Decision Evidence Rules

A document supports a decision only when:

- it is available in the authoritative content version;
- its visibility condition is satisfied;
- it does not reveal hidden outcomes;
- the learner can identify its source and limitations;
- the decision definition references the document or its evidence tags;
- the document version used for the decision remains auditable.

Conflicting documents are permitted and encouraged where realistic. The learner must be able to distinguish disagreement from data corruption.

## 13. Document Completion and Approval

- Drafting a document is not the same as submitting it.
- Submitting is not the same as approval.
- Approval with conditions must preserve the conditions.
- A rejected document remains visible with its rationale and revision path.
- A document may complete an activity only when the activity contract specifies the required status and evidence.
- A document may unlock a meeting or decision only through authored availability conditions.

## 14. Experience-Level Tailoring

### Explorer

- document summaries and key evidence callouts;
- plain-language explanation of artifact purpose;
- visible links between evidence and decisions;
- guided comparison of versions;
- warnings when a forecast is not an approved baseline.

### Practitioner

- standard document set;
- incomplete evidence and moderate contradictions;
- fewer highlighted conclusions;
- realistic version and approval ambiguity.

### Leader

- higher information density;
- politically framed executive summaries;
- conflicting attachments and incomplete evidence;
- greater need to identify source quality and authority;
- no change to authoritative facts or hidden-answer protections.

## 15. Accessibility and Localization

Every document must include:

- accessible title;
- text alternative for any visual artifact;
- logical reading order;
- clear table headings;
- units and time periods stated in text;
- color-independent status labels;
- language metadata;
- accessible descriptions for charts and dashboards;
- preserved currency and locale conventions defined by the case.

## 16. Retention and Audit

The following must remain traceable after project closure:

- documents used in material decisions;
- approved baselines and authorized changes;
- rejected or superseded versions that influenced work;
- acceptance evidence;
- risk and issue transfer records;
- procurement and financial closure evidence;
- benefits ownership;
- final lessons and closure approval.

## 17. Validation Requirements

The catalog passes validation only when:

1. every document ID is unique;
2. all chapter references are valid;
3. all related decisions, meetings, activities, stakeholders, and evidence tags resolve;
4. supersession relationships are acyclic;
5. baseline updates require an authorized decision;
6. decision-supporting versions remain auditable;
7. hidden sections cannot enter learner-facing projections;
8. required artifacts exist before dependent milestones;
9. closure artifacts transfer every residual obligation to a named owner;
10. accessibility metadata is complete;
11. Chapter One identities remain backward compatible;
12. documents derive their visible state from the authoritative run and pinned content version.

## 18. Implementation Boundary

This catalog defines authored content and traceability. It does not authorize:

- direct document-driven mutation of simulation state;
- browser-owned approval or acceptance state;
- silent baseline replacement;
- AI-generated authoritative evidence without deterministic content rules;
- deletion of decision evidence from run history;
- case-specific conditionals in shared Workplace components.
