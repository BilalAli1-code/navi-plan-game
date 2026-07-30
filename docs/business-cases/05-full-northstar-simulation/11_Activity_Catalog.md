# BC-006 Phase 1 — Northstar Activity Catalog

**Status:** Draft for implementation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Canonical learner activities, prerequisites, completion evidence, sequencing, and cross-surface completion rules for the complete Northstar Connected Care simulation.

## 1. Purpose

This document defines the activities the learner performs across the six-chapter Northstar simulation. Activities translate narrative events, meetings, messages, documents, and decisions into trackable workplace work.

An activity is not a decision and must not duplicate decision state. It may prepare for, require, or follow a decision, but authoritative decision submission remains separate.

## 2. Canonical Activity Rules

1. Every activity has one stable ID within the pinned business-case version.
2. Activities have explicit prerequisites, completion evidence, and required or optional status.
3. Reading a message or opening a document does not complete an activity unless the activity contract explicitly defines review as the evidence.
4. A decision-linked activity completes only when its required decision or preparation evidence is complete.
5. The learner may not bypass required activities to advance a chapter.
6. Activity completion must be derived consistently across Mission Control, Activities, Meetings, Inbox, Completed History, and chapter progress.
7. Completed History is derived from completed activities; it is not a separate write model.
8. An activity cannot write authoritative state directly from the browser.
9. Activities must use the same authoritative run, case version, chapter state, and projection source position as other workplace surfaces.
10. Optional enrichment activities may improve learning or evidence but cannot silently become required.
11. Activities remain historically visible after completion.
12. Failed, incomplete, or revised work must retain its audit trail.

## 3. Canonical Activity Contract

Each activity definition must include:

- `id`;
- `chapterId`;
- `learnerSession`;
- `title`;
- `purpose`;
- `required`;
- `estimatedMinutes`;
- `availableWhen`;
- `completionWhen`;
- prerequisite activity, meeting, document, or decision references;
- related document IDs;
- related meeting IDs;
- related decision IDs;
- evidence required for completion;
- learning objective IDs;
- competency and assessment tags;
- experience-level guidance;
- accessibility summary.

Recommended statuses are:

- `locked`;
- `available`;
- `in_progress`;
- `blocked`;
- `completed`;
- `reopened`;
- `waived` only through explicit authored governance.

## 4. Activity Types

| Type | Purpose | Examples |
|---|---|---|
| Review | Inspect evidence and identify implications | Review authorization, analyze readiness data |
| Preparation | Prepare for a meeting, presentation, or decision | Build approval package, prepare recovery recommendation |
| Facilitation | Lead a meeting or stakeholder interaction | Run planning workshop, facilitate lessons learned |
| Analysis | Compare evidence, diagnose causes, or assess impacts | Variance analysis, defect classification |
| Artifact work | Create or update a project document | Update risk register, prepare final report |
| Decision support | Gather and structure evidence for a separate decision | Deployment options analysis |
| Communication | Produce audience-appropriate project communication | Executive status update |
| Reflection | Consolidate learning and transfer insight | Chapter reflection |

## 5. Chapter One — Initiation Activities

The following IDs preserve the validated Chapter One vertical slice.

| ID | Title | Required | Completion Evidence |
|---|---|---:|---|
| `activity.review-authorization` | Review Program Authorization | Yes | Authorization summary and business case reviewed; key authority and constraints acknowledged |
| `activity.analyze-access-evidence` | Analyze Access Evidence | Yes | Access dashboard reviewed; evidence gaps and value signals identified |
| `activity.attend-kickoff` | Attend Connected Care Program Kickoff | Yes | Required kickoff meeting completed |
| `activity.review-stakeholder-concerns` | Review Stakeholder Concerns | Yes | Clinical, operational, technical, privacy, finance, patient, and vendor concerns reviewed |
| `activity.submit-chapter-one-decisions` | Submit Chapter One Decisions | Yes | Objective, delivery approach, and governance decisions resolved through authoritative decision flow |
| `activity.chapter-one-reflection` | Complete Chapter One Reflection | Yes | Reflection submitted after required Chapter One decisions |

