# BC-006 Phase 1 — Northstar Meeting Catalog

**Status:** Draft for implementation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Canonical meeting definitions for the complete Northstar Connected Care flagship simulation.

**Canonical dependencies:**
- `00_Full_Simulation_Blueprint.md`
- `01_Chapter_Two.md`
- `02_Chapter_Three.md`
- `03_Chapter_Four.md`
- `04_Chapter_Five.md`
- `05_Chapter_Six.md`
- `06_Stakeholder_Story_Arcs.md`
- `07_Project_Timeline.md`
- `09_Inbox_Catalog.md`
- `10_Document_Catalog.md`
- `11_Activity_Catalog.md`
- `12_PMBOK_Guide_Eighth_Edition_Mapping.md`
- `13_Narrative_Validation.md`

---

## 1. Purpose

This document defines the authoritative meeting catalog for the complete six-chapter Northstar Connected Care simulation.

Meetings are workplace events through which the learner interprets evidence, engages stakeholders, prepares recommendations, establishes commitments, and advances the project. They must not function as decorative narrative scenes or isolated UI interactions.

Every meeting must:

- exist within the canonical Northstar chronology;
- have a stable identifier;
- belong to one chapter;
- have a defined purpose and participant set;
- expose relevant evidence and stakeholder positions;
- produce explicit outputs, commitments, or follow-up actions;
- preserve stakeholder trust and prior commitments;
- connect to authoritative activities, documents, decisions, and project state;
- avoid creating duplicate or competing decision truth;
- remain consistent across Explorer, Practitioner, and Leader modes.

---

## 2. Meeting Model

### 2.1 Stable identity

Each meeting must use a stable case-scoped identifier in the following form:

```text
meeting.<chapter-or-purpose>.<specific-name>
```

Examples:

```text
meeting.program-kickoff
meeting.planning.scope-requirements
meeting.recovery.steering-review
meeting.closure.final-steering-review
```

Identifiers must not depend on display text, UI location, calendar date, or stakeholder name.

### 2.2 Canonical meeting fields

Each implementation-ready meeting definition must support at least:

- `meeting_id`;
- `chapter_id`;
- title;
- purpose;
- narrative trigger;
- participant stakeholder IDs;
- required preparation;
- agenda items;
- evidence available before or during the meeting;
- stakeholder positions and likely tensions;
- learner responsibilities;
- required outputs;
- related activity IDs;
- related document IDs;
- related decision-definition IDs;
- completion criteria;
- estimated duration;
- required or optional status;
- experience-level tailoring;
- accessibility summary;
- consequence or state dependencies where applicable.

### 2.3 Meeting status lifecycle

The authoritative meeting lifecycle is:

```text
locked -> available -> in_progress -> completed
```

Where supported, an optional `missed` or `deferred` state may be used only when the content contract explicitly defines the consequence and recovery path.

A meeting becomes `completed` only when its completion contract is satisfied. Opening the meeting, reading the agenda, or navigating away must not mark it complete.

### 2.4 Decision boundaries

Meetings may:

- prepare a learner for a decision;
- reveal evidence relevant to a decision;
- record discussion and commitments;
- produce a recommendation;
- trigger the availability of a decision object;
- communicate an already-authorized outcome.

Meetings may not:

- create a second local decision state;
- count an agenda item as a completed decision;
- mark a decision complete because the meeting was attended;
- substitute a meeting note for an authoritative decision record;
- duplicate a decision already surfaced in Inbox, Mission Control, or the Decision workspace.

One authoritative decision may be referenced from multiple workplace surfaces, but it must resolve exactly once.

### 2.5 Informational versus decision-bearing meetings

A meeting is **informational** when it shares context, aligns participants, or reviews status without requiring a learner decision.

A meeting is **decision-bearing** when its explicit outcome requires one or more authoritative decision objects.

The meeting catalog must make this distinction visible. A required meeting can still be informational. Informational meetings must never increase pending-decision counts.

---

## 3. Catalog Summary

| Chapter | Meeting Count | Primary Narrative Function |
|---|---:|---|
| Chapter 1 — Initiation | 1 | Establish project purpose, evidence, stakeholders, and initial authority |
| Chapter 2 — Planning | 9 | Build and approve an integrated planning baseline |
| Chapter 3 — Early Execution | 5 | Mobilize delivery and test the quality of planning |
| Chapter 4 — Mid-Project Recovery | 4 | Diagnose deterioration and authorize recovery |
| Chapter 5 — Delivery and Readiness | 6 | Prove readiness and recommend a deployment path |
| Chapter 6 — Closure and Benefits | 7 | Deploy, stabilize, transition, accept, and close responsibly |
| **Total** | **32** | Complete Northstar project lifecycle |

---

# 4. Chapter 1 — Initiation Meetings

## 4.1 Connected Care Program Kickoff

**Meeting ID:** `meeting.program-kickoff`  
**Chapter:** `chapter-01`  
**Required:** Yes  
**Estimated duration:** 70 minutes narrative time; compressed learner interaction 10–15 minutes  
**Classification:** Preparation and alignment; decision-supporting

### Purpose

Align the learner and core stakeholders on the Connected Care Access Program, the access problem, current evidence, unresolved constraints, and the decisions required to establish the project.

### Trigger

Chapter One begins and the learner has reviewed the Program Authorization Summary and initial evidence pack.

### Participants

- Elena Marquez — Executive Sponsor
- Marcus Reed — Program Director, Strategic Transformation
- Renee Wallace — Vice President of Patient Access
- Dr. Samuel Ortiz — Clinical Leadership representative
- Priya Shah — Technology leader
- learner project manager

### Required preparation

- Program Authorization Summary
- Initial Business Case
- Access Performance Dashboard
- Stakeholder Briefing

### Agenda

1. Program authorization and business problem
2. Current access-performance signals
3. Clinical, operational, technical, privacy, and patient concerns
4. Learner authority and governance boundaries
5. Decisions required for objective, delivery approach, and governance

