# BC-006 Phase 1 — Northstar Inbox Catalog

**Status:** Draft for implementation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Canonical learner-facing inbox and communication sequence for the complete Northstar Connected Care simulation.

## 1. Purpose

This document defines the canonical inbox content required across all six Northstar chapters. It establishes stable message identities, message classifications, narrative triggers, stakeholder intent, linked evidence, response expectations, and decision relationships.

The inbox is a workplace communication surface. It is not a second decision system and it may not own authoritative project state.

All inbox items must remain consistent with:

- `00_Full_Simulation_Blueprint.md`;
- `01_Chapter_Two.md` through `05_Chapter_Six.md`;
- `06_Stakeholder_Story_Arcs.md`;
- `07_Project_Timeline.md`;
- `10_Document_Catalog.md`;
- `11_Activity_Catalog.md`;
- the authoritative decision and workplace projection contracts.

## 2. Canonical Inbox Rules

1. Every message has one stable, case-version-scoped identifier.
2. Informational messages never create pending decisions.
3. A message may reference a decision without becoming the decision itself.
4. A decision exists only when a valid authored `DecisionDefinition` is available through authoritative eligibility rules.
5. Actionable messages may create or support an activity without creating a decision.
6. Decision-triggering messages must link to exactly one explicit decision definition unless a documented compound-decision contract is approved.
7. A message may link to meetings and documents, but those links do not change completion state by themselves.
8. Read, unread, responded, completed, and archived are distinct presentation states.
9. Archiving removes an item from the active inbox view without deleting its history.
10. Messages and stakeholder conversations persist for the life of the simulation run.
11. Completed decisions must be represented consistently across Inbox, Mission Control, Decision Log, Meetings, Activities, and other affected projections.
12. The inbox may display consequences and follow-up communications only after the authoritative state makes them available.
13. Hidden outcomes, consequence definitions, scoring internals, and future branches may not appear in learner-facing message content.
14. Message availability must be deterministic from the pinned business-case version and authoritative simulation state.

## 3. Message Classification

| Classification | Meaning | Creates Decision? | Completion Behavior |
|---|---|---:|---|
| `informational` | Context, reminder, notice, status, or evidence with no required learner action | No | Read state only |
| `actionable` | Requires a non-decision task such as reviewing, updating, preparing, or replying | No | Completes through an authored activity or response contract |
| `preparation_required` | Requires preparation for a meeting, review, presentation, or decision | No | Completes through the linked preparation activity |
| `escalation` | Communicates a threshold breach or requests formal attention | Not by itself | May unlock an activity, meeting, or separate decision |
| `decision_triggering` | Presents an explicit choice within the learner’s authority or requests a recommendation | Yes, through linked decision definition | Resolved only by the authoritative decision lifecycle |

A message marked `decision_triggering` must contain:

- a linked decision definition ID;
- a clear decision owner or recommendation role;
- the evidence available at that point;
- any authority limit;
- the response or decision deadline expressed as a narrative condition;
- no embedded answer key or hidden outcome.

## 4. Canonical Message Contract

Each message definition must provide:

- `id`;
- `chapterId`;
- `learnerSession`;
- `senderStakeholderId`;
- `channel`;
- `subject`;
- authored body or body variant references;
- `classification`;
- `urgency`;
- `availableWhen`;
- `expiresWhen`, when applicable;
- `requiresResponse`;
- `relatedDecisionId`, when applicable;
- `relatedMeetingId`, when applicable;
- `relatedDocumentIds`;
- `relatedActivityIds`;
- continuity references to earlier commitments or events;
- accessibility summary;
- experience-level presentation rules;
- archive eligibility rules.

## 5. Tone and Continuity

Stakeholder tone must reflect:

- current trust;
- earlier learner commitments;
- open risks and issues;
- project-health trend;
- the stakeholder’s chapter arc;
- whether the learner previously surfaced or concealed relevant information;
- the selected experience level.

Tone variants may change wording and pressure. They may not change authoritative facts, decision options, or eligibility without an explicit authored branch rule.

## 6. Chapter One — Initiation Inbox

Chapter One preserves the validated BC-004 and BC-005 vertical slice identities.