### Chapter One exit dependency

Chapter One may complete only when all six required activities and all three required decisions are complete.

## 6. Chapter Two — Planning Activities

### `activity.c2.review-carryover`

**Title:** Review Initiation Carryover  
**Required:** Yes  
**Purpose:** Identify unresolved assumptions, stakeholder commitments, risks, governance limits, and delivery-posture consequences from Chapter One.  
**Completion evidence:** Carryover review recorded with items assigned to planning work.

### `activity.c2.assign-planning-ownership`

**Title:** Assign Planning Ownership  
**Required:** Yes  
**Prerequisite:** Planning kickoff available.  
**Completion evidence:** Planning responsibility matrix and decision path confirmed.

### `activity.c2.align-scope-requirements`

**Title:** Align Scope and Requirements  
**Required:** Yes  
**Completion evidence:** Scope boundaries, exclusions, deferred items, requirement conflicts, and owners documented.

### `activity.c2.design-governance`

**Title:** Design Governance and Decision Rights  
**Required:** Yes  
**Completion evidence:** Governance plan, decision authority matrix, escalation thresholds, and change-control approach prepared.

### `activity.c2.map-risks-dependencies`

**Title:** Map Risks and Dependencies  
**Required:** Yes  
**Completion evidence:** Updated risk register, dependency map, owners, triggers, and residual uncertainty documented.

### `activity.c2.build-schedule-resources`

**Title:** Build Milestone Schedule and Resource Plan  
**Required:** Yes  
**Completion evidence:** Sequenced milestones, resource assumptions, constraints, confidence levels, and critical dependencies recorded.

### `activity.c2.define-quality-acceptance`

**Title:** Define Quality and Acceptance Approach  
**Required:** Yes  
**Completion evidence:** Quality strategy, testing approach, readiness evidence, acceptance criteria, and responsible-technology checkpoints defined.

### `activity.c2.plan-vendor-procurement`

**Title:** Plan Procurement and Vendor Governance  
**Required:** Yes  
**Completion evidence:** Procurement plan, vendor responsibility boundaries, onboarding expectations, and escalation rules prepared.

### `activity.c2.plan-engagement-communications`

**Title:** Plan Stakeholder Engagement and Communications  
**Required:** Yes  
**Completion evidence:** Stakeholder engagement and communications plans prepared with audiences, cadence, ownership, and feedback routes.

### `activity.c2.challenge-integrated-plan`

**Title:** Challenge the Integrated Plan  
**Required:** Yes  
**Prerequisite:** Draft integrated plan available.  
**Completion evidence:** Assumptions challenged, objections logged, revisions assigned, residual risks accepted or escalated.

### `activity.c2.prepare-baseline-approval`

**Title:** Prepare Planning Baseline Approval Package  
**Required:** Yes  
**Completion evidence:** Integrated package includes scope, schedule, resources, finance, quality, risk, procurement, governance, stakeholder, benefits, and recommendation evidence.

### `activity.c2.present-baseline`

**Title:** Present the Planning Baseline  
**Required:** Yes  
**Prerequisite:** Approval package complete.  
**Completion evidence:** Steering approval meeting completed and recommendation submitted.

### `activity.c2.chapter-reflection`

**Title:** Reflect on Planning Trade-offs  
**Required:** Yes  
**Completion evidence:** Learner explains tailoring, uncertainty, stakeholder trade-offs, and likely downstream consequences.

## 7. Chapter Three — Early Execution Activities