### Stakeholder tensions

- sponsor urgency versus incomplete evidence;
- operational pain versus broader strategic outcomes;
- technical delivery focus versus workflow change;
- speed versus privacy, safety, and adoption requirements.

### Required outputs

- confirmed learner mandate;
- documented open questions;
- recognized stakeholder concerns;
- evidence gaps recorded;
- Chapter One decision preparation completed.

### Related decisions

- `decision.define-objective`
- `decision.select-delivery-approach`
- `decision.establish-governance`

### Completion criteria

The meeting is completed when the learner reviews the agenda, acknowledges core stakeholder concerns, and records or confirms the required follow-up actions. Decision completion remains separate.

---

# 5. Chapter 2 — Planning Meetings

## 5.1 Planning Kickoff Workshop

**Meeting ID:** `meeting.planning.kickoff`  
**Required:** Yes  
**Classification:** Actionable; planning initiation

### Purpose

Establish the integrated planning process, workstreams, responsibilities, working assumptions, and decision cadence.

### Participants

- learner
- Program Director
- PMO representative
- Clinical lead
- Operations lead
- Technology lead
- Privacy and Compliance lead
- Finance representative
- Vendor lead
- Business Analyst

### Required preparation

- approved or conditional charter;
- Chapter One decision record;
- initial stakeholder register;
- assumptions and constraints log;
- initial risk register.

### Agenda

1. Chapter One carryover review
2. Planning workstreams and owners
3. Working norms and integration cadence
4. Evidence gaps and assumptions
5. Escalation and approval path
6. Planning deliverables and due sequence

### Required outputs

- planning responsibility matrix;
- planning calendar;
- working assumptions log;
- decision and escalation path;
- immediate planning actions.

### Related activities

- review Chapter One carryover;
- assign planning ownership;
- define planning assumptions.

### Completion criteria

All planning workstreams have accountable owners and unresolved initiation gaps have an explicit treatment path.

---

## 5.2 Scope and Requirements Alignment Workshop

**Meeting ID:** `meeting.planning.scope-requirements`  
**Required:** Yes  
**Classification:** Decision-preparation

### Purpose

Align strategic objectives with clinical, operational, technical, privacy, patient-experience, and adoption requirements.

### Participants

- learner
- Business Owner or Product representative
- Clinical lead
- Operations lead
- Technology lead
- Privacy and Compliance lead
- Patient Experience lead
- Change and Adoption lead
- Business Analyst
- Vendor representative as appropriate

### Required preparation

- business case;
- initial objective decision;
- workflow evidence;
- scope assumptions;
- stakeholder requirements;
- privacy and data-use constraints.

### Agenda

1. Confirm intended outcomes and success measures
2. Review user and workflow needs
3. Identify regulatory and privacy boundaries
4. Separate required, optional, and deferred scope
5. Surface exclusions and unresolved conflicts
6. Establish prioritization method

### Stakeholder tensions

- broad strategic scope versus minimum viable delivery;
- patient access versus operational standardization;
- vendor standard product versus customization;
- early commitment versus incomplete requirements.

### Required outputs

- scope statement draft;
- requirements categories;
- exclusions and deferred scope;
- unresolved requirement conflicts;
- scope decision preparation.

### Related decisions

- scope baseline strategy;
- launch-target communication where scope affects timing.

### Completion criteria

The learner has established explicit scope boundaries or documented unresolved conflicts that require governance action.

---

## 5.3 Governance and Decision-Rights Session

**Meeting ID:** `meeting.planning.governance-rights`  
**Required:** Yes  
**Classification:** Decision-bearing

### Purpose

Define decision authority, approval thresholds, escalation paths, reporting expectations, and change-control governance.

### Participants

- learner
- Executive Sponsor or delegate
- Program Director
- PMO representative
- Finance
- Procurement
- Privacy and Compliance
- Business Owner

### Required preparation

- preliminary governance model;
- learner authority boundaries;
- organizational policy;
- decision categories;
- escalation scenarios.

### Agenda

1. Decision categories and delegated authority
2. Steering committee responsibilities
3. Financial and contractual thresholds
4. Privacy, safety, and compliance authority
5. Escalation triggers
6. Change-control path
7. Reporting and decision-record expectations

### Required outputs

- governance model;
- decision authority matrix;
- steering committee cadence;
- change-control route;
- escalation matrix.

### Related decisions

- governance and escalation model.

### Completion criteria

Decision rights are documented and accepted by the appropriate stakeholders. Attendance alone does not resolve the related decision.

---

## 5.4 Risk and Dependency Workshop

**Meeting ID:** `meeting.planning.risk-dependency`  
**Required:** Yes  
**Classification:** Actionable; evidence generation

### Purpose

Identify major uncertainty, dependencies, regulatory concerns, vendor assumptions, operational constraints, and escalation triggers.

### Participants

- learner
- workstream leads
- Business Analyst
- Vendor lead
- Privacy and Compliance
- Operations
- Technology
- Change and Adoption
- PMO

### Required preparation

- current risk register;
- assumptions and constraints log;
- milestone concept;
- vendor assumptions;
- technical dependency information;
- operational calendar constraints.

### Agenda

1. Review known risks and assumptions
2. Identify cross-functional dependencies
3. Examine external and vendor dependencies
4. Assign owners
5. Define probability, impact, urgency, and triggers
6. Identify contingency and escalation needs

### Required outputs

- expanded risk register;
- dependency map;
- assigned risk owners;
- escalation triggers;
- assumptions requiring validation.

### Completion criteria

Material risks and dependencies have owners and are connected to schedule, scope, quality, or governance impacts.

---

## 5.5 Schedule and Resource Planning Session

**Meeting ID:** `meeting.planning.schedule-resource`  
**Required:** Yes  
**Classification:** Actionable; integrated planning

