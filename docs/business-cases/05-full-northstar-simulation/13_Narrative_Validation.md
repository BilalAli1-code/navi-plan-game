# BC-006 Phase 1 — Northstar Narrative Validation

**Status:** Draft for implementation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Validation plan, invariants, traceability checks, acceptance criteria, and sign-off evidence for the complete Northstar Connected Care narrative specification.

## 1. Purpose

This document defines how BC-006 Phase 1 narrative content is validated before it becomes implementation-ready. It protects chronology, continuity, stakeholder behavior, decision integrity, workplace consistency, educational alignment, accessibility, and compatibility with the ProjectSim architecture.

Narrative validation is not copyediting alone. A chapter may be well written and still fail if it creates duplicate decisions, breaks state continuity, exposes hidden outcomes, references nonexistent content, or allows inconsistent completion across workplace surfaces.

## 2. Validation Scope

The Phase 1 validation set includes:

- `00_Full_Simulation_Blueprint.md`;
- `01_Chapter_Two.md`;
- `02_Chapter_Three.md`;
- `03_Chapter_Four.md`;
- `04_Chapter_Five.md`;
- `05_Chapter_Six.md`;
- `06_Stakeholder_Story_Arcs.md`;
- `07_Project_Timeline.md`;
- `08_Meeting_Catalog.md`;
- `09_Inbox_Catalog.md`;
- `10_Document_Catalog.md`;
- `11_Activity_Catalog.md`;
- `12_PMBOK_Guide_Eighth_Edition_Mapping.md`;
- the validated Chapter One content and implementation fixtures.

BC-006 Phase 1 cannot receive final narrative sign-off while any required catalog is absent or unresolved.

## 3. Authority and Source Hierarchy

When documents conflict, use the following authority order:

1. Approved ProjectSim architecture, ADRs, authoritative contracts, and repository instructions.
2. Approved flagship business-case blueprint and content schema.
3. `00_Full_Simulation_Blueprint.md`.
4. `07_Project_Timeline.md`.
5. Chapter specifications.
6. `06_Stakeholder_Story_Arcs.md`.
7. Meeting, Inbox, Document, and Activity catalogs.
8. Implementation fixtures and projections, once generated from approved content.

A conflict must be corrected at the appropriate source. It must not be patched only in a downstream catalog.

## 4. Validation Outcomes

Each validation item receives one of these states:

- `pass` — evidence satisfies the criterion;
- `pass_with_condition` — safe to proceed only with a named corrective obligation;
- `fail` — implementation or publication must not proceed;
- `not_applicable` — criterion does not apply and rationale is recorded;
- `not_tested` — evidence has not been produced.

Final Phase 1 sign-off requires:

- all critical criteria `pass`;
- no unresolved `fail`;
- no unresolved `not_tested` for required criteria;
- every conditional item assigned to an owner and issue;
- all required documents present on the working branch.

## 5. Severity Model

| Severity | Meaning | Example |
|---|---|---|
| Critical | Breaks authority, state integrity, safety, privacy, decision identity, or chapter progression | Informational email creates a decision; hidden outcome exposed |
| High | Breaks narrative continuity, required evidence, stakeholder identity, or milestone logic | Chapter Five occurs before approved recovery path |
| Medium | Creates ambiguity, incomplete traceability, accessibility gap, or assessment weakness | Activity lacks evidence tag |
| Low | Editorial inconsistency that does not alter behavior | Terminology variation with no state impact |

Critical and high findings block sign-off.

## 6. Validation Evidence Package

The validation record must contain:

- branch and commit SHA;
- content-package version under review;
- file inventory;
- validation date;
- validator identity or role;
- automated validation output;
- manual review checklist;
- cross-reference report;
- chronology report;
- PMBOK mapping report;
- accessibility review;
- unresolved findings;
- corrective commits;
- final sign-off decision.

## 7. Structural Validation

### NV-001 — Required file inventory

**Severity:** Critical  
**Pass condition:** Every required Phase 1 file exists at the canonical path and contains substantive content.