| ID | Title | Required | Completion Evidence |
|---|---|---:|---|
| `activity.c3.mobilize-teams` | Mobilize Delivery Teams | Yes | Workstream ownership, cadence, immediate actions, and dependencies confirmed |
| `activity.c3.review-vendor-mobilization` | Review Vendor Mobilization | Yes | Staffing, responsibilities, reporting, substitutions, and escalation routes reviewed |
| `activity.c3.manage-clinical-participation` | Manage Clinical Participation Constraint | Yes | Proportionate participation and decision-quality response established |
| `activity.c3.review-dependencies` | Conduct Cross-Functional Dependency Review | Yes | Critical dependencies, owners, dates, risks, and schedule implications updated |
| `activity.c3.respond-communication-breakdown` | Respond to Communication Breakdown | Yes | Root cause, accountability, corrective action, and communication improvement recorded |
| `activity.c3.evaluate-first-deliverable` | Evaluate First Major Deliverable | Yes | Quality evidence assessed and acceptance recommendation supported |
| `activity.c3.provide-executive-update` | Provide Executive Progress Update | Yes | Accurate, concise, decision-useful status communication delivered |
| `activity.c3.update-control-artifacts` | Update Execution Control Artifacts | Yes | Schedule, issue log, risk register, status report, decision log, and corrective actions updated |
| `activity.c3.chapter-reflection` | Complete Early Execution Reflection | Yes | Learner connects planning choices to execution outcomes and identifies improvement |

## 8. Chapter Four — Mid-Project Recovery Activities

| ID | Title | Required | Completion Evidence |
|---|---|---:|---|
| `activity.c4.diagnose-health` | Diagnose Project Health | Yes | Evidence-based health assessment and tolerance breaches documented |
| `activity.c4.separate-risk-issue` | Distinguish Risks from Issues | Yes | Materialized issues, future risks, owners, and response states corrected |
| `activity.c4.prioritize-containment` | Prioritize Immediate Containment | Yes | Proportionate, time-bounded containment actions with owners approved or recommended |
| `activity.c4.evaluate-vendor-recovery` | Evaluate Vendor Recovery Options | Yes | Contract, performance, relationship, schedule, and commercial options assessed |
| `activity.c4.assess-compliance-quality` | Assess Compliance and Quality Protection | Yes | Material concern, controls, authority, residual risk, and work-continuation position documented |
| `activity.c4.assess-change-request` | Assess Late Change Request | Yes | Integrated impact assessment and disposition recommendation prepared |
| `activity.c4.resolve-team-conflict` | Resolve or Reduce Team Conflict | Yes | Conflict approach, priority decision, workload implications, and next actions documented |
| `activity.c4.build-recovery-plan` | Build Integrated Recovery Plan | Yes | Recovery actions, owners, forecast, quality protections, stakeholder actions, and triggers integrated |
| `activity.c4.prepare-steering-review` | Prepare Steering Committee Recovery Recommendation | Yes | Decision brief and supporting evidence complete |
| `activity.c4.present-recovery` | Present Recovery Recommendation | Yes | Steering review completed and recommendation submitted |
| `activity.c4.update-after-authorization` | Update Governance Artifacts After Authorization | Yes | Decision record, forecast, risk, issue, schedule, cost, and communication artifacts updated |
| `activity.c4.chapter-reflection` | Complete Recovery Reflection | Yes | Learner analyzes recovery trade-offs, leadership behavior, and consequences |

## 9. Chapter Five — Delivery and Readiness Activities