### Purpose

Develop credible milestone sequencing, resource assumptions, vendor dependencies, and delivery confidence.

### Participants

- learner
- workstream leads
- PMO scheduler or analyst
- Finance
- Operations
- Technology
- Clinical representative
- Vendor lead

### Required preparation

- scope decomposition;
- dependency map;
- resource availability;
- procurement assumptions;
- quality and testing needs;
- operational blackout periods.

### Agenda

1. Milestone sequence
2. Dependency and critical-path review
3. Resource availability and constraints
4. Vendor and procurement timing
5. Testing, training, and readiness duration
6. Estimate confidence and contingency
7. Target dates versus committed dates

### Required outputs

- milestone schedule;
- resource assumptions;
- critical dependencies;
- estimate confidence statement;
- schedule risks and contingency needs.

### Related decisions

- launch-target communication;
- planning baseline approval recommendation.

### Completion criteria

The schedule exposes dependencies, confidence, and resource constraints rather than presenting unsupported certainty.

---

## 5.6 Quality and Acceptance Planning Session

**Meeting ID:** `meeting.planning.quality-acceptance`  
**Required:** Yes  
**Classification:** Decision-preparation

### Purpose

Define how quality, clinical safety, privacy, testing, readiness, responsible technology use, and acceptance will be demonstrated.

### Participants

- learner
- Quality lead
- Clinical lead
- Privacy and Compliance lead
- Technology lead
- Operations lead
- Vendor lead
- Patient Experience representative

### Required preparation

- scope and requirements;
- policy and compliance constraints;
- proposed delivery approach;
- testing assumptions;
- vendor quality commitments.

### Agenda

1. Quality objectives
2. Acceptance criteria ownership
3. Clinical safety and workflow validation
4. Privacy, security, and traceability evidence
5. Test levels and defect governance
6. Operational readiness evidence
7. Responsible AI and automation controls
8. Acceptance authority

### Required outputs

- quality strategy;
- acceptance criteria framework;
- test and readiness approach;
- evidence ownership;
- responsible technology checkpoints.

### Related decisions

- quality and acceptance threshold.

### Completion criteria

Acceptance is defined through evidence and authority, not only completion of technical tasks.

---

## 5.7 Procurement and Vendor Planning Review

**Meeting ID:** `meeting.planning.procurement-vendor`  
**Required:** Yes  
**Classification:** Decision-bearing

### Purpose

Confirm vendor scope, responsibilities, onboarding needs, commercial dependencies, performance expectations, and escalation routes.

### Participants

- learner
- Procurement
- Finance
- Legal or commercial advisor as needed
- Technology lead
- Operations representative
- Vendor Engagement Lead
- Program Director

### Required preparation

- proposed statement of work;
- vendor proposal;
- responsibility assumptions;
- schedule dependencies;
- acceptance expectations;
- procurement policy.

### Agenda

1. Scope and deliverables
2. Internal and vendor responsibility boundaries
3. Staffing and onboarding
4. Acceptance and payment linkage
5. Reporting and performance measures
6. Change and claim process
7. Escalation and corrective-action expectations

### Required outputs

- procurement plan;
- vendor responsibility matrix;
- documented contract assumptions;
- performance and escalation expectations;
- disputed responsibilities requiring decision.

### Related decisions

- vendor responsibility boundary.

### Completion criteria

Responsibility disputes are either resolved through the authoritative decision or explicitly escalated. The meeting itself does not finalize contract changes.

---

## 5.8 Integrated Plan Challenge Review

**Meeting ID:** `meeting.planning.integrated-challenge`  
**Required:** Yes  
**Classification:** Preparation required; challenge review

### Purpose

Test the credibility, integration, and readiness of the proposed planning baseline before formal approval.

### Participants

- learner
- Program Director
- PMO
- selected workstream leads
- Finance
- Quality
- Privacy and Compliance
- Operations
- Vendor lead

### Required preparation

- complete draft project management plan;
- scope baseline;
- schedule;
- risk and dependency information;
- quality and acceptance strategy;
- procurement plan;
- communications and stakeholder plans;
- benefits measurement draft.

### Agenda

1. Baseline integration review
2. Assumption and confidence challenge
3. Scope, schedule, cost, and quality trade-offs
4. Residual risk and contingency
5. Governance and readiness gaps
6. Required revisions

### Required outputs

- challenged assumptions;
- required corrections;
- accepted residual risks;
- unresolved objections;
- readiness recommendation for steering approval.

### Completion criteria

All material objections are resolved, accepted as residual risk, or documented for steering committee disposition.

---

## 5.9 Steering Committee Planning Approval

**Meeting ID:** `meeting.planning.steering-approval`  
**Required:** Yes  
**Classification:** Decision-bearing; chapter gate

### Purpose

Secure formal approval, conditional approval, deferral, or rejection of the integrated planning baseline.

### Participants

- Executive Sponsor
- Steering committee members
- learner
- Program Director
- Business Owner
- Finance
- Operations
- Technology
- Clinical leadership
- Privacy and Compliance
- PMO

### Required preparation

- planning baseline approval package;
- residual-risk statement;
- decision log;
- unresolved issues;
- learner recommendation.

### Agenda

1. Business value and scope
2. Schedule and confidence
3. Budget and contingency
4. Quality, privacy, safety, and readiness
5. Procurement and vendor posture
6. Stakeholder and adoption readiness
7. Residual risks and requested decisions
8. Approval recommendation

### Required outputs

- approved, conditionally approved, deferred, or rejected baseline;
- conditions and corrective actions;
- accountable owners;
- authorized tolerances;
- Chapter Three entry decision.

### Related decisions

- planning baseline approval recommendation.

### Completion criteria

The authoritative approval decision has resolved and required follow-up conditions have been recorded.

---

# 6. Chapter 3 — Early Execution Meetings

## 6.1 Execution Kickoff Meeting