### NV-002 — File naming and ordering

**Severity:** High  
**Pass condition:** File names use the approved numbered convention and no duplicate canonical file exists under another name.

### NV-003 — Stable business-case identity

**Severity:** Critical  
**Pass condition:** All content belongs to `northstar-connected-care` and the approved pinned version strategy.

### NV-004 — Chapter identity

**Severity:** Critical  
**Pass condition:** Six chapters exist in the approved order and Chapter One retains validated identity and compatibility.

### NV-005 — Stable entity identifiers

**Severity:** Critical  
**Pass condition:** Stakeholder, message, meeting, document, activity, decision, outcome, and consequence IDs are unique within the content package.

### NV-006 — Resolvable references

**Severity:** Critical  
**Pass condition:** Every cross-reference resolves to an entity in the same case version or an explicitly approved shared reference.

### NV-007 — No dependency cycles

**Severity:** Critical  
**Pass condition:** Chapter, activity, document, meeting, and decision prerequisites form an acyclic progression graph.

## 8. Chronology and Milestone Validation

### NV-010 — Narrative duration consistency

**Severity:** High  
**Pass condition:** The business-world duration, learner-session model, and chapter periods are consistent or an approved amendment resolves the difference.

### NV-011 — Ten-session sequence

**Severity:** High  
**Pass condition:** Ten learner sessions map to six chapters without calendar-based unlocking.

### NV-012 — Milestone order

**Severity:** Critical  
**Pass condition:** The sixteen canonical milestones occur in the approved order unless an authored branch delays or conditionally approves one.

### NV-013 — Milestone evidence

**Severity:** High  
**Pass condition:** Every milestone has supporting documents, accountable stakeholders, prerequisite activities, governance evidence, and downstream effects.

### NV-014 — Chapter entry conditions

**Severity:** Critical  
**Pass condition:** Each chapter begins only after its explicit entry state exists.

### NV-015 — Chapter exit conditions

**Severity:** Critical  
**Pass condition:** Required activities and decisions are complete before chapter advancement.

### NV-016 — Outcome-dependent timing

**Severity:** Critical  
**Pass condition:** Outcome messages, meetings, documents, and activities appear only after the authoritative outcome exists.

### NV-017 — No calendar lock

**Severity:** High  
**Pass condition:** Progression depends on readiness and completion, not a real-world date or forced waiting period.

## 9. Narrative Continuity Validation

### NV-020 — One-project continuity

**Severity:** High  
**Pass condition:** Every chapter feels like continuation of the same Northstar initiative, not a separate scenario.

### NV-021 — Decision carryover

**Severity:** Critical  
**Pass condition:** Material earlier decisions influence later evidence, tone, options, consequences, project health, or stakeholder trust.

### NV-022 — Commitment memory

**Severity:** High  
**Pass condition:** Stakeholders remember material learner commitments, escalations, concessions, and unfulfilled promises.

### NV-023 — Artifact evolution

**Severity:** High  
**Pass condition:** Registers, plans, forecasts, and decision records evolve with version history rather than restarting in each chapter.

### NV-024 — Risk-to-issue continuity

**Severity:** High  
**Pass condition:** Materialized risks become issues without erasing their original risk history.

### NV-025 — Baseline integrity

**Severity:** Critical  
**Pass condition:** Forecast updates and recovery recommendations do not silently replace approved baselines.

### NV-026 — Residual work continuity

**Severity:** Critical  
**Pass condition:** Open defects, risks, claims, actions, and benefits obligations transfer to named owners before closure.

## 10. Stakeholder Validation

### NV-030 — Stakeholder identity consistency

**Severity:** Critical  
**Pass condition:** Names, roles, organizations, influence, interests, and relationships are consistent across all documents.

### NV-031 — Chapter-appropriate behavior

**Severity:** High  
**Pass condition:** Stakeholder behavior matches the approved chapter arc and current project state.

### NV-032 — Trust-responsive tone