| ID | Title | Required | Completion Evidence |
|---|---|---:|---|
| `activity.c5.review-recovery-evidence` | Review Recovery Evidence | Yes | Recovery actions reconciled with current trends and unresolved exposure |
| `activity.c5.reconcile-milestones` | Reconcile Milestone and Forecast Status | Yes | Milestone status, forecast, confidence, and conditions aligned |
| `activity.c5.assess-segmented-readiness` | Assess Readiness by Function and Site | Yes | Readiness scorecards completed with gaps, owners, and confidence |
| `activity.c5.classify-defects` | Classify Defects and Exceptions | Yes | Release-blocking, workaround, residual-risk, enhancement, duplicate, and change items correctly classified |
| `activity.c5.analyze-adoption` | Analyze Adoption Resistance | Yes | Resistance signals, root causes, affected groups, and intervention options documented |
| `activity.c5.respond-adoption` | Respond to Adoption Escalation | Yes | Targeted consultation, redesign, support, communication, or leadership actions assigned |
| `activity.c5.resolve-operational-ownership` | Establish Operational Ownership | Yes | Named roles explicitly accept service, process, support, data, vendor, and benefits responsibilities |
| `activity.c5.evaluate-vendor-obligations` | Evaluate Vendor Stabilization Obligations | Yes | Contract and evidence-based responsibility position prepared |
| `activity.c5.validate-training` | Validate Training Effectiveness | Yes | Completion, competence, confidence, gaps, and reinforcement actions assessed |
| `activity.c5.update-risks-issues` | Update Readiness Risks and Issues | Yes | Residual risks, defects, adoption issues, and ownership updated |
| `activity.c5.evaluate-deployment-options` | Evaluate Deployment Strategies | Yes | Full, phased, pilot, conditional, and delayed options compared |
| `activity.c5.prepare-readiness-recommendation` | Prepare Integrated Readiness Recommendation | Yes | Evidence package, residual risk, contingency, conditions, and recommendation complete |
| `activity.c5.present-go-live-recommendation` | Present Go-Live Recommendation | Yes | Integrated readiness review completed and recommendation submitted |
| `activity.c5.chapter-reflection` | Complete Readiness Reflection | Yes | Learner reflects on evidence, pressure, quality, adoption, and risk acceptance |

## 10. Chapter Six — Closure and Benefits Activities

| ID | Title | Required | Completion Evidence |
|---|---|---:|---|
| `activity.c6.confirm-deployment-authority` | Confirm Deployment Authority | Yes | Conditions, roles, thresholds, communications, contingency, and rollback authority confirmed |
| `activity.c6.coordinate-deployment` | Coordinate Deployment | Yes | Command structure active and deployment actions governed |
| `activity.c6.assess-incident` | Assess Early Operational Incident | Yes | Impact, evidence, containment, communications, and decision threshold documented |
| `activity.c6.recommend-deployment-path` | Recommend Continue, Pause, Restrict, or Roll Back | Yes | Authoritative deployment decision submitted with evidence |
| `activity.c6.manage-hypercare` | Manage Hypercare and Stabilization | Yes | Incident, defect, support, adoption, vendor, risk, and ownership trends reviewed |
| `activity.c6.determine-hypercare-exit` | Determine Hypercare Exit | Yes | Exit recommendation based on criteria, trend, capacity, and ownership |
| `activity.c6.verify-acceptance` | Verify Formal Acceptance Evidence | Yes | Delivered scope, criteria, exceptions, documentation, support, and obligations traced |
| `activity.c6.transfer-residual-work` | Transfer Residual Risks and Actions | Yes | Every continuing item has an accepted owner, date, priority, capacity, and governance path |
| `activity.c6.confirm-operational-handover` | Confirm Operational Handover | Yes | Operational, technical, clinical, data, compliance, vendor, and support ownership accepted |
| `activity.c6.establish-benefits-monitoring` | Establish Benefits Monitoring | Yes | Measures, baselines, targets, data, owners, review cadence, and escalation defined |
| `activity.c6.reconcile-finance-procurement` | Reconcile Finance and Procurement | Yes | Actuals, commitments, invoices, claims, warranties, and contingency reconciled |
| `activity.c6.evaluate-vendor-performance` | Evaluate Vendor Performance | Yes | Evidence-based performance evaluation completed |
| `activity.c6.facilitate-lessons` | Facilitate Lessons Learned | Yes | Validated lessons, recommendations, positive practices, and improvement owners recorded |
| `activity.c6.update-organizational-assets` | Update Organizational Process Assets | Yes | Required standards, templates, controls, or guidance changes identified |
| `activity.c6.plan-resource-release` | Plan Resource Release and Recognition | Yes | Release sequence, continuity, feedback, recognition, and remaining obligations documented |
| `activity.c6.prepare-final-report` | Prepare Final Project Report | Yes | Delivery, acceptance, performance, obligations, benefits, finance, learning, and ownership summarized |
| `activity.c6.recommend-closure` | Recommend Formal Project Closure | Yes | Closure decision submitted with evidence that temporary governance can end safely |
| `activity.c6.final-reflection` | Complete Final Simulation Reflection | Yes | Learner evaluates cumulative decisions, outcomes, professional judgment, and transfer to practice |