| ID | Sender | Subject / Intent | Classification | Links |
|---|---|---|---|---|
| `message.sponsor-welcome` | Elena Marquez, Executive Sponsor | Welcome the learner, establish board pressure, and request a clear start | `preparation_required` | Program kickoff; authorization summary; initial business case; objective decision context |
| `message.operations-scheduling` | Renee Wallace, VP Patient Access | Surface wait-time, abandonment, and frontline workflow pressure | `informational` | Access dashboard; objective decision evidence |
| `message.privacy-caution` | Aisha Bennett, Privacy and Compliance | Warn that privacy, data access, and AI-assisted recommendations must shape early governance | `escalation` | Risk and constraints brief; governance decision context |
| `message.analyst-incomplete-evidence` | Nia Brooks, Business Analyst | Explain that the evidence pack contains meaningful gaps and assumptions | `informational` | Authorization, business case, access dashboard, scope assumptions |
| `message.info-kickoff-reminder` | Marcus Reed, Program Director | Remind the learner of the kickoff and required preparation | `informational` | Program kickoff; authorization; access dashboard |

### Chapter One continuity requirements

- Existing IDs, relationships, and informational flags must remain backward compatible.
- `message.info-kickoff-reminder` must never appear in pending-decision counts.
- Messages may support the three Chapter One decisions but do not resolve them.
- Chapter One inbox history remains visible in later chapters.

## 7. Chapter Two — Planning Inbox

| ID | Sender | Subject / Intent | Classification | Linked Work |
|---|---|---|---|---|
| `message.c2.sponsor-launch-target` | Elena Marquez | Request a public launch target before estimates and dependencies are mature | `decision_triggering` | `decision.c2.launch-target-communication`; schedule evidence |
| `message.c2.clinical-workflow-concern` | Dr. Priya Shah, Clinical Lead | Describe workflow safety, provider availability, and usability constraints | `actionable` | Scope workshop; requirements register; stakeholder review activity |
| `message.c2.privacy-data-boundaries` | Aisha Bennett | Request explicit patient-data, vendor-access, retention, and AI-use boundaries | `preparation_required` | Privacy requirements; quality and acceptance planning |
| `message.c2.vendor-client-responsibilities` | Maya Chen | State optimistic assumptions about Northstar responsibilities and standard configuration | `decision_triggering` | `decision.c2.vendor-responsibility-boundary`; vendor responsibility matrix |
| `message.c2.operations-support-coverage` | Renee Wallace | Warn that support coverage and workflow backfill are understated | `actionable` | Resource plan; support assumptions; dependency map |
| `message.c2.pmo-baseline-standard` | Marcus Reed or PMO representative | Request integrated baseline structure, reporting cadence, and approval evidence | `preparation_required` | Integrated plan package; governance model |
| `message.c2.finance-estimate-confidence` | Thomas Grant | Challenge estimate confidence, contingency rationale, and benefit sensitivity | `actionable` | Cost assumptions; risk register; benefits measurement draft |
| `message.c2.training-effort-warning` | Change and Adoption Lead | Warn that training and manager engagement effort is underestimated | `actionable` | Stakeholder engagement plan; training assumptions |
| `message.c2.regulatory-traceability-inquiry` | Compliance representative | Request evidence traceability and approval checkpoints | `preparation_required` | Quality strategy; acceptance criteria framework |
| `message.c2.executive-simple-status` | Elena Marquez | Ask for a simplified positive planning narrative for leadership | `decision_triggering` | `decision.c2.planning-baseline-recommendation`; executive briefing |
| `message.c2.plan-challenge-summary` | Marcus Reed | Summarize unresolved objections before baseline approval | `preparation_required` | Integrated plan challenge; planning approval meeting |
| `message.c2.baseline-outcome` | Steering Committee Secretariat | Communicate approval, conditional approval, deferral, or rejection | `informational` | Planning approval record; Chapter Three entry conditions |

### Chapter Two sequence

