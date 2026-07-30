# BC-006 — Event and Trigger Model

Status: Draft for implementation
Phase: 3 — Simulation Engine
Business case: Northstar Flagship Simulation

## 1. Purpose

This document defines the event taxonomy, trigger semantics, ordering rules, and deterministic execution model for the Northstar flagship simulation.

## 2. Command-to-event flow

All learner and system actions follow this sequence:

1. command received
2. authorization and validation
3. idempotency check
4. aggregate state load
5. command handler execution
6. domain event emission
7. state mutation
8. outbox persistence
9. projection update
10. delayed trigger evaluation

A command must never mutate a projection directly.

## 3. Event envelope

```ts
interface SimulationEventEnvelope<TPayload> {
  eventId: string;
  eventType: string;
  eventVersion: number;
  simulationRunId: string;
  tenantId: string;
  businessCaseId: string;
  chapterId?: string;
  aggregateVersion: number;
  sequence: number;
  correlationId: string;
  causationId?: string;
  idempotencyKey?: string;
  occurredAt: string;
  actor: EventActor;
  payload: TPayload;
}
```

## 4. Core event taxonomy

### Run lifecycle

- `SimulationRunCreated`
- `SimulationRunStarted`
- `SimulationRunPaused`
- `SimulationRunResumed`
- `SimulationRunCompleted`
- `SimulationRunFailed`
- `SimulationRunAbandoned`

### Chapter lifecycle

- `ChapterUnlocked`
- `ChapterEntered`
- `ChapterBlocked`
- `ChapterRecoveryActivated`
- `ChapterCompleted`

### Content lifecycle

- `InboxItemReleased`
- `InboxItemRead`
- `InboxItemRespondedTo`
- `InboxItemArchived`
- `MeetingReleased`
- `MeetingStarted`
- `MeetingCompleted`
- `DocumentReleased`
- `DocumentViewed`
- `DocumentSubmitted`
- `DocumentApproved`
- `ActivityReleased`
- `ActivityStarted`
- `ActivityCompleted`

### Decision lifecycle

- `DecisionUnlocked`
- `DecisionSubmitted`
- `DecisionResolved`
- `DecisionSuperseded`

### Consequences and project state

- `ConsequenceScheduled`
- `ConsequenceBecameEligible`
- `ConsequenceApplied`
- `ConsequenceCancelled`
- `ConsequenceExpired`
- `MetricAdjusted`
- `RiskIdentified`
- `RiskTriggered`
- `IssueCreated`
- `IssueResolved`

### Stakeholder and learning

- `StakeholderInteractionRecorded`
- `StakeholderStateChanged`
- `CompetencyEvidenceRecorded`
- `MasteryUpdated`
- `AchievementUnlocked`
- `ReflectionCompleted`
- `EndingDetermined`

## 5. Trigger model

```ts
interface TriggerDefinition {
  triggerId: string;
  triggerType: "event" | "state" | "chapter_entry" | "chapter_exit" | "metric_threshold" | "completion";
  sourcePattern?: string;
  conditionExpression?: string;
  targetActions: TriggerAction[];
  priority: number;
  oncePerRun: boolean;
}
```

Trigger actions may:

- release content
- unlock a decision
- schedule a consequence
- adjust stakeholder state
- activate a story arc
- block or unblock a chapter
- record learning evidence
- determine an ending

## 6. Trigger evaluation order

For every accepted event, triggers are evaluated in this order:

1. safety and compliance triggers
2. chapter-blocking triggers
3. direct event triggers
4. consequence scheduling triggers
5. content release triggers
6. stakeholder behavior triggers
7. metric threshold triggers
8. learning and achievement triggers
9. chapter completion triggers
10. ending triggers

Within the same class, lower numeric priority executes first. Equal priorities use stable trigger ID ordering.

## 7. Determinism

Deterministic behavior requires:

- stable event sequence
- stable trigger ordering
- no use of wall-clock time inside pure resolution logic
- seeded randomness when variation is required
- versioned definitions
- explicit tie-breaking rules

The same initial state, definition set, and ordered command stream must generate the same authoritative event stream.

## 8. Idempotency

Idempotency applies at command and effect levels.

- Duplicate commands with the same idempotency key return the prior receipt.
- Duplicate event delivery must not duplicate projections.
- Trigger execution must record a stable application key.
- Consequence application must be guarded by `scheduledConsequenceId`.
- Metric adjustments must reference a unique source adjustment ID.

## 9. Causation and correlation

Every generated event must preserve:

- `correlationId` for the full user interaction or workflow
- `causationId` for the event or command that directly caused it

This enables full traceability from a UI action to decisions, consequences, metrics, stakeholder changes, and learning outcomes.

## 10. Chapter-entry triggers

On `ChapterEntered`, the engine must:

1. release mandatory opening content
2. evaluate carried delayed consequences
3. update stakeholder story arcs
4. expose chapter objectives
5. calculate initial chapter blockers
6. emit projection refresh signals

## 11. Completion triggers

Completion triggers must use authoritative state and may activate only when all required keys are complete.

```ts
required = decisions + activities + meetings + documents + explicit recovery obligations
```

Optional content must not block progression unless a definition explicitly marks it required for the learner's experience level.

## 12. Metric-threshold triggers

Threshold triggers must define:

- metric key
- comparison operator
- threshold
- crossing direction
- hysteresis or reactivation rule
- target action

A trigger should normally fire on threshold crossing, not continuously while a value remains beyond the threshold.

## 13. Trigger cycles

The engine must prevent infinite trigger loops.

Controls:

- maximum trigger depth per root event
- applied-trigger ledger
- cycle detection by causation chain
- rejection of definition graphs with unbounded cycles

## 14. Failure semantics

If trigger evaluation fails:

- authoritative transaction must roll back when atomicity is required
- failure must be recorded with correlation and causation IDs
- no partial consequence chain may be reported as complete
- retry must be idempotent

## 15. Replay semantics

Replay processes events strictly by sequence. External side effects must be disabled or routed to replay-safe adapters. Trigger evaluation is not repeated when replaying already-materialized authoritative events unless rebuilding from commands is explicitly requested.

## 16. Acceptance criteria

- every catalog release has an explicit trigger
- every decision has an unlock trigger
- every delayed consequence has an eligibility trigger
- all trigger ordering is deterministic
- duplicate delivery produces no duplicate effects
- chapter completion cannot be caused by UI-local flags
- event traces explain all metric and stakeholder changes