**Meeting ID:** `meeting.execution.kickoff`  
**Required:** Yes  
**Classification:** Actionable

### Purpose

Activate workstreams, confirm ownership, launch reporting cadence, and translate the approved baseline into coordinated delivery.

### Participants

- learner
- Sponsor delegate
- Product or Business Owner
- Clinical lead
- Technology lead
- Operations lead
- PMO
- Vendor Delivery Lead

### Required preparation

- approved integrated plan;
- responsibility matrix;
- milestone schedule;
- communications plan;
- risk register;
- vendor onboarding plan.

### Required outputs

- activated workstreams;
- confirmed execution cadence;
- confirmed escalation routes;
- immediate mobilization actions;
- open dependency list.

### Completion criteria

Workstreams have accountable leads, first actions, and a shared reporting rhythm.

---

## 6.2 Vendor Mobilization Review

**Meeting ID:** `meeting.execution.vendor-mobilization`  
**Required:** Yes  
**Classification:** Decision-bearing

### Purpose

Evaluate vendor staffing, substitution, onboarding, reporting, contractual alignment, and schedule impact.

### Participants

- learner
- Vendor Delivery Lead
- Procurement
- Technology lead
- PMO
- relevant workstream owners

### Required preparation

- vendor onboarding record;
- approved staffing commitments;
- responsibility matrix;
- schedule dependencies;
- contract assumptions.

### Required outputs

- accepted or revised mobilization plan;
- documented staffing and capability assessment;
- confirmed reporting cadence;
- remediation or escalation actions.

### Related decisions

- vendor substitution approval or escalation.

### Completion criteria

The staffing change has an authoritative disposition and all resulting impacts are recorded.

---

## 6.3 Cross-Functional Dependency Review

**Meeting ID:** `meeting.execution.dependency-review`  
**Required:** Yes  
**Classification:** Actionable

### Purpose

Surface hidden dependencies, investigate conflicting progress reports, and assign ownership for emerging issues.

### Participants

- learner
- Clinical workstream
- Operations workstream
- Technology workstream
- Vendor team
- Business Analyst
- PMO

### Required preparation

- current schedule;
- workstream status;
- dependency log;
- risk and issue log;
- communications evidence.

### Required outputs

- updated dependency log;
- corrected schedule assumptions;
- new risks and issues;
- owners and due dates;
- communication corrective actions.

### Completion criteria

Critical dependencies are visible and no material issue remains assigned only to a generic team.

---

## 6.4 First Quality Review Meeting

**Meeting ID:** `meeting.execution.first-quality-review`  
**Required:** Yes  
**Classification:** Decision-preparation

### Purpose

Evaluate the first major deliverable against agreed quality, privacy, safety, usability, and acceptance criteria.

### Participants

- learner
- Quality lead
- Clinical representative
- Technology lead
- Operations representative
- Privacy and Compliance as needed
- Vendor lead

### Required preparation

- deliverable package;
- quality checklist;
- acceptance criteria;
- test evidence;
- defect or nonconformance log.

### Required outputs

- documented quality findings;
- evidence gaps;
- remediation actions;
- acceptance recommendation;
- responsible owners.

### Related decisions

- first deliverable acceptance recommendation.

### Completion criteria

The quality review record is complete and supports an evidence-based acceptance decision.

---

## 6.5 Executive Progress Review

**Meeting ID:** `meeting.execution.executive-progress`  
**Required:** Yes  
**Classification:** Decision-supporting

### Purpose

Present an accurate view of delivery progress, quality, risks, schedule confidence, and corrective action without hiding uncertainty.

### Participants

- Executive Sponsor
- Program Director
- learner
- PMO
- selected workstream leads
- Finance or Quality as needed

### Required preparation

- current status report;
- schedule forecast;
- quality findings;
- risk and issue updates;
- acceptance recommendation.

### Required outputs

- accepted executive status narrative;
- documented direction;
- escalation decisions;
- confirmed next-milestone expectations.

### Completion criteria

The learner has provided decision-useful reporting and documented leadership direction. A positive message alone is not completion.

---

# 7. Chapter 4 — Mid-Project Recovery Meetings

## 7.1 Recovery Triage Meeting

**Meeting ID:** `meeting.recovery.triage`  
**Required:** Yes  
**Classification:** Escalation; actionable

### Purpose

Establish a shared, evidence-based understanding of project deterioration, separate facts from assumptions, and authorize immediate containment work.

### Participants

- learner
- Delivery lead
- Technology lead
- Vendor lead
- Quality or Compliance representative
- Business Owner or Product representative
- PMO

### Required preparation

- project health assessment;
- variance data;
- issue log;
- risk register;
- vendor status;
- quality and compliance findings.

### Agenda

1. Current health and variance
2. Immediate risks and active issues
3. Containment priorities
4. Information gaps
5. Ownership and escalation
6. Recovery-planning path

### Required outputs

- confirmed problem statement;
- immediate containment actions;
- named owners;
- information gaps;
- escalation list.

### Related decisions

- immediate containment.

### Completion criteria

Immediate deterioration is controlled or explicitly escalated, and the authoritative containment decision is recorded.

---

## 7.2 Vendor Recovery Meeting

**Meeting ID:** `meeting.recovery.vendor`  
**Required:** Yes  
**Classification:** Decision-bearing; negotiation

### Purpose

Address missed vendor commitments, establish accountability, evaluate contractual options, and negotiate a feasible recovery path.

### Participants

- learner
- Vendor lead
- Procurement
- Legal or commercial advisor
- Technology owner
- Program Director
- Finance as needed

### Required preparation

- contract and statement of work;
- vendor performance evidence;
- issue history;
- acceptance criteria;
- cost and schedule impact;
- prior commitments.

### Required outputs

- vendor corrective-action proposal;
- revised commitments;
- commercial implications;
- unresolved disputes;
- escalation trigger.

### Related decisions

