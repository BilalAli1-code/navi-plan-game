# BC-006 Phase 4 — Practice and Assessment Experience

## 1. Purpose

This document defines how practice, knowledge checks, adaptive reinforcement, and assessment are embedded in the Northstar flagship simulation without interrupting immersion or duplicating the authoritative decision-scoring system.

## 2. Assessment Philosophy

Assessment shall evaluate applied project-management judgment, not simple recall alone.

The experience shall:

- prioritize scenario-based application;
- distinguish practice from authoritative simulation decisions;
- use evidence from decisions, reflections, activities, and knowledge checks;
- support PMBOK Guide Eighth Edition alignment;
- identify competency patterns over time;
- avoid treating one imperfect decision as a complete measure of capability;
- provide transparent learner-facing explanations without exposing hidden scoring weights.

## 3. Assessment Layers

### Layer 1 — Embedded Decision Assessment

Authoritative decisions are evaluated using the Phase 2 scoring and consequence specifications. Evidence includes:

- selected option or constructed response;
- required evidence reviewed;
- timing and eligibility;
- rationale where required;
- stakeholder and project-state context;
- immediate and delayed consequences.

### Layer 2 — Activity Assessment

Activities may assess the learner’s ability to:

- analyze a document;
- prepare for a meeting;
- identify risk or issue signals;
- create or update a project artifact;
- prioritize work;
- communicate with a stakeholder;
- interpret project-health indicators.

### Layer 3 — Reflection Assessment

Reflections evaluate reasoning quality, awareness of trade-offs, ethical consideration, and transfer of learning. Reflection scoring must not reward length alone.

### Layer 4 — Knowledge Checks

Knowledge checks reinforce concepts through short scenario-based questions. They are supplemental and must not replace authentic simulation performance.

### Layer 5 — Cumulative Competency Assessment

The final assessment combines evidence across the full run to identify sustained strengths, development areas, and readiness for more advanced scenarios.

## 4. Practice Modes

### In-context practice

Short practice appears near a relevant chapter event. It may be triggered by:

- a new concept;
- a repeated misconception;
- a low-confidence learner response;
- a significant governance, ethics, quality, or risk error;
- learner request.

### Chapter reinforcement

At chapter close, the learner may receive one or more targeted scenarios aligned to the chapter’s primary competencies.

### Remediation practice

Remediation practice targets a demonstrated development area. It must use a distinct scenario so the learner practices transfer rather than memorizing the Northstar answer.

### Replay practice

A completed decision may be replayed in practice mode with outcomes and coaching exposed. Practice replay must not modify the authoritative simulation run.

## 5. Practice Item Types

Supported practice types include:

- single-best-response scenario;
- multiple-response scenario;
- sequencing activity;
- evidence-selection activity;
- stakeholder-response exercise;
- risk-response selection;
- artifact review and critique;
- short constructed response;
- confidence rating followed by explanation.

## 6. Adaptive Reinforcement

Adaptive reinforcement uses competency history to choose relevant practice. It shall consider:

- frequency of weak performance;
- severity of the underlying project impact;
- recency;
- learner confidence;
- whether the weakness appears conceptual or contextual;
- experience level;
- prior remediation results.

Adaptive logic must not create an endless remediation loop. The learner must always have a clear route back to the main simulation.

## 7. PMBOK Alignment

Every assessed item must map to one or more of:

- PMBOK Guide Eighth Edition principles;
- performance domains;
- project-management competencies;
- ethical and professional responsibilities;
- applicable delivery, governance, procurement, AI, PMO, or value considerations.

Mappings must be stored as metadata and remain reviewable by content governance.

## 8. Difficulty Model

Difficulty is controlled through:

- ambiguity;
- number of competing constraints;
- amount of available evidence;
- stakeholder conflict;
- consequence delay;
- number of defensible alternatives;
- requirement to justify reasoning;
- strategic versus tactical scope.

Explorer, Practitioner, and Leader modes may present the same competency at different difficulty levels without changing the core learning objective.

## 9. Assessment Evidence Record

Each assessed interaction should record:

```text
AssessmentEvidence
- evidenceId
- simulationRunId
- chapterId
- sourceType
- sourceId
- competencyMappings[]
- learnerResponse
- confidence?
- rubricVersion
- scoreComponents[]
- feedbackReference
- createdAt
```

The evidence record must be immutable after acceptance, except through explicitly versioned correction procedures.

## 10. Fairness and Reliability

Assessment design shall:

- use clear instructions;
- avoid irrelevant language complexity;
- support approved accommodations;
- avoid cultural assumptions unrelated to the competency;
- permit multiple defensible approaches where the scenario supports them;
- use stable rubrics;
- separate content difficulty from interface difficulty;
- validate that feedback matches the assessed evidence.

## 11. Knowledge Check Rules

Knowledge checks shall:

- remain concise;
- use realistic project contexts;
- explain why responses are stronger or weaker;
- avoid copying live certification exam questions;
- distinguish PMBOK reinforcement from certification guarantees;
- permit review after completion;
- not block chapter progression unless explicitly defined as required.

## 12. Mastery Updates

Mastery is updated from accumulated evidence, not a single event. Updates should consider:

- decision quality;
- consistency across chapters;
- severity and complexity;
- reflection quality;
- remediation improvement;
- practice performance;
- recency.

Mastery states may be represented as:

- emerging;
- developing;
- proficient;
- advanced.

These labels must be accompanied by evidence-based explanations.

## 13. Learner-Facing Results

Learners should see:

- competencies demonstrated;
- evidence examples;
- areas needing development;
- progress over time;
- recommended next practice;
- distinction between project outcome and learning performance.

A project may experience a poor outcome even when the learner demonstrates sound reasoning under uncertainty. Conversely, a favorable outcome must not automatically imply strong decision quality.

## 14. Acceptance Criteria

This document is satisfied when:

- practice and authoritative decisions are clearly separated;
- assessment evidence is captured across multiple interaction types;
- adaptive reinforcement is bounded and targeted;
- all assessed content has reviewable PMBOK mappings;
- difficulty scales by experience level;
- fairness and accessibility rules are enforced;
- mastery updates use cumulative evidence;
- learner-facing results explain performance without exposing hidden scoring weights.
