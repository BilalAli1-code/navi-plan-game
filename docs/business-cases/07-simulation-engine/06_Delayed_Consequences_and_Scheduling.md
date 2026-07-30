# BC-006 — Delayed Consequences and Scheduling

Status: Draft for implementation
Phase: 3 — Simulation Engine
Business case: Northstar Flagship Simulation

## 1. Purpose

This document defines how delayed, conditional, chained, cancelled, superseded, and cross-chapter consequences are represented and applied exactly once.

## 2. Scheduling principles

1. Every delayed consequence has a stable definition ID and run-specific schedule ID.
2. Scheduling and application are separate events.
3. Eligibility is determined from authoritative state.
4. Application is exactly once.
5. Reload, retry, projection rebuild, and event replay cannot duplicate effects.
6. Consequences must preserve causation to the learner decision or system event that created them.
7. Cross-chapter consequences survive chapter transitions.

## 3. Scheduled consequence state

```ts
interface ScheduledConsequenceState {
  scheduledConsequenceId: string;
  consequenceDefinitionId: string;
  sourceEventId: string;
  sourceDecisionId?: string;
  createdInChapterId: string;
  targetChapterId?: string;
  triggerType: "chapter_entry" | "chapter_exit" | "event" | "metric_threshold" | "completion" | "manual";
  triggerExpression: string;
  status: "scheduled" | "eligible" | "applied" | "cancelled" | "expired" | "superseded";
  priority: number;
  dueSequence?: number;
  eligibleAtSequence?: number;
  appliedAtSequence?: number;
  cancellationReason?: string;
  supersededById?: string;
}
```

## 4. Lifecycle

A delayed consequence follows:

```text
scheduled -> eligible -> applied
```

Alternative terminal paths:

```text
scheduled -> cancelled
scheduled -> expired
scheduled -> superseded
eligible -> cancelled
eligible -> superseded
```

Applied consequences are immutable.

## 5. Scheduling event

`ConsequenceScheduled` must include:

- schedule ID
- consequence definition ID
- source decision or event
- trigger type and expression
- target chapter, when applicable
- priority
- cancellation and supersession policy
- definition version

## 6. Eligibility evaluation

Eligibility is evaluated after each authoritative event and at chapter entry or exit boundaries.

A consequence becomes eligible only when:

- its status is `scheduled`
- its trigger expression evaluates true
- all prerequisite consequence IDs are applied or explicitly waived
- it has not expired, been cancelled, or been superseded

Eligibility emits `ConsequenceBecameEligible`.

## 7. Application transaction

Applying a consequence must atomically:

1. lock or version-check the schedule record
2. verify status is `eligible`
3. record `ConsequenceApplied`
4. apply metric, stakeholder, content, risk, issue, learning, or gating effects
5. schedule any child consequences
6. update the schedule status to `applied`
7. commit outbox events

## 8. Exactly-once safeguards

Use these guards:

- unique `scheduledConsequenceId`
- unique consequence application receipt
- idempotency key derived from run ID plus schedule ID
- transactional event and state persistence
- duplicate event delivery protection in projections

A retry must return the prior application result without reapplying deltas or releasing duplicate content.

## 9. Trigger types

### Chapter entry

Applies when the target chapter is entered.

### Chapter exit

Applies immediately before or after completion according to explicit timing metadata.

### Event

Applies after a matching authoritative event.

### Metric threshold

Applies when a metric crosses the configured boundary in the specified direction.

### Completion

Applies after a required activity, meeting, document, decision, story arc, or recovery obligation completes.

### Manual

Requires an authorized administrative or recovery command and must not be used for ordinary narrative flow.

## 10. Cross-chapter consequences

A decision made in an earlier chapter may affect later chapters through:

- stakeholder trust and sentiment
- vendor performance
- schedule and cost conditions
- quality findings
- compliance exposure
- issue creation
- meeting tone and agenda
- available decision options
- ending eligibility

Cross-chapter consequences must not be collapsed into immediate effects merely for implementation convenience.

## 11. Chained consequences

```ts
interface ConsequenceDependency {
  parentConsequenceId: string;
  childConsequenceId: string;
  relationship: "requires" | "activates" | "cancels" | "supersedes";
}
```

Chains must be acyclic unless a bounded loop is explicitly validated. Child schedules preserve the original correlation ID and reference the parent application as causation.

## 12. Cancellation

Cancellation is permitted only by an explicit rule such as:

- a preventative action completed before eligibility
- the source decision was validly superseded
- a risk was closed before triggering
- the relevant branch became impossible
- an administrator repaired invalid state

Cancellation must emit `ConsequenceCancelled` with reason and source.

## 13. Supersession

Supersession replaces a pending consequence with a more specific or updated consequence. It must:

- identify the replacement schedule
- preserve traceability
- prevent both consequences from applying
- never alter an already-applied consequence

## 14. Expiration

Expiration is appropriate only when a consequence has a bounded relevance window. Expiration rules must use event sequence or explicit chapter boundary rather than unreliable client time.

## 15. Ordering

When multiple consequences become eligible from one root event:

1. safety and compliance
2. chapter blocking
3. risk and issue creation
4. metric changes
5. stakeholder state
6. content release
7. learning and achievements
8. ending eligibility

Within a category, use numeric priority and stable schedule ID as tie-breaker.

## 16. Failure handling

If application fails:

- status remains eligible unless the full transaction committed
- no partial metric or stakeholder effects are authoritative
- retries use the same application key
- operational failure is logged separately from narrative state

## 17. Replay and rebuild

Event replay reconstructs the schedule ledger from scheduling, eligibility, cancellation, supersession, expiration, and application events. Replay must not call external notification systems or regenerate already-materialized effects.

## 18. Observability

For each schedule expose:

- source
- current status
- trigger definition
- target chapter
- application result
- cancellation or supersession reason
- correlation and causation chain

Learner-facing projections may hide future details, while administrative diagnostics retain full visibility.

## 19. Validation rules

- every Phase 2 delayed consequence has one schedule definition
- every schedule has a valid trigger
- every schedule reaches at most one terminal state
- applied consequences cannot be cancelled or superseded
- duplicate application is impossible
- cross-chapter schedules survive persistence and reload
- chains are finite and deterministically ordered

## 20. Acceptance criteria

The model is complete when all Northstar delayed effects can be scheduled, traced, applied exactly once, cancelled or superseded under explicit rules, and replayed to the same final state.