- vendor response;
- recovery strategy.

### Completion criteria

The vendor response has a formal disposition, owners, dates, evidence requirements, and escalation rules.

---

## 7.3 Change Control Review

**Meeting ID:** `meeting.recovery.change-control`  
**Required:** Yes  
**Classification:** Decision-bearing

### Purpose

Evaluate a late strategic change request through integrated change control.

### Participants

- learner
- Change Control authority or steering delegates
- Business Owner
- Finance
- Technology
- Operations
- Quality and Compliance
- PMO
- Vendor representative where affected

### Required preparation

- formal change request;
- integrated impact assessment;
- options analysis;
- recommendation;
- required authority.

### Agenda

1. Requested outcome and rationale
2. Scope, schedule, cost, quality, resource, and risk impact
3. Compliance and procurement implications
4. Alternatives and phasing options
5. Recommendation
6. Approval route and baseline effects

### Required outputs

- impact assessment;
- disposition recommendation;
- approval route;
- decision record;
- baseline-update instructions after authorization.

### Related decisions

- change request disposition.

### Completion criteria

The change has an authoritative disposition. Baselines remain unchanged until approval is complete.

---

## 7.4 Steering Committee Recovery Review

**Meeting ID:** `meeting.recovery.steering-review`  
**Required:** Yes  
**Classification:** Decision-bearing; chapter gate

### Purpose

Authorize, conditionally authorize, return, or reject the integrated recovery direction.

### Participants

- Executive Sponsor
- Steering committee
- learner
- Program Director
- Business Owner
- Finance
- Operations
- Technology
- Quality and Compliance
- Procurement
- Vendor leadership as appropriate

### Required preparation

- mid-project health assessment;
- root-cause analysis;
- recovery plan;
- revised forecast;
- vendor corrective-action plan;
- change requests;
- regulatory or privacy assessment;
- residual risks.

### Agenda

1. Evidence-based current state
2. Root causes
3. Recovery options and trade-offs
4. Funding and schedule impact
5. Vendor accountability
6. Quality, privacy, and compliance protections
7. Stakeholder recovery
8. Learner recommendation
9. Authorization and conditions

### Required outputs

- formal recovery decision;
- conditions of approval;
- authorized tolerances;
- communication direction;
- accountable owners;
- next review date;
- Chapter Five readiness path.

### Related decisions

- recovery strategy;
- steering committee commitment.

### Completion criteria

The recovery decision has resolved and all approval conditions are represented in authoritative project state or assigned follow-up activities.

---

# 8. Chapter 5 — Delivery and Readiness Meetings

## 8.1 Recovery Progress Review

**Meeting ID:** `meeting.readiness.recovery-progress`  
**Required:** Yes  
**Classification:** Actionable; evidence review

### Purpose

Evaluate whether approved recovery commitments produced durable improvement and establish an honest executive communication position.

### Participants

- Sponsor
- learner
- PMO
- workstream leads
- Finance
- Vendor lead

### Required preparation

- recovery action tracker;
- updated forecast;
- quality and risk trends;
- vendor performance;
- stakeholder indicators.

### Required outputs

- recovery-action status;
- variance explanation;
- unresolved exposure;
- updated forecast;
- executive communication position.

### Related decisions

- recovery communication position.

### Completion criteria

Confirmed improvement is separated from incomplete or uncertain recovery.

---

## 8.2 Readiness Working Session

**Meeting ID:** `meeting.readiness.working-session`  
**Required:** Yes  
**Classification:** Actionable

### Purpose

Consolidate readiness evidence across functions, sites, and deployment waves.

### Participants

- learner
- Operations
- Technology
- Clinical representatives
- Training lead
- Change lead
- Quality
- Support teams
- Vendor
- Privacy and Compliance as needed

### Required preparation

- readiness criteria;
- site data;
- training evidence;
- operating procedures;
- support model;
- technical test status;
- compliance evidence.

### Required outputs

- readiness criteria by domain;
- evidence owners;
- gap register;
- remediation actions;
- target review dates;
- segmented readiness view.

### Related decisions

- readiness segmentation.

### Completion criteria

Readiness gaps are visible by domain and location, with owners and remediation paths.

---

## 8.3 Defect and Quality Review

**Meeting ID:** `meeting.readiness.defect-quality`  
**Required:** Yes  
**Classification:** Decision-bearing

### Purpose

Classify unresolved defects and exceptions and determine release-blocking, workaround, residual-risk, or change-control disposition.

### Participants

- learner
- Quality lead
- Technology lead
- Operations representative
- Vendor
- Compliance as required
- Clinical representative where patient workflow is affected

### Required preparation

- defect and exception register;
- test evidence;
- severity criteria;
- workarounds;
- acceptance criteria;
- residual-risk authority.

### Required outputs

- severity and impact classification;
- release-blocking determination;
- workaround validation;
- owners and due dates;
- accepted residual risks;
- change requests where required.

### Related decisions

- defect disposition.

### Completion criteria

Every material defect has a traceable, authorized disposition.

---

## 8.4 Adoption Escalation Meeting

**Meeting ID:** `meeting.readiness.adoption-escalation`  
**Required:** Yes  
**Classification:** Escalation; stakeholder engagement

### Purpose

Understand and respond to frontline concerns about workflow, training, staffing, burden, trust, and local readiness.

### Participants

- learner
- affected frontline representatives
- operational managers
- Change lead
- Training lead
- Patient Experience representative
- Sponsor delegate as needed

### Required preparation

- training attendance and effectiveness data;
- pilot feedback;
- adoption issue log;
- workflow concerns;
- manager engagement indicators.

### Required outputs

- documented concerns;
- root causes;
- workflow, training, or support interventions;
- communication commitments;
- feedback and follow-up plan.

### Related decisions

- adoption response strategy.

### Completion criteria

Resistance is translated into owned actions rather than dismissed as attitude or treated only as a communications problem.

---

