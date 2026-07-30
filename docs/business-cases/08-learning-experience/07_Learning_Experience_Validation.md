# BC-006 Phase 4 — Learning Experience Validation

## 1. Purpose

This document defines validation criteria for the Northstar learning experience. It confirms that the journey, coaching, assessment, progression, reflection, and accessibility models work together without violating the authoritative narrative, decision, or simulation-engine specifications.

## 2. Validation Scope

Validation covers:

- learner journey continuity;
- chapter learning objectives;
- experience-level tailoring;
- coaching quality and safety;
- practice and assessment integrity;
- progression consistency;
- performance reporting;
- reflection quality;
- accessibility and learning support;
- PMBOK Guide Eighth Edition alignment;
- cross-surface state consistency;
- failure and recovery behavior.

## 3. Source-of-Truth Validation

The learning experience must consume authoritative state and must not maintain conflicting copies of:

- decision status;
- chapter status;
- project-health metrics;
- stakeholder state;
- activity completion;
- meeting completion;
- document availability;
- XP and achievements;
- assessment evidence.

Validation fails if one surface reports an item as pending while another reports the same authoritative item as completed.

## 4. Narrative Continuity Validation

For each chapter, confirm that:

- the briefing matches the approved chapter narrative;
- required inbox, meeting, document, and activity content appears at the correct time;
- stakeholder behavior reflects current state and prior consequences;
- delayed consequences connect to earlier decisions;
- chapter transitions preserve unresolved risks and commitments;
- coaching does not reveal future narrative branches.

## 5. Learning Objective Validation

Each chapter must have:

- explicit learning objectives;
- required learner actions tied to those objectives;
- assessment evidence capable of demonstrating the objectives;
- feedback connected to the evidence;
- PMBOK-aligned metadata;
- chapter reflection prompts.

No required activity should exist without a clear learning or simulation purpose.

## 6. Experience-Level Validation

### Explorer

Confirm:

- guidance is proactive and understandable;
- terminology support is available;
- hints do not reveal scored answers;
- core decisions and outcomes remain canonical;
- accessibility support is complete.

### Practitioner

Confirm:

- guidance is moderate and often optional;
- ambiguity remains realistic;
- feedback emphasizes reasoning and trade-offs;
- remediation is targeted.

### Leader

Confirm:

- scaffolding is limited without reducing accessibility;
- strategic, governance, ethical, and value expectations are stronger;
- hidden state and future consequences remain protected;
- core narrative and decision identifiers remain canonical.

## 7. Coaching Validation

Coaching must be tested for:

- factual grounding in visible authoritative state;
- relevance to the learner action;
- separation of facts and interpretation;
- no invented project details;
- no hidden scoring disclosure;
- no future-branch disclosure;
- respectful and unbiased language;
- useful fallback when AI services are unavailable;
- provenance and version capture where applicable.

## 8. Assessment Validation

Assessment validation must confirm:

- authoritative decisions use the approved scoring model;
- practice items cannot change simulation state;
- competency mappings are present and reviewable;
- rubrics are versioned;
- multiple defensible responses are recognized where intended;
- reflection quality is not measured by length alone;
- mastery updates use cumulative evidence;
- project outcome is not treated as identical to learner performance;
- assessment results are reproducible from stored evidence.

## 9. Progression Validation

Confirm that:

- required work drives chapter progress;
- informational items do not inflate or block progress;
- no chapter can be skipped;
- completed actions are reflected across all surfaces;
- XP and achievements apply exactly once;
- experience level and learner level remain distinct;
- pause and resume restore the correct next action;
- chapter completion cannot occur before all mandatory gates are satisfied.

## 10. Performance and Reflection Validation

Confirm that:

- strengths and development areas cite evidence;
- chapter summaries include project and learning effects;
- final summaries include cumulative consequence chains;
- reflection prompts support reasoning and transfer;
- reflection scoring is fair and transparent;
- reports avoid certification guarantees;
- historical run records remain immutable after completion.

## 11. Accessibility Validation

At minimum, validate:

- keyboard-only navigation;
- screen-reader semantics;
- logical reading and focus order;
- text zoom and responsive reflow;
- non-color status indicators;
- captions and transcripts;
- reduced-motion behavior;
- non-drag alternatives;
- accessible validation errors;
- plain-language support;
- equivalent access across all experience levels;
- safe error recovery.

Accessibility failures in required flows are release-blocking.

## 12. PMBOK Guide Eighth Edition Validation

Content governance must verify that:

- chapter objectives align to the approved PMBOK mapping;
- principles and performance domains are represented accurately;
- AI, PMO, procurement, governance, value, and ethics coverage is not overstated;
- terminology is consistent;
- the experience does not reproduce protected certification questions;
- no learner-facing claim guarantees certification success.

## 13. Cross-Phase Traceability

Every required learning interaction must trace to:

```text
Narrative source
→ catalog item
→ decision or activity definition
→ engine trigger or state
→ learner interaction
→ assessment evidence
→ feedback
→ progression impact
→ validation case
```

Missing links are documentation defects and may become release blockers depending on severity.

## 14. Failure and Recovery Validation

Test scenarios must include:

- coaching service unavailable;
- projection rebuild after interruption;
- duplicate decision submission;
- delayed consequence retry;
- network interruption during reflection save;
- resume after session termination;
- missing optional media;
- accessibility fallback activation;
- invalid or stale client state.

The authoritative simulation state must remain correct in every scenario.

## 15. Required Validation Artifacts

Phase 5 implementation readiness should include:

- traceability matrix;
- chapter-by-chapter learner journey checklist;
- experience-level comparison matrix;
- coaching red-team cases;
- assessment rubric review;
- accessibility test report;
- deterministic progression tests;
- projection convergence tests;
- content governance sign-off;
- unresolved defect register.

## 16. Release-Blocking Conditions

Release must be blocked when:

- required learner actions cannot be completed;
- decision or progress status diverges across surfaces;
- coaching changes authoritative state;
- scoring is not reproducible;
- mandatory accessibility flows fail;
- chapter gates can be bypassed;
- duplicate XP or achievements occur;
- future branches or hidden scoring are exposed;
- PMBOK mappings are materially inaccurate;
- accepted learner work can be lost.

## 17. Phase 4 Acceptance Criteria

BC-006 Phase 4 is complete when:

- all seven learning-experience documents are approved;
- every chapter has a coherent learning journey;
- coaching and feedback boundaries are defined;
- practice and assessment are implementation-ready;
- progression, XP, and achievements are deterministic;
- performance and reflection outputs are evidence-based;
- accessibility requirements are release criteria;
- cross-phase traceability is complete enough to begin integrated Phase 5 validation.