**Severity:** High  
**Pass condition:** Tone may change with trust and prior actions but does not alter authoritative facts without an authored branch.

### NV-033 — Coalition consistency

**Severity:** Medium  
**Pass condition:** Alliances and tensions reflect stakeholder motivations and do not change arbitrarily for plot convenience.

### NV-034 — Persistent conversations

**Severity:** Critical  
**Pass condition:** Messages and stakeholder conversations remain historically available and do not disappear when work completes.

### NV-035 — Appropriate engagement timing

**Severity:** High  
**Pass condition:** Stakeholders enter the narrative when their authority, expertise, or impact is relevant.

### NV-036 — Stakeholder measurement boundary

**Severity:** Critical  
**Pass condition:** Stakeholder interaction may emit approved signals, but content does not directly bypass authoritative domain boundaries.

## 11. Decision Integrity Validation

### NV-040 — Decision definition required

**Severity:** Critical  
**Pass condition:** Every learner choice that changes authoritative state has a valid decision definition.

### NV-041 — Informational separation

**Severity:** Critical  
**Pass condition:** Informational messages, reminders, meetings, and documents never appear as pending decisions.

### NV-042 — One decision identity

**Severity:** Critical  
**Pass condition:** One authored decision is represented once across all workplace surfaces.

### NV-043 — Decision-message relationship

**Severity:** Critical  
**Pass condition:** Decision-triggering messages link to explicit decision definitions; messages do not resolve decisions.

### NV-044 — Eligibility consistency

**Severity:** Critical  
**Pass condition:** All surfaces rely on the same pure eligibility policy and authoritative state.

### NV-045 — Authority boundaries

**Severity:** Critical  
**Pass condition:** Learner options respect delegated authority and escalate where approval is outside the learner’s role.

### NV-046 — Evidence sufficiency

**Severity:** High  
**Pass condition:** The learner receives sufficient evidence to make a defensible decision without receiving hidden outcome logic.

### NV-047 — Trade-off quality

**Severity:** High  
**Pass condition:** Material decisions contain realistic trade-offs and no option is universally positive.

### NV-048 — Delayed consequence traceability

**Severity:** Critical  
**Pass condition:** Every delayed consequence traces to its originating decision, state, or authored trigger.

### NV-049 — Outcome immutability

**Severity:** Critical  
**Pass condition:** Resolved outcomes are not silently recalculated under a later resolver or content version.

## 12. Inbox Validation

### NV-050 — Message classification

**Severity:** Critical  
**Pass condition:** Every message is classified as informational, actionable, preparation required, escalation, or decision triggering.

### NV-051 — Decision-triggering contract

**Severity:** Critical  
**Pass condition:** Every decision-triggering message has exactly one valid linked decision unless an approved compound contract exists.

### NV-052 — Informational no-decision rule

**Severity:** Critical  
**Pass condition:** Informational messages have no decision contract and do not affect pending-decision counts.

### NV-053 — Archive behavior

**Severity:** High  
**Pass condition:** Archiving hides an item from the active view without deleting history or links.

### NV-054 — Outcome message derivation

**Severity:** Critical  
**Pass condition:** Approval and outcome messages are generated only from authoritative state.

### NV-055 — Cross-surface message completion

**Severity:** Critical  
**Pass condition:** A message displays completed only by deriving linked activity or decision completion from shared state.

## 13. Meeting Validation

### NV-060 — Meeting catalog completeness

**Severity:** Critical  
**Pass condition:** `08_Meeting_Catalog.md` exists and defines every required meeting referenced by chapters and catalogs.

### NV-061 — Participant resolution

**Severity:** Critical  
**Pass condition:** Every participant resolves to a valid stakeholder and has a credible reason to attend.

### NV-062 — Agenda and output alignment

**Severity:** High  
**Pass condition:** Meeting agendas support the stated purpose and required outputs.

### NV-063 — Preparation dependencies

**Severity:** High  
**Pass condition:** Required preparation documents and activities are available before the meeting.

### NV-064 — Meeting-decision separation