## 8.5 Vendor Commercial and Support Review

**Meeting ID:** `meeting.readiness.vendor-commercial-support`  
**Required:** Yes  
**Classification:** Decision-bearing; negotiation

### Purpose

Resolve responsibility for stabilization, support, remediation, knowledge transfer, and transition obligations.

### Participants

- learner
- Procurement
- Legal or commercial advisor
- Vendor lead
- Technology owner
- Operations or Support owner
- Finance as needed

### Required preparation

- contract and statements of work;
- approved changes;
- issue and defect history;
- documented commitments;
- acceptance criteria;
- vendor claim.

### Required outputs

- contract interpretation;
- responsibility determination;
- negotiated action plan;
- approved commercial changes where needed;
- relationship-risk response.

### Related decisions

- vendor obligation disposition.

### Completion criteria

The disputed obligations have an authoritative and documented outcome.

---

## 8.6 Integrated Readiness Review

**Meeting ID:** `meeting.readiness.integrated-review`  
**Required:** Yes  
**Classification:** Decision-bearing; chapter gate

### Purpose

Evaluate integrated evidence and determine whether Northstar should proceed to full, phased, limited, pilot-first, conditional, or delayed deployment.

### Participants

- Sponsor
- Steering committee
- learner
- Operational owner
- Technology owner
- Quality
- Compliance
- Clinical leadership
- Training and Change leads
- Support lead
- Vendor
- Finance

### Required preparation

- integrated readiness checklist;
- site readiness scorecards;
- defect and exception register;
- residual risks;
- training effectiveness report;
- support operating model;
- vendor obligation assessment;
- deployment options analysis;
- contingency and rollback plan;
- executive decision brief.

### Agenda

1. Readiness by domain and site
2. Testing and defect status
3. Privacy, security, safety, and compliance
4. Operations, support, and ownership
5. Training and adoption
6. Vendor readiness
7. Residual risks and workarounds
8. Deployment options
9. Contingency and rollback
10. Learner recommendation

### Required outputs

- readiness status by domain;
- unresolved risks and defects;
- deployment recommendation;
- approval conditions;
- formal risk acceptances;
- contingency and rollback readiness;
- Chapter Six entry state.

### Related decisions

- integrated readiness recommendation;
- deployment strategy recommendation.

### Completion criteria

The authoritative go-live or deployment-path decision has resolved and all conditions are traceable.

---

# 9. Chapter 6 — Closure and Benefits Meetings

## 9.1 Deployment Command Review

**Meeting ID:** `meeting.deployment.command-review`  
**Required:** Yes  
**Classification:** Actionable; authorization confirmation

### Purpose

Confirm that approved deployment conditions, authorities, participants, communication paths, contingency, and support structures are active.

### Participants

- learner
- Sponsor delegate
- Operational owner
- Technology lead
- Vendor
- Quality
- Communications
- Compliance
- Support lead

### Required preparation

- deployment authorization;
- readiness conditions;
- command-center plan;
- communication sequence;
- contingency and rollback plan;
- support roster;
- escalation matrix.

### Required outputs

- deployment authority confirmed;
- participant roles confirmed;
- decision thresholds confirmed;
- escalation contacts confirmed;
- communications confirmed;
- contingency and rollback authority confirmed.

### Completion criteria

All critical deployment roles and decision thresholds are explicitly acknowledged before execution begins.

---

## 9.2 Incident Coordination Meeting

**Meeting ID:** `meeting.deployment.incident-coordination`  
**Required:** Yes  
**Classification:** Escalation; decision-bearing

### Purpose

Assess the early deployment incident, contain impact, coordinate evidence, and prepare the continue, pause, restrict, contingency, or rollback decision.

### Participants

- learner
- Incident owner
- Technology lead
- Operations lead
- Vendor
- Quality
- Communications
- Compliance as required
- Clinical representative where care workflow is affected

### Required preparation

- incident notification;
- monitoring data;
- user reports;
- contingency thresholds;
- deployment plan;
- accepted workarounds;
- communication templates.

### Required outputs

- impact assessment;
- containment action;
- decision recommendation;
- communications;
- evidence record;
- next review time.

### Related decisions

- incident response strategy;
- continue, pause, restrict, or rollback.

### Completion criteria

The incident response and deployment-path decisions have authoritative outcomes with owners and communication actions.

---

## 9.3 Hypercare Review

**Meeting ID:** `meeting.deployment.hypercare-review`  
**Required:** Yes  
**Classification:** Decision-bearing

### Purpose

Evaluate stabilization progress, support demand, defect trends, adoption signals, knowledge transfer, and readiness to exit hypercare.

### Participants

- learner
- Operations
- Support
- Technology
- Vendor
- Training
- Change lead
- Quality
- Compliance as needed

### Required preparation

- hypercare dashboard;
- incident and defect trends;
- support-demand data;
- adoption indicators;
- open risks;
- knowledge-transfer status;
- ownership confirmation.

### Required outputs

- incident and defect trend assessment;
- support-capacity assessment;
- adoption status;
- open-risk disposition;
- knowledge-transfer status;
- hypercare exit recommendation.

### Related decisions

- hypercare exit.

### Completion criteria

Hypercare exit is based on evidence and accepted ownership, not only elapsed time.

---

## 9.4 Formal Acceptance Review

**Meeting ID:** `meeting.closure.formal-acceptance`  
**Required:** Yes  
**Classification:** Decision-bearing

### Purpose

Confirm product and deliverable acceptance, exceptions, continuing obligations, warranties, and approval authority.

### Participants

- Sponsor
- Business Owner
- Operational owner
- learner
- Quality
- Compliance
- Procurement
- Vendor
- Technology and Clinical representatives as needed

### Required preparation

- formal acceptance package;
- approved scope;
- acceptance criteria;
- quality results;
- unresolved defects and exceptions;
- documentation and training evidence;
- vendor obligations;
- support readiness.