1. Planning kickoff context becomes available.
2. Scope, clinical, privacy, and operational concerns arrive before scope decisions.
3. Vendor responsibility and launch-target pressure arrive after initial estimates are visible.
4. Finance, PMO, adoption, and regulatory messages challenge the integrated plan.
5. The plan-challenge summary becomes available before the approval meeting.
6. The baseline outcome message is generated only from the authoritative approval result.

## 8. Chapter Three — Early Execution Inbox

| ID | Sender | Subject / Intent | Classification | Linked Work |
|---|---|---|---|---|
| `message.c3.team-mobilization-welcome` | Marcus Reed | Confirm transition from planning to execution | `informational` | Execution kickoff; mobilization activity |
| `message.c3.vendor-staffing-substitution` | Maya Chen | Request approval of a vendor staffing substitution and revised onboarding sequence | `decision_triggering` | `decision.c3.vendor-substitution`; vendor mobilization review |
| `message.c3.clinical-attendance-conflict` | Dr. Priya Shah | Explain that patient-care demand limits design-workshop attendance | `escalation` | Clinical participation response; schedule update |
| `message.c3.integration-assumption-failure` | Technology Lead | Report that a critical interface assumption is incomplete or incorrect | `escalation` | Dependency review; risk-to-issue conversion |
| `message.c3.dependency-ownership-gap` | Nia Brooks | Request a named owner for an unassigned cross-functional dependency | `actionable` | Dependency log update; ownership activity |
| `message.c3.communication-breakdown` | Operations Lead | Report rework caused by inconsistent dependency communication | `actionable` | Communication-breakdown review; corrective action |
| `message.c3.quality-evidence-request` | Quality Lead | Request evidence before the first deliverable review | `preparation_required` | Quality checklist; deliverable evaluation |
| `message.c3.scope-interpretation-conflict` | Jordan Kim, CIO | Report incomplete/incorrect interface assumption before first deliverable review | `decision_triggering` | `decision.northstar.chapter-03.integration-assumption-failure` (catalog alias `decision.c3.scope-interpretation`) |
| `message.c3.first-deliverable-findings` | Quality Lead | Present findings and request an acceptance recommendation | `decision_triggering` | `decision.c3.first-deliverable-acceptance`; acceptance record |
| `message.c3.executive-compress-remediation` | Elena Marquez | Request compressed remediation to preserve the published milestone | `decision_triggering` | `decision.northstar.chapter-03.executive-status-position` (catalog alias `decision.c3.remediation-timing`) |
| `message.c3.checkpoint-outcome` | PMO representative | Communicate accepted, conditionally accepted, or rejected checkpoint result | `informational` | Corrective-action plan; Chapter Four carryover |

### Chapter Three rules

- Routine workstream summaries and onboarding confirmations remain informational.
- Vendor staffing, scope interpretation, remediation timing, and deliverable acceptance must use separate authoritative decisions.
- Clinical availability and integration failure messages may escalate work without becoming decisions automatically.
- The checkpoint outcome must reflect the resolved acceptance state and may not be authored optimistically by the inbox projection.

## 9. Chapter Four — Mid-Project Recovery Inbox

| ID | Sender | Subject / Intent | Classification | Linked Work |
|---|---|---|---|---|
| `message.c4.health-escalation` | Marcus Reed or PMO | Notify the learner that project-health tolerances have been breached | `escalation` | Health assessment; recovery triage |
| `message.c4.vendor-delay-cost-impact` | Maya Chen | Report missed commitment, revised timing, and potential commercial impact | `decision_triggering` | `decision.c4.vendor-response`; vendor corrective action |
| `message.c4.compliance-quality-concern` | Aisha Bennett or Quality Lead | Identify a material risk in the proposed recovery shortcut | `decision_triggering` | `decision.c4.compliance-protection`; specialist evidence |
| `message.c4.late-change-request` | Senior Business Stakeholder | Request strategically attractive late scope | `decision_triggering` | `decision.c4.change-disposition`; impact assessment |
| `message.c4.team-capacity-conflict` | Delivery Lead | Escalate conflicting priorities and unsustainable workload | `decision_triggering` | `decision.c4.team-conflict-response`; capacity review |
| `message.c4.steering-recovery-request` | Steering Committee Secretariat | Request an integrated recovery recommendation | `preparation_required` | Recovery plan; steering review |
| `message.c4.recovery-authorization` | Steering Committee Secretariat | Communicate approval, conditions, revision, scope reduction, funding, or further escalation | `informational` | Decision record; authorized forecast; Chapter Five entry |