**Severity:** Critical  
**Pass condition:** Completing a meeting does not resolve a decision unless a separate authoritative submission occurs.

### NV-065 — Meeting history

**Severity:** High  
**Pass condition:** Completed meetings remain visible with decisions, actions, and records.

## 14. Document Validation

### NV-070 — Document identity and version

**Severity:** Critical  
**Pass condition:** Every document has stable identity, version, owner, status, and provenance.

### NV-071 — Supersession integrity

**Severity:** Critical  
**Pass condition:** Supersession relationships are acyclic and prior decision evidence remains accessible.

### NV-072 — Required content

**Severity:** High  
**Pass condition:** Every artifact contains the minimum content defined in `10_Document_Catalog.md`.

### NV-073 — Approval integrity

**Severity:** Critical  
**Pass condition:** Draft, submitted, approved, rejected, accepted, and conditional states are distinct and authoritative.

### NV-074 — Hidden-content protection

**Severity:** Critical  
**Pass condition:** Hidden outcomes, consequences, scoring, and future branch information are absent from learner-facing documents.

### NV-075 — Evidence limitations

**Severity:** High  
**Pass condition:** Incomplete, uncertain, conflicting, or estimated evidence is labeled honestly.

### NV-076 — Closure retention

**Severity:** Critical  
**Pass condition:** Material decision, acceptance, procurement, financial, transfer, and closure evidence remains auditable.

## 15. Activity and Progress Validation

### NV-080 — Activity contract completeness

**Severity:** Critical  
**Pass condition:** Every activity has stable ID, chapter, prerequisites, completion evidence, required status, and related entities.

### NV-081 — Authoritative completion

**Severity:** Critical  
**Pass condition:** Completion is determined by authored authoritative conditions, not local UI flags.

### NV-082 — Required activity gating

**Severity:** Critical  
**Pass condition:** All required activities gate chapter completion and optional activities do not.

### NV-083 — No read-equals-complete shortcut

**Severity:** High  
**Pass condition:** Opening content does not complete substantive work unless review is the explicit evidence.

### NV-084 — Completed History derivation

**Severity:** Critical  
**Pass condition:** Completed History is derived from completed activities and never becomes an independent truth.

### NV-085 — Cross-surface convergence

**Severity:** Critical  
**Pass condition:** Mission Control, Activities, Inbox, Meetings, Decision Log, and progress views converge after accepted authoritative actions.

### NV-086 — No skipped required work

**Severity:** Critical  
**Pass condition:** Learners cannot advance while required work remains incomplete.

## 16. Consequence and Project-Health Validation

### NV-090 — Metric ownership

**Severity:** Critical  
**Pass condition:** Narrative content requests typed effects but does not calculate or clamp authoritative metrics outside the domain.

### NV-091 — Consequence proportionality

**Severity:** High  
**Pass condition:** Consequences are plausible, proportionate, and connected to the decision context.

### NV-092 — Mixed effects

**Severity:** High  
**Pass condition:** Major decisions include realistic positive and negative trade-offs.

### NV-093 — Project-health coherence

**Severity:** Critical  
**Pass condition:** Scope, schedule, finance, quality, risk, stakeholders, resources, vendor, and governance indicators tell a coherent story.

### NV-094 — Delayed release timing

**Severity:** Critical  
**Pass condition:** Future consequences do not apply immediately and become available only through approved scheduling and release behavior.

### NV-095 — Recovery causality

**Severity:** High  
**Pass condition:** Recovery severity and available options reflect earlier project state.

### NV-096 — Closure causality

**Severity:** High  
**Pass condition:** Final acceptance, stabilization, benefits, claims, and closure outcomes reflect accumulated state.

## 17. PMBOK Guide Eighth Edition Validation

### NV-100 — Six-principle coverage

**Severity:** High  
**Pass condition:** All six core principles appear in assessed evidence across the simulation.

### NV-101 — Seven-domain coverage

**Severity:** High  
**Pass condition:** All seven performance domains appear across multiple chapters.

### NV-102 — Action-based alignment

