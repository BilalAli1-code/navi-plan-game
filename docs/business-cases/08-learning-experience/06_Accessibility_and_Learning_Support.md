# BC-006 Phase 4 — Accessibility and Learning Support

## 1. Purpose

This document defines accessibility, cognitive support, plain-language, replay, and learner-assistance requirements for the Northstar flagship simulation.

## 2. Accessibility Principles

The experience shall:

- support equitable participation;
- avoid making interface complexity part of the assessment;
- provide multiple ways to perceive and interact with learning content;
- preserve equivalent learning objectives across supported accommodations;
- use accessible defaults;
- support keyboard, screen-reader, zoom, and reduced-motion use;
- provide plain-language and terminology support;
- avoid time pressure unless timing is an explicit competency requirement.

## 3. Content Accessibility

All learner-facing content shall:

- use meaningful headings and reading order;
- use descriptive link and button labels;
- provide text alternatives for meaningful images and diagrams;
- not rely on color alone to communicate status;
- provide sufficient contrast;
- use captions and transcripts for audiovisual content;
- define specialized terminology where needed;
- support scalable text without loss of information or function.

## 4. Interaction Accessibility

Core simulation actions must be operable through:

- keyboard-only navigation;
- assistive technologies;
- touch interfaces;
- visible focus indicators;
- accessible form labels and validation messages;
- logical tab order;
- non-drag alternatives for ordering or matching activities.

## 5. Cognitive Load Support

The experience should:

- group related information;
- reveal complex content progressively;
- distinguish required, optional, urgent, and informational items;
- preserve source history;
- allow evidence review before decision submission;
- provide concise summaries of long meetings and documents;
- avoid unnecessary notifications and duplicate counts;
- show clear next actions;
- permit pause and resume without penalty.

## 6. Plain-Language Support

Plain-language support may include:

- simplified explanations of project-management terms;
- concise summaries before detailed content;
- examples of expected interaction types;
- glossary access without leaving the simulation context;
- shorter coaching variants;
- clarification of instructions without revealing answers.

Plain-language alternatives must preserve the competency and must not reduce the challenge by exposing decision outcomes.

## 7. Time and Pacing Support

Rules:

- nominal chapter times are estimates only;
- learners may pause and resume;
- inactivity must not create hidden penalties;
- timed interactions require explicit justification;
- extensions or untimed alternatives must be supported where timing is not the competency being assessed;
- delayed consequences are based on simulation sequence, not real-world waiting time.

## 8. Error Prevention and Recovery

The interface shall:

- distinguish save, submit, and finalize actions;
- warn before irreversible authoritative submission;
- preserve drafts where applicable;
- provide actionable validation messages;
- prevent duplicate submission during retries;
- restore the learner to a safe state after recoverable errors;
- never lose accepted decisions, reflections, or conversation history because of a presentation-layer failure.

## 9. Learning Support Features

Supported features may include:

- glossary;
- chapter objective summary;
- evidence checklist;
- document summaries;
- meeting transcripts;
- coaching on request;
- concept refreshers;
- replay in practice mode;
- targeted remediation;
- progress and next-action guidance.

## 10. Experience-Level Support

### Explorer

- proactive terminology definitions;
- guided evidence review;
- visible objective and next-step prompts;
- optional examples;
- immediate coaching.

### Practitioner

- support available on request;
- moderate evidence prompts;
- concise concept refreshers;
- targeted remediation after recurring patterns.

### Leader

- minimal proactive support;
- strategic summaries on request;
- accessibility support remains fully available;
- reduced scaffolding must never mean reduced accessibility.

## 11. Alternative Formats

Where technically feasible, the experience should support:

- transcript view for meetings;
- text summary for visual dashboards;
- tabular representation of charts;
- downloadable or printable learner summaries;
- alternate response input for long-form reflections;
- captioned and transcript-supported media.

## 12. Accessibility and Assessment Integrity

Accommodations must not:

- change the underlying learning objective;
- reveal hidden scoring;
- expose future branches;
- substitute an unrelated competency;
- penalize the learner through reduced XP or lower assessment weight.

Interface difficulty must be excluded from performance interpretation.

## 13. Support Failure Behavior

If optional support services fail:

- the simulation must remain usable;
- authoritative state must remain intact;
- a deterministic fallback must be available for required instructions;
- learners must be informed without technical jargon;
- required accessibility alternatives must not depend solely on generative AI.

## 14. Validation Requirements

Validation shall include:

- keyboard-only completion of core flows;
- screen-reader review of primary surfaces;
- zoom and reflow testing;
- color-independent status interpretation;
- caption and transcript availability;
- reduced-motion behavior;
- plain-language review;
- error recovery testing;
- accessibility review across Explorer, Practitioner, and Leader modes.

## 15. Acceptance Criteria

This document is satisfied when:

- core content and interactions are accessible;
- cognitive load and notification volume are controlled;
- plain-language support preserves assessment integrity;
- flexible pacing and pause/resume are supported;
- error recovery protects authoritative work;
- accommodations do not reduce scoring or progression;
- required alternatives do not rely only on AI generation;
- accessibility validation is part of Phase 5 acceptance.