### Chapter Four rules

- The project-health notice is an escalation, not a decision.
- Every decision-bearing recovery message must link to one decision definition and the evidence required to resolve it.
- Recovery authorization is generated from the formal governance result.
- Earlier stakeholder trust changes the tone and willingness to cooperate, not the underlying facts.

## 10. Chapter Five — Delivery and Readiness Inbox

| ID | Sender | Subject / Intent | Classification | Linked Work |
|---|---|---|---|---|
| `message.c5.positive-recovery-summary` | Elena Marquez | Request a confident executive summary of recovery progress | `decision_triggering` | `decision.c5.recovery-communication`; recovery dashboard |
| `message.c5.site-readiness-gaps` | Operations Lead | Report uneven readiness across sites and functions | `decision_triggering` | `decision.c5.readiness-segmentation`; readiness scorecards |
| `message.c5.defect-classification-escalation` | Quality Lead | Challenge the classification of a potentially release-blocking defect | `decision_triggering` | `decision.c5.defect-disposition`; defect register |
| `message.c5.frontline-training-complaint` | Frontline Manager | Report workflow burden, low training confidence, and local resistance | `actionable` | Adoption analysis; intervention activity |
| `message.c5.vendor-additional-cost-claim` | Maya Chen | Claim that stabilization or transition work is outside contract | `decision_triggering` | `decision.c5.vendor-obligation`; contract evidence |
| `message.c5.support-ownership-gap` | Support Lead | Request a named owner and escalation model for post-deployment service | `decision_triggering` | `decision.c5.operational-ownership`; support operating model |
| `message.c5.compliance-readiness-evidence` | Aisha Bennett | Request traceable readiness evidence and residual-risk ownership | `preparation_required` | Readiness package; risk acceptance evidence |
| `message.c5.manager-engagement-warning` | Change Lead | Warn that manager support and training reinforcement are inconsistent | `actionable` | Adoption issue log; stakeholder action plan |
| `message.c5.remaining-contingency` | Thomas Grant | Request remaining contingency, forecast, and exposure | `actionable` | Recovery report; deployment options analysis |
| `message.c5.deployment-recommendation-request` | Steering Committee Secretariat | Request full, phased, pilot, conditional, or delayed deployment recommendation | `decision_triggering` | `decision.c5.deployment-strategy`; executive brief |
| `message.c5.go-live-outcome` | Steering Committee Secretariat | Communicate go-live authorization, conditions, or delay | `informational` | Deployment authorization; Chapter Six entry |

## 11. Chapter Six — Closure and Benefits Inbox