### Required outputs

- accepted deliverables;
- conditions and exceptions;
- unresolved obligations;
- warranty or support terms;
- formal approval record.

### Related decisions

- acceptance position;
- residual work transfer.

### Completion criteria

The authoritative acceptance decision has resolved and every continuing obligation has an owner and governance path.

---

## 9.5 Benefits Transition Meeting

**Meeting ID:** `meeting.closure.benefits-transition`  
**Required:** Yes  
**Classification:** Actionable; ownership transfer

### Purpose

Transfer benefits measurement and accountability beyond project closure.

### Participants

- Business benefit owners
- Sponsor
- Finance
- Operations
- Data or Analytics representative
- learner
- Patient Experience representative as needed

### Required preparation

- benefits realization plan;
- benefit baseline;
- target values;
- current adoption and outcome data;
- measurement schedule;
- data-source definitions.

### Required outputs

- benefit definitions;
- baselines and targets;
- accountable owners;
- review dates;
- reporting and escalation approach;
- distinction between realized and forecast benefits.

### Related decisions

- benefits reporting position.

### Completion criteria

Named business owners explicitly accept post-project benefits accountability.

---

## 9.6 Lessons Learned Workshop

**Meeting ID:** `meeting.closure.lessons-learned`  
**Required:** Yes  
**Classification:** Reflection; continuous improvement

### Purpose

Capture reusable learning from initiation through closure and translate lessons into organizational improvement actions.

### Participants

- learner
- cross-functional project team
- operational stakeholders
- Vendor representative where appropriate
- PMO
- Quality and Compliance
- Sponsor or Program Director for selected portions

### Required preparation

- decision log;
- risk and issue history;
- stakeholder feedback;
- performance reports;
- vendor evaluation;
- recovery and readiness records;
- learner reflections.

### Agenda

1. Intended outcomes and actual journey
2. Assumptions and early decisions
3. Planning and governance
4. Team and stakeholder engagement
5. Quality, risk, and uncertainty
6. Vendor and procurement performance
7. Recovery and readiness
8. Deployment and transition
9. Benefits and adoption
10. Practices to preserve and improve

### Required outputs

- validated lessons;
- recommended process or standard changes;
- owners for improvement actions;
- knowledge-repository updates;
- positive practices to preserve.

### Completion criteria

Lessons are specific, evidence-based, balanced, and assigned where organizational action is required.

---

## 9.7 Final Steering Committee and Closure Review

**Meeting ID:** `meeting.closure.final-steering-review`  
**Required:** Yes  
**Classification:** Decision-bearing; final chapter gate

### Purpose

Approve or defer formal project closure and transfer all continuing accountability to operational, business, financial, procurement, and governance owners.

### Participants

- Steering committee
- Executive Sponsor
- learner
- Operational owner
- Business Owner
- Finance
- Procurement
- PMO
- Quality and Compliance
- Technology
- Vendor leadership as required

### Required preparation

- final project report;
- acceptance record;
- residual risk and issue transfer register;
- operational handover;
- benefits transition record;
- final financial report;
- procurement closure record;
- vendor performance evaluation;
- lessons learned;
- resource release plan;
- closure recommendation.

### Agenda

1. Delivered scope and accepted outcomes
2. Operational state and support ownership
3. Residual obligations, risks, and actions
4. Benefits status and ownership
5. Financial and procurement closure
6. Lessons learned and organizational actions
7. Resource release and recognition
8. Final success assessment
9. Closure recommendation

### Required outputs

- final performance assessment;
- acceptance confirmation;
- residual obligations and owners;
- benefits transition confirmation;
- financial and procurement status;
- closure authorization or required corrections.

### Related decisions

- vendor and financial closure;
- final closure recommendation.

### Completion criteria

The authoritative closure decision resolves and temporary project governance can end without abandoning unowned work.

---

## 10. Meeting-to-Chapter Gate Matrix

| Chapter | Gate Meeting | Required Gate Outcome |
|---|---|---|
| Chapter 1 | Connected Care Program Kickoff | Learner mandate and initial decision preparation established |
| Chapter 2 | Steering Committee Planning Approval | Integrated baseline approved, conditionally approved, deferred, or rejected |
| Chapter 3 | Executive Progress Review | First deliverable position and project health understood |
| Chapter 4 | Steering Committee Recovery Review | Recovery path authorized or returned for revision |
| Chapter 5 | Integrated Readiness Review | Deployment strategy authorized, conditioned, or delayed |
| Chapter 6 | Final Steering Committee and Closure Review | Closure approved or corrective work required |

A chapter gate must evaluate authoritative completion conditions. It must not rely on local UI flags or meeting attendance alone.

---

## 11. Meeting-to-Decision Traceability

| Meeting | Decision Relationship |
|---|---|
| Program Kickoff | Supports objective, delivery approach, and governance decisions |
| Governance and Decision-Rights Session | Prepares governance and escalation decision |
| Procurement and Vendor Planning Review | Prepares vendor responsibility decision |
| Steering Committee Planning Approval | Resolves planning-baseline recommendation |
| Vendor Mobilization Review | Resolves vendor substitution or escalation |
| First Quality Review | Prepares first deliverable acceptance |
| Recovery Triage | Resolves immediate containment |
| Vendor Recovery Meeting | Supports vendor response and recovery strategy |
| Change Control Review | Resolves change-request disposition |
| Steering Committee Recovery Review | Resolves recovery strategy and leadership commitment |
| Recovery Progress Review | Supports recovery communication position |
| Defect and Quality Review | Resolves defect dispositions |
| Vendor Commercial and Support Review | Resolves vendor obligation disposition |
| Integrated Readiness Review | Resolves readiness and deployment recommendation |
| Incident Coordination Meeting | Resolves incident response and deployment continuation |
| Hypercare Review | Resolves hypercare exit |
| Formal Acceptance Review | Resolves acceptance and residual-work transfer |
| Benefits Transition Meeting | Supports benefits reporting and ownership |
| Final Closure Review | Resolves financial/vendor closure and final closure recommendation |

