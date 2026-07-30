# BC-006 Phase 4 — Coaching and Feedback Model

## 1. Purpose

This document defines the coaching and feedback system for the Northstar flagship simulation. Coaching must deepen judgment without exposing hidden engine rules, replacing learner agency, or turning the simulation into answer memorization.

## 2. Coaching Principles

Coaching shall be:

- evidence-based;
- timely;
- proportionate to learner level;
- specific to the learner’s action and context;
- respectful of multiple defensible approaches;
- aligned with PMBOK Guide Eighth Edition principles and performance domains;
- separated from authoritative simulation outcomes;
- transparent when uncertainty exists.

## 3. Coaching Roles

### AI Mentor

The AI Mentor supports reflection, interpretation, and development. It may:

- ask clarifying questions;
- point learners back to relevant evidence;
- explain trade-offs;
- identify overlooked stakeholders or constraints;
- provide targeted PMBOK reinforcement;
- recommend remediation after patterns emerge.

The AI Mentor must not:

- submit decisions for the learner;
- reveal hidden scoring weights;
- invent project facts;
- contradict authoritative simulation state;
- guarantee that one option is always correct outside its defined context.

### Program Director

The Program Director provides chapter briefings, milestone framing, and strategic context. This role emphasizes expectations and outcomes rather than tactical hints.

### Stakeholders

Stakeholder feedback remains narrative and role-consistent. It may show trust, resistance, support, concern, escalation, or changed expectations based on the authoritative stakeholder state.

## 4. Feedback Timing

### Pre-decision support

Available when permitted by the experience level and decision definition. It may include:

- restating the decision objective;
- identifying missing evidence categories;
- prompting stakeholder or risk consideration;
- explaining relevant terminology.

It must not reveal the scoring result of available options.

### Immediate post-decision feedback

Delivered after authoritative decision acceptance. It may include:

- acknowledgement of the submitted action;
- explanation of the reasoning strengths and weaknesses;
- visible immediate consequences;
- competency observations;
- a concise reflection prompt.

### Delayed feedback

Delivered when a scheduled consequence activates. It should connect the later result to the earlier decision without implying that outcomes were arbitrary.

### Chapter feedback

Delivered after chapter gates are met. It summarizes:

- decisions made;
- observed project effects;
- demonstrated strengths;
- development priorities;
- unresolved risks carried forward;
- chapter-level PMBOK alignment.

### Final feedback

Delivered after simulation completion. It integrates performance across all chapters, including cumulative consequences, stakeholder relationships, project outcomes, and learner reflections.

## 5. Feedback Structure

Feedback should use this sequence where applicable:

1. **What you did**
2. **Why it mattered**
3. **What evidence supported or weakened it**
4. **What consequence followed**
5. **What principle or competency was demonstrated**
6. **What to consider next time**

## 6. Experience-Level Tailoring

### Explorer

- proactive hints before major decisions;
- plain-language explanation;
- explicit evidence prompts;
- immediate feedback with examples;
- optional concept refreshers;
- clear recovery suggestions.

### Practitioner

- hints primarily on request;
- feedback focused on reasoning quality and trade-offs;
- less terminology support;
- delayed remediation after repeated patterns;
- moderate ambiguity preserved.

### Leader

- minimal pre-decision guidance;
- feedback emphasizes strategic judgment, governance, ethics, value, and systems effects;
- consequences may be allowed to unfold before coaching;
- reflections require justification and alternative analysis.

## 7. Feedback Categories

Canonical feedback categories are:

- stakeholder engagement;
- team leadership;
- planning and delivery approach;
- scope and requirements;
- schedule and cost stewardship;
- risk and uncertainty;
- quality and compliance;
- governance and escalation;
- communication;
- procurement and vendor management;
- value and benefits;
- ethics and professional responsibility;
- adaptability and systems thinking.

## 8. Reflection Prompts

Reflection prompts may ask the learner to:

- explain the evidence used;
- identify assumptions;
- compare alternative actions;
- describe affected stakeholders;
- assess short-term versus long-term effects;
- identify ethical or governance concerns;
- explain what they would change;
- connect the situation to prior experience.

Required reflections shall be concise enough not to disrupt simulation flow while still producing meaningful evidence of learner reasoning.

## 9. Remediation Model

Remediation may be activated when:

- a competency pattern falls below a defined threshold;
- the learner repeatedly ignores critical evidence;
- governance, ethics, safety, or compliance errors occur;
- the learner requests additional support;
- a chapter includes a defined recovery learning moment.

Remediation options include:

- targeted concept explanation;
- guided evidence review;
- a short scenario-based practice item;
- replay of a related decision in non-authoritative practice mode;
- a structured reflection;
- recommendation to revisit a document or meeting record.

Remediation must not retroactively change authoritative simulation outcomes.

## 10. Coaching Data Contract

A coaching request should include only authorized, relevant context:

```text
CoachingContext
- simulationRunId
- businessCaseId
- chapterId
- learnerExperienceLevel
- decisionId or activityId
- authoritative visible state
- learner response
- permitted evidence references
- competency history summary
- feedback timing
```

Generated coaching output should include:

```text
CoachingResponse
- feedbackType
- summary
- evidenceObservations[]
- strengths[]
- developmentAreas[]
- reflectionPrompt?
- reinforcementReferences[]
- remediationRecommendation?
- confidenceStatement?
```

## 11. Guardrails

The coaching system must:

- treat authoritative engine output as immutable input;
- never fabricate scores, events, documents, or stakeholder statements;
- avoid disclosing hidden thresholds or future branches;
- distinguish observed facts from interpretation;
- preserve learner privacy;
- avoid biased or demeaning language;
- support accessibility and plain-language alternatives;
- log coaching provenance and model version where AI is used.

## 12. Failure Behavior

If coaching generation fails:

- the simulation must remain usable;
- accepted decisions and consequences must remain intact;
- a deterministic fallback message may be shown;
- the learner may continue without AI coaching;
- the failure must not block chapter progression unless reflection itself is a mandatory activity and a non-AI fallback is unavailable.

## 13. Acceptance Criteria

This document is satisfied when:

- coaching roles and boundaries are explicit;
- pre-decision, immediate, delayed, chapter, and final feedback are supported;
- feedback is tailored by experience level;
- remediation is targeted and non-destructive;
- AI output cannot alter authoritative state;
- hidden scoring and future branches remain protected;
- coaching failures do not corrupt or unnecessarily block the simulation;
- feedback remains traceable to learner actions and evidence.