**Severity:** High  
**Pass condition:** Alignment is demonstrated through project work and judgment rather than isolated terminology recall.

### NV-103 — Tailoring

**Severity:** High  
**Pass condition:** The learner tailors practices to the hybrid healthcare context.

### NV-104 — AI, PMO, and procurement

**Severity:** High  
**Pass condition:** These topics are integrated into realistic work without bypassing accountability or architecture.

### NV-105 — Standards currency

**Severity:** High  
**Pass condition:** Mapping is reviewed against the current PMI edition and applicable errata before publication.

### NV-106 — No endorsement claim

**Severity:** Critical  
**Pass condition:** ProjectSim does not claim PMI endorsement, sponsorship, or certification.

## 18. Experience-Level Validation

### NV-110 — One canonical story

**Severity:** Critical  
**Pass condition:** Explorer, Practitioner, and Leader use the same canonical project facts and milestones.

### NV-111 — Guidance differentiation

**Severity:** High  
**Pass condition:** Explorer provides more scaffolding, Practitioner provides balanced ambiguity, and Leader provides greater complexity and pressure.

### NV-112 — No answer leakage

**Severity:** Critical  
**Pass condition:** Explorer guidance helps interpret evidence but does not select the answer.

### NV-113 — Equivalent authority

**Severity:** Critical  
**Pass condition:** Experience level does not expand the learner’s formal authority.

### NV-114 — Comparable assessment constructs

**Severity:** High  
**Pass condition:** All levels assess the same core competencies while adjusting evidence complexity and support.

## 19. Accessibility and Inclusion Validation

### NV-120 — Text alternatives

**Severity:** High  
**Pass condition:** Essential visual information has accessible text alternatives.

### NV-121 — Color-independent meaning

**Severity:** High  
**Pass condition:** Status, urgency, quality, and risk are not conveyed by color alone.

### NV-122 — Keyboard and reading order

**Severity:** High  
**Pass condition:** Learner actions and content relationships are operable and understandable without pointer-only interaction.

### NV-123 — Plain-language support

**Severity:** Medium  
**Pass condition:** Explorer guidance explains unfamiliar terminology and abbreviations.

### NV-124 — Inclusive healthcare context

**Severity:** High  
**Pass condition:** Patient access, disability, digital access, equity, workload, and privacy concerns are represented responsibly.

### NV-125 — Stereotype avoidance

**Severity:** High  
**Pass condition:** Stakeholder disagreement is grounded in role, evidence, incentives, and context rather than identity stereotypes.

## 20. Architecture Boundary Validation

### NV-130 — Single authoritative state

**Severity:** Critical  
**Pass condition:** SimulationRun and SimulationState remain the authoritative runtime state.

### NV-131 — Projection-only workplace surfaces

**Severity:** Critical  
**Pass condition:** Inbox, Meetings, Mission Control, Decision Log, Documents, Activities, and related surfaces are derived read models.

### NV-132 — No browser business rules

**Severity:** Critical  
**Pass condition:** Browser code does not calculate eligibility, consequences, project health, progress, or synthetic history.

### NV-133 — Projection-safe content

**Severity:** Critical  
**Pass condition:** Learner-facing payloads exclude hidden consequence definitions, resolver internals, signals, schedules, receipts, and outbox metadata.

### NV-134 — Event deduplication semantics

**Severity:** Critical  
**Pass condition:** Consumers deduplicate by event ID and do not assume action sequence is globally unique per event.

### NV-135 — Version pinning

**Severity:** Critical  
**Pass condition:** Active runs remain bound to their immutable content-package version.

### NV-136 — Case neutrality

**Severity:** Critical  
**Pass condition:** Northstar-specific rules remain in the content package and do not create case-specific conditionals in shared UI or platform code.

## 21. Automated Validation Requirements

The implementation phase should provide deterministic validation for:

