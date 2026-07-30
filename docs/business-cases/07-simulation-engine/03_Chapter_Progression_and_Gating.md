# BC-006 — Chapter Progression and Gating

Status: Draft for implementation
Phase: 3 — Simulation Engine
Business case: Northstar Flagship Simulation

## 1. Purpose

This document defines deterministic chapter entry, progression, blocking, recovery, completion, and transition rules for the six-chapter Northstar simulation.

## 2. Progression principles

1. Chapters are completed in canonical order.
2. Learners may progress at their own pace; progression is not calendar-locked.
3. Required actions cannot be skipped.
4. Optional enrichment never blocks progression unless explicitly configured for the selected experience level.
5. Completion is determined only from authoritative state.
6. Failed or poor-quality decisions may change later conditions but do not normally create dead ends.
7. Recovery obligations must be explicit, bounded, and educationally meaningful.

## 3. Chapter states

- `locked`: prior prerequisites are incomplete.
- `available`: entry prerequisites are satisfied.
- `active`: learner has entered the chapter.
- `blocked`: an explicit condition prevents completion or transition.
- `completed`: all required obligations are satisfied and the exit has been recorded.

Only one chapter may be `active` for a run.

## 4. Requirement model

```ts
interface ChapterRequirement {
  requirementKey: string;
  chapterId: string;
  category: "decision" | "activity" | "meeting" | "document" | "reflection" | "recovery";
  targetDefinitionId: string;
  requiredFor: Array<"explorer" | "practitioner" | "leader">;
  completionPredicate: string;
  blocking: boolean;
}
```

Stable requirement keys prevent duplicate counting and allow cross-surface convergence.

## 5. Entry rules

A chapter becomes available when:

- the previous chapter is completed
- all mandatory transition consequences from the previous chapter are applied or safely scheduled
- no run-level failure state exists
- content definitions required for the target chapter are available and version-compatible

Entering a chapter emits `ChapterEntered` exactly once.

## 6. Chapter 1 — Initiation and Alignment

Entry:

- simulation run started
- Northstar business case selected
- experience level selected

Required outcomes:

- understand the project mandate and strategic objective
- review initial sponsor and stakeholder communications
- complete required initiation activities and meetings
- submit the chapter's authoritative decisions
- establish the initial project direction

Exit:

- all Chapter 1 required keys complete
- no unresolved initiation blocker
- Chapter 2 transition event scheduled

## 7. Chapter 2 — Planning and Mobilization

Entry:

- Chapter 1 completed
- initiation decisions resolved

Required outcomes:

- establish delivery, governance, and planning direction
- address scope, schedule, resource, risk, and stakeholder planning obligations
- complete mandatory planning meetings, documents, activities, and decisions

Exit:

- planning baseline obligations complete
- unresolved critical planning gaps either resolved or converted into explicit monitored risks
- Chapter 3 transition event scheduled

## 8. Chapter 3 — Execution and Early Delivery

Entry:

- Chapter 2 completed
- required plan artifacts available

Required outcomes:

- coordinate work and stakeholder engagement
- respond to early execution signals
- manage quality, team, vendor, communication, and delivery tradeoffs
- complete required execution decisions and activities

Exit:

- mandatory execution obligations complete
- active critical issues have owners and response states
- Chapter 4 transition event scheduled

## 9. Chapter 4 — Disruption and Recovery

Entry:

- Chapter 3 completed
- disruption narrative triggers activated

Required outcomes:

- assess disruption impact
- select appropriate response and escalation paths
- manage governance, risk, stakeholder, and recovery decisions
- complete any conditionally activated recovery obligations

Exit:

- recovery path selected and recorded
- mandatory recovery actions complete
- unresolved residual exposure explicitly accepted, transferred, mitigated, or escalated
- Chapter 5 transition event scheduled

## 10. Chapter 5 — Stabilization and Benefits Readiness

Entry:

- Chapter 4 completed
- recovery state evaluated

Required outcomes:

- stabilize delivery and stakeholder confidence
- verify quality and operational readiness
- prepare transition, adoption, and benefits conditions
- resolve required late-stage decisions

Exit:

- readiness obligations complete
- critical acceptance blockers resolved or formally dispositioned
- Chapter 6 transition event scheduled

## 11. Chapter 6 — Closure and Outcomes

Entry:

- Chapter 5 completed
- closure content released

Required outcomes:

- complete project or phase closure obligations
- confirm transition and ownership
- evaluate benefits and outcome evidence
- complete reflection and final assessment
- determine the authoritative ending

Exit:

- all closure requirements complete
- final ending recorded
- run marked completed

## 12. Progress calculation

For a chapter:

```text
progressPercent = completedRequiredWeight / totalRequiredWeight × 100
```

Default weight is 1 per requirement. Definitions may assign weights only when pedagogically justified and validated.

Rules:

- optional content is excluded from the denominator
- one requirement key contributes at most once
- informational emails and meetings do not count unless tied to a required completion predicate
- a decision is complete only when resolved, not merely opened
- archived status alone does not imply completion

## 13. Blocking model

Valid blockers include:

- missing required decision
- missing required artifact
- unresolved safety or compliance obligation
- incomplete recovery action
- invalid or conflicting state
- required definition unavailable

A blocker must include:

- stable blocker code
- learner-facing explanation
- source requirement
- resolution action
- severity

## 14. Recovery model

Poor choices may activate recovery rather than halt the simulation.

Recovery states may require:

- corrective meeting
- revised artifact
- escalation decision
- stakeholder repair interaction
- additional reflection or coaching

Recovery obligations must not erase the original decision. They add evidence of adaptation and leadership response.

## 15. Experience-level tailoring

Explorer:

- more guided preparation
- fewer optional complexity branches
- explicit requirement explanations

Practitioner:

- standard evidence and ambiguity
- balanced recovery and tradeoff complexity

Leader:

- broader governance implications
- more conditional obligations
- greater stakeholder and benefits complexity

Core chapter outcomes remain comparable across levels.

## 16. No-skipping and flexible pace

The engine does not unlock chapters by real-world date. Learners may complete the program quickly or over multiple sessions. However, a chapter transition command must fail when any blocking requirement remains incomplete.

## 17. Completion transaction

Chapter completion must atomically:

1. validate requirements
2. record `ChapterCompleted`
3. apply chapter-exit triggers
4. schedule delayed consequences
5. unlock the next chapter when applicable
6. refresh projections

## 18. Acceptance criteria

- all six chapters have deterministic entry and exit rules
- chapter progress matches authoritative completion state
- no required decision, meeting, document, activity, or recovery obligation can be skipped
- informational content is not accidentally counted
- flexible pacing works without calendar gates
- poor decisions produce consequences and recovery paths rather than inconsistent state
- completion remains consistent across all UI surfaces