| ID | Sender | Subject / Intent | Classification | Linked Work |
|---|---|---|---|---|
| `message.c6.deployment-authorization-confirmation` | Steering Committee Secretariat | Confirm active deployment authority and conditions | `informational` | Deployment command review |
| `message.c6.incident-notification` | Operations or Technology Incident Lead | Report early operational incident and known impact | `escalation` | Incident assessment; coordination meeting |
| `message.c6.sponsor-immediate-status` | Elena Marquez | Request an immediate executive status position | `preparation_required` | Incident communication activity |
| `message.c6.frontline-impact-report` | Frontline Manager | Describe user impact, workaround burden, and patient-service effects | `informational` | Incident evidence; impact assessment |
| `message.c6.vendor-responsibility-position` | Maya Chen | State the vendor’s responsibility and proposed response | `actionable` | Incident response; contract record |
| `message.c6.compliance-exception` | Aisha Bennett | Raise a control or evidence concern during deployment | `decision_triggering` | `decision.c6.incident-response`; compliance evidence |
| `message.c6.continue-pause-rollback-request` | Incident Governance Lead | Request a deployment-path recommendation | `decision_triggering` | `decision.c6.deployment-continuation`; incident record |
| `message.c6.hypercare-ownership-request` | Operational Owner | Request a decision on hypercare exit and normal ownership | `decision_triggering` | `decision.c6.hypercare-exit`; stabilization assessment |
| `message.c6.final-forecast-commitments` | Thomas Grant | Request final forecast, outstanding commitments, and contingency disposition | `actionable` | Final financial report |
| `message.c6.vendor-final-claim` | Vendor or Procurement | Present final invoice, claim, warranty, or support obligation | `decision_triggering` | `decision.c6.vendor-financial-closure`; procurement record |
| `message.c6.acceptance-request` | Sponsor or Vendor | Request formal acceptance of delivered scope | `decision_triggering` | `decision.c6.acceptance-position`; acceptance package |
| `message.c6.benefits-reporting-request` | Executive Leadership | Request early benefit results for final reporting | `decision_triggering` | `decision.c6.benefits-reporting`; benefits plan |
| `message.c6.resource-release-question` | Team or Functional Manager | Request release timing and remaining obligations | `actionable` | Resource release plan; knowledge transfer |
| `message.c6.lessons-learned-invitation` | PMO representative | Invite participation and request evidence-based lessons | `preparation_required` | Lessons workshop; lessons register |
| `message.c6.closure-readiness-request` | Steering Committee Secretariat | Request final closure recommendation | `decision_triggering` | `decision.c6.final-closure`; final report |
| `message.c6.closure-approval` | Steering Committee Secretariat | Communicate closure approval, conditions, or deferral | `informational` | Closure record; completed-run state |

## 12. Response and Archive Behavior

### 12.1 Read state

Opening a message changes presentation state only. It does not complete an activity or decision unless an explicit authored activity defines review as its completion evidence.

### 12.2 Response state

A response is required only when `requiresResponse` is true and an authored response contract exists. Freeform stakeholder chat must remain separate from authoritative decision submission.

### 12.3 Completion state

A message may display completed when its linked activity or decision is complete, but the inbox derives that state from the authoritative projection. It may not write completion independently.

### 12.4 Archive state

- Informational items may be archived after reading.
- Actionable and preparation items may be archived after their linked work is complete.
- Decision-triggering items may be archived after the linked decision is resolved.
- Escalations may remain pinned until containment or formal acknowledgement is complete.
- Archived messages remain searchable and retain all links.

## 13. Experience-Level Tailoring

### Explorer

- clearer classification labels;
- explicit evidence links;
- plain-language explanation of the requested action;
- visible distinction between a message and a decision;
- preparation checklists;
- optional mentor prompts.

### Practitioner

- realistic message density;
- partial evidence and competing priorities;
- moderate urgency and ambiguity;
- fewer explicit classification explanations.

### Leader

- politically framed wording;
- incomplete or conflicting communications;
- stronger time pressure;
- stakeholder coalition behavior;
- fewer direct evidence links;
- no change to authoritative facts or decision options.

## 14. Accessibility Requirements

Every message must provide:

- meaningful subject text;
- sender name and role;
- urgency conveyed by text rather than color alone;
- screen-reader summary;
- accessible link labels for meetings, documents, and decisions;
- plain-language explanation for unfamiliar abbreviations;
- preserved logical reading order;
- no essential information embedded only in an image or attachment.

## 15. Validation Requirements

The inbox catalog passes narrative validation only when:

1. every message ID is unique;
2. every sender resolves to a stakeholder in the same case version;
3. every linked meeting, document, activity, and decision resolves;
4. informational messages have no decision contract;
5. decision-triggering messages have exactly one valid decision link;
6. no message creates duplicate decision history;
7. chapter and session ordering is valid;
8. outcome messages are conditioned on authoritative prior results;
9. archived messages remain historically available;
10. message tone is consistent with stakeholder arcs and accumulated state;
11. accessibility summaries are present;
12. cross-surface completion derives from shared authoritative state.

## 16. Implementation Boundary

This document defines narrative content and content contracts. It does not authorize:

- a second inbox write model;
- UI-owned decision state;
- direct browser writes to authoritative tables;
- AI-generated authoritative messages without authored constraints;
- hidden consequences in learner-visible payloads;
- duplicated decision submissions from multiple workplace tabs.