- duplicate IDs;
- missing references;
- invalid chapter ownership;
- invalid decision links;
- informational messages with decision contracts;
- decision-triggering messages without decisions;
- dependency cycles;
- invalid milestone order;
- missing required activity references;
- invalid document supersession;
- hidden content in learner-safe entities;
- missing accessibility metadata;
- unsupported experience levels;
- case-version leakage;
- invalid stakeholder references;
- unresolved learning-objective and assessment mappings.

Automated validation must fail closed on malformed content.

## 22. Manual Narrative Review

Automated checks cannot determine all narrative quality. Manual review must assess:

- realism of workplace communications;
- credibility of stakeholder motivations;
- appropriateness of meeting participants;
- sufficiency and conflict of evidence;
- quality of trade-offs;
- continuity across chapters;
- consequence plausibility;
- ethical framing;
- learner workload and pacing;
- emotional and cognitive pressure;
- clarity without answer leakage;
- educational usefulness;
- closure satisfaction and accountability.

At least one reviewer should evaluate the simulation from each perspective:

- project-management education;
- healthcare operations or domain realism;
- technical and data delivery;
- privacy, compliance, or quality;
- learner experience and accessibility;
- ProjectSim architecture and content validation.

## 23. Chapter Acceptance Matrix

| Chapter | Required Narrative Evidence | Blocking Outcome |
|---|---|---|
| Chapter 1 | Validated BC-004/BC-005 content, compatibility, initiation carryover | Any regression to validated vertical slice |
| Chapter 2 | Integrated planning, nine canonical events, baseline approval, carryover | Execution begins without credible approved or conditional plan |
| Chapter 3 | Mobilization, dependency failure, quality review, acceptance checkpoint | First deliverable outcome lacks evidence or continuity |
| Chapter 4 | Health diagnosis, vendor/compliance/change/conflict, recovery authorization | Recovery result is detached from earlier state |
| Chapter 5 | Segmented readiness, defects, adoption, ownership, vendor obligations, go-live | Deployment recommendation lacks integrated evidence |
| Chapter 6 | Deployment, incident, stabilization, acceptance, benefits, closure | Project closes with unowned work or hidden exposure |

## 24. Phase 1 Exit Criteria

BC-006 Phase 1 is complete only when:

1. every canonical document exists;
2. the six-chapter chronology is coherent;
3. all required entities have stable IDs;
4. all references resolve;
5. Chapter One compatibility is preserved;
6. all decisions have explicit narrative contracts;
7. informational content is separated from decision state;
8. meetings, messages, documents, and activities support one shared project state;
9. stakeholder arcs and commitment memory are consistent;
10. delayed consequences are traceable;
11. milestone, chapter, and session gates are valid;
12. PMBOK Guide Eighth Edition mapping passes review;
13. accessibility and inclusion criteria pass;
14. architecture boundaries are preserved;
15. automated and manual validation evidence is attached to Issue #81;
16. unresolved critical and high findings equal zero;
17. the final Phase 1 sign-off is recorded in GitHub.

## 25. Sign-Off Record Template

```text
BC-006 Phase 1 Narrative Validation

Repository:
Branch:
Commit SHA:
Content package version:
Validation date:

Required files present: PASS / FAIL
Automated structural validation: PASS / FAIL
Cross-reference validation: PASS / FAIL
Chronology and milestone validation: PASS / FAIL
Stakeholder continuity validation: PASS / FAIL
Decision integrity validation: PASS / FAIL
Workplace convergence review: PASS / FAIL
PMBOK Eighth Edition mapping review: PASS / FAIL
Accessibility and inclusion review: PASS / FAIL
Manual narrative review: PASS / FAIL

Critical findings open:
High findings open:
Conditional obligations:

Final decision: APPROVED / APPROVED WITH CONDITIONS / REJECTED
Approver(s):
GitHub evidence links:
```

## 26. Implementation Boundary

This validation specification does not authorize feature implementation during Phase 1. It defines the evidence required before Phase 2 decision-system work proceeds.

Validation findings that expose an architecture defect, content-schema limitation, or earlier roadmap regression must be attributed to the owning issue rather than silently repaired through inconsistent narrative content.