## 11. Prerequisite and Sequencing Rules

1. A chapter activity cannot become available before the chapter is unlocked.
2. Required preparation activities must complete before dependent meetings or decisions where specified.
3. A decision-support activity may complete when evidence is prepared, but the related decision remains pending until submitted and resolved.
4. Outcome-dependent activities become available only after the authoritative outcome exists.
5. A reopened activity must preserve prior completion evidence and reason for reopening.
6. Chapter completion must use required activity IDs from the pinned content package.
7. Optional activities cannot block chapter progression.
8. Activities may span sessions but must retain one stable identity.

## 12. Completion Evidence Rules

Completion evidence may include:

- reviewed document IDs and versions;
- completed meeting IDs;
- authored response records;
- created or updated artifact status;
- resolved decision IDs;
- accepted action ownership;
- submitted reflection;
- authoritative event or state transition.

Completion may not rely solely on:

- opening a tab;
- local browser state;
- optimistic UI updates;
- elapsed wall-clock time;
- an informational message read receipt;
- duplicated completion flags maintained by separate surfaces.

## 13. Experience-Level Tailoring

### Explorer

- visible prerequisites and evidence checklist;
- plain-language activity purpose;
- guided sequencing;
- optional hints and mentor prompts;
- warnings when a required dependency is incomplete.

### Practitioner

- standard prerequisites;
- moderate ambiguity in evidence quality;
- limited guidance;
- realistic competing priorities.

### Leader

- less explicit sequencing guidance;
- higher information density;
- politically complicated inputs;
- multiple viable activity approaches;
- no removal of required evidence or governance constraints.

## 14. Assessment Integration

Activities may produce assessment evidence for:

- value delivery;
- governance;
- stakeholder engagement;
- team leadership;
- planning integration;
- quality and acceptance;
- measurement and forecasting;
- uncertainty and risk;
- procurement and vendor management;
- communication;
- change control;
- benefits and closure;
- ethical and professional accountability.

Activity completion alone does not prove high performance. Assessment must consider the quality, timing, evidence, and consequences of the learner’s work.

## 15. Accessibility Requirements

Every activity must provide:

- clear title and purpose;
- required or optional status in text;
- accessible prerequisite and blocked-state explanation;
- estimated time expressed in text;
- accessible links to related evidence;
- keyboard-operable completion flow;
- screen-reader announcement of state changes;
- no color-only indication of urgency or completion.

## 16. Validation Requirements

The activity catalog passes validation only when:

1. every activity ID is unique;
2. every prerequisite resolves and produces no dependency cycle;
3. every required activity belongs to a valid chapter;
4. every completion condition is deterministic and authoritative;
5. linked meetings, documents, decisions, and learning objectives resolve;
6. informational messages cannot complete decision-linked activities;
7. chapter completion references the correct required activities;
8. Completed History is derivable from activity completion;
9. cross-surface status is consistent;
10. experience-level guidance does not alter required authoritative outcomes;
11. accessibility metadata is complete;
12. Chapter One IDs remain backward compatible.

## 17. Implementation Boundary

This catalog does not authorize:

- a second activity completion store;
- client-calculated chapter progress;
- hidden automatic completion of required work;
- activity definitions that resolve decisions;
- direct mutation from inbox, meetings, or local UI state;
- case-specific completion logic inside shared Workplace components.