This mapping is traceability only. It does not create separate meeting-owned decision records.

---

## 12. Experience-Level Tailoring

### Explorer

Explorer mode may provide:

- clear meeting purpose and expected outputs;
- definitions of unfamiliar governance, quality, procurement, and closure terms;
- visible preparation checklists;
- highlighted evidence sources;
- structured note-taking prompts;
- clearer distinction between discussion and decision;
- mentor guidance before high-impact meetings;
- explicit warnings when required evidence is missing.

Explorer mode must not select decisions or fabricate consensus.

### Practitioner

Practitioner mode should provide:

- realistic but manageable ambiguity;
- incomplete yet sufficient evidence;
- competing stakeholder perspectives;
- limited preparation prompts;
- multiple defensible meeting strategies;
- consequences for weak follow-through or unclear commitments.

### Leader

Leader mode should provide:

- politically framed statements;
- incomplete or conflicting evidence;
- stronger executive pressure;
- coalition behavior;
- contractual and governance ambiguity;
- narrower time for preparation;
- second-order stakeholder and project consequences;
- no guarantee that every conflict can be fully resolved.

Across all levels, the canonical meeting identity, project chronology, authoritative decisions, and required outputs remain the same.

---

## 13. Stakeholder Continuity Rules

Meeting dialogue and behavior must reflect accumulated state.

Examples:

- a sponsor becomes more directive after unreliable reporting;
- a clinical leader challenges readiness more aggressively after earlier concerns were ignored;
- a vendor becomes defensive after unsupported blame;
- Finance provides support when forecasts are transparent and controlled;
- Operations accepts phased deployment when local readiness differences are acknowledged;
- Quality and Compliance collaborate when involved early and escalate when shortcuts are hidden;
- team participation improves when ownership and priorities are clear;
- stakeholder trust changes the tone and difficulty of later meetings.

Meeting content must preserve prior commitments. A commitment made in one meeting should remain visible in later meetings, decision preparation, action tracking, and stakeholder conversations.

---

## 14. Accessibility and Learner Experience Requirements

Every meeting must support:

- accessible meeting title and summary;
- text-based agenda and dialogue;
- keyboard-accessible interaction;
- screen-reader-compatible participant identification;
- non-color-only status indicators;
- plain-language explanation where needed;
- transcript or structured notes when audio or rich media is used;
- clear required preparation;
- explicit completion feedback;
- honest empty and unavailable states.

The learner must be able to distinguish:

- unread preparation;
- meeting available;
- meeting in progress;
- follow-up required;
- meeting completed;
- related decision still pending;
- related decision resolved.

---

## 15. Implementation Obligations

The later BC-006 implementation phases must ensure that:

1. meeting definitions remain inside the Northstar content package;
2. shared platform code remains business-case neutral;
3. all meetings are scoped by business-case ID, content version, run ID, and chapter;
4. meeting status is authoritative and persisted through approved simulation commands and events;
5. meeting completion updates all affected workplace projections through the shared convergence model;
6. meetings never maintain a separate pending-decision count;
7. informational meetings do not create decisions;
8. decision-bearing meetings reference stable decision-definition IDs;
9. meeting outputs update or unlock canonical activities, documents, or decisions through explicit contracts;
10. hidden outcomes and consequence definitions are not exposed to the learner;
11. experience-level changes affect guidance and ambiguity, not authoritative story identity;
12. completion and chapter gating use authoritative state rather than local component state;
13. meeting history remains available after completion where the workplace design permits;
14. stakeholder statements and commitments remain traceable;
15. validation fails closed for missing or invalid cross-references.

---

## 16. Narrative Validation Rules

The meeting catalog is valid only when all of the following are true:

### Completeness

- all 32 canonical meetings exist;
- every chapter includes its required meetings;
- each chapter gate has one defined gate meeting;
- every required meeting has preparation, participants, outputs, and completion criteria.

### Chronology

- meetings occur in an order consistent with `07_Project_Timeline.md`;
- no meeting depends on evidence or decisions that are unavailable at that point;
- delayed consequences appear only after their originating action or decision.

### Cross-reference integrity

- participant stakeholder IDs exist;
- related documents exist in `10_Document_Catalog.md`;
- related activities exist in `11_Activity_Catalog.md`;
- related decisions exist in the later Decision System specification;
- Inbox references use existing meeting IDs;
- chapter IDs and content-version scoping are valid.

### Decision integrity

- no informational meeting creates a pending decision;
- no decision is duplicated because it appears in several meetings or workplace surfaces;
- meeting completion and decision resolution remain separate states;
- gate outcomes use authoritative decisions and project state.

### Narrative quality

- stakeholder positions are consistent with `06_Stakeholder_Story_Arcs.md`;
- meetings evolve from initiation through closure;
- outputs meaningfully affect later work;
- meetings contain realistic disagreement and trade-offs;
- no meeting exists solely to deliver textbook exposition;
- PMBOK Guide Eighth Edition concepts appear through applied work and judgment.

### Learner experience

- required preparation is discoverable;
- the learner understands why a meeting matters;
- completion conditions are visible;
- inaccessible or unavailable evidence is represented honestly;
- Explorer, Practitioner, and Leader tailoring preserves fairness.

---

## 17. Phase 1 Completion Statement

With this meeting catalog, the BC-006 Phase 1 narrative set contains the complete canonical foundation for:

- the six-chapter Northstar story;
- project chronology;
- stakeholder progression;
- meetings;
- Inbox communications;
- project documents;
- learner activities;
- PMBOK Guide Eighth Edition mapping;
- narrative validation.

Phase 1 may be treated as narratively complete after the documents are reviewed together and the validation criteria in `13_Narrative_Validation.md` are satisfied.
