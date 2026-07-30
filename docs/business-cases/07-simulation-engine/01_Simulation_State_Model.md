# BC-006 — Simulation State Model

Status: Draft for implementation
Phase: 3 — Simulation Engine
Business case: Northstar Flagship Simulation

## 1. Purpose

This document defines the authoritative runtime state for the Northstar flagship simulation. It establishes the state owned by the simulation aggregate, the lifecycle of each runtime entity, the boundaries between source state and derived projections, and the invariants required for deterministic replay.

## 2. Authoritative aggregate

The simulation run aggregate is the single source of truth for learner progress and project state.

```ts
interface SimulationState {
  simulationRunId: string;
  businessCaseId: string;
  learnerId: string;
  tenantId: string;
  experienceLevel: "explorer" | "practitioner" | "leader";
  status: SimulationRunStatus;
  currentChapterId: string;
  currentChapterStatus: ChapterStatus;
  chapterStates: Record<string, ChapterRuntimeState>;
  decisions: Record<string, DecisionRuntimeState>;
  activities: Record<string, ActivityRuntimeState>;
  meetings: Record<string, MeetingRuntimeState>;
  inboxItems: Record<string, InboxRuntimeState>;
  documents: Record<string, DocumentRuntimeState>;
  stakeholders: Record<string, StakeholderRuntimeState>;
  metrics: ProjectMetricState;
  risks: Record<string, RiskRuntimeState>;
  issues: Record<string, IssueRuntimeState>;
  scheduledConsequences: Record<string, ScheduledConsequenceState>;
  achievements: Record<string, AchievementRuntimeState>;
  learning: LearningRuntimeState;
  ending?: EndingRuntimeState;
  sequence: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

## 3. Simulation run lifecycle

Supported states:

- `not_started`
- `active`
- `paused`
- `completed`
- `failed`
- `abandoned`

Invariants:

1. A run starts in `not_started` and may transition to `active` only once.
2. A completed run is immutable except for administrative annotations and projection rebuilds.
3. A failed run must preserve the event history and failure reason.
4. A run cannot be both completed and failed.
5. Chapter progression cannot move backward unless an explicit replay or recovery command starts a new derived run.

## 4. Chapter runtime state

```ts
interface ChapterRuntimeState {
  chapterId: string;
  status: "locked" | "available" | "active" | "blocked" | "completed";
  enteredAt?: string;
  completedAt?: string;
  requiredDecisionIds: string[];
  requiredActivityIds: string[];
  requiredMeetingIds: string[];
  requiredDocumentIds: string[];
  completedRequirementKeys: string[];
  blockingReasons: ChapterBlockReason[];
  recoveryState?: ChapterRecoveryState;
  progressPercent: number;
}
```

Chapter progress must be computed from authoritative completion flags, never from UI-local state.

## 5. Decision runtime state

```ts
interface DecisionRuntimeState {
  decisionId: string;
  definitionId: string;
  chapterId: string;
  status: "locked" | "available" | "submitted" | "resolved" | "superseded";
  selectedOptionId?: string;
  evidenceRefs: string[];
  submittedAt?: string;
  resolvedAt?: string;
  resolutionId?: string;
  immediateConsequenceIds: string[];
  delayedConsequenceIds: string[];
  score?: DecisionScoreState;
}
```

Decision invariants:

- A decision may be resolved only once.
- Informational content must never create a decision state.
- A submitted decision must reference a valid canonical decision definition.
- Resubmission requires an explicit retry policy and must not duplicate consequences.

## 6. Activity, meeting, inbox, and document state

Each runtime entity must use a stable definition ID and a run-specific state record.

Common lifecycle values:

- `locked`
- `available`
- `in_progress`
- `completed`
- `archived`

Entity-specific extensions may include:

- meeting attendance and outcome records
- inbox read, responded, and archived flags
- document viewed, edited, approved, and submitted flags
- activity attempt count and assessment output

Completion must be represented once in authoritative state and projected consistently across Mission Control, Inbox, Meetings, Documents, Decision Log, Performance, and chapter dashboards.

## 7. Stakeholder runtime state

```ts
interface StakeholderRuntimeState {
  stakeholderId: string;
  trust: number;
  confidence: number;
  influence: number;
  engagement: number;
  sentiment: "supportive" | "neutral" | "concerned" | "resistant" | "hostile";
  relationshipFlags: string[];
  activeStoryArcIds: string[];
  conversationThreadIds: string[];
  lastInteractionAt?: string;
}
```

Stakeholder conversation history is append-only. UI surfaces may filter or summarize it, but must not delete prior messages from the authoritative record.

## 8. Project metrics

The authoritative metric state contains bounded values for:

- schedule health
- cost health
- scope stability
- quality confidence
- risk exposure
- compliance confidence
- stakeholder trust
- team sustainability
- vendor confidence
- executive confidence
- business value confidence

Metric changes must store provenance:

```ts
interface MetricAdjustment {
  adjustmentId: string;
  sourceType: "decision" | "activity" | "meeting" | "consequence" | "system";
  sourceId: string;
  metricKey: string;
  delta: number;
  resultingValue: number;
  appliedAt: string;
}
```

## 9. Risks and issues

Risks and issues are distinct runtime entities.

A risk may transition through:

- identified
- analyzed
- response_planned
- monitoring
- triggered
- closed

An issue may transition through:

- open
- assigned
- in_progress
- escalated
- resolved
- closed

A triggered risk may create an issue through an explicit domain event.

## 10. Scheduled consequences

```ts
interface ScheduledConsequenceState {
  scheduledConsequenceId: string;
  consequenceDefinitionId: string;
  sourceDecisionId: string;
  targetChapterId?: string;
  triggerType: "chapter_entry" | "chapter_exit" | "metric_threshold" | "event" | "manual";
  triggerExpression: string;
  status: "scheduled" | "eligible" | "applied" | "cancelled" | "expired";
  dueSequence?: number;
  appliedAt?: string;
  cancellationReason?: string;
}
```

## 11. Learning state

Learning state includes:

- competency evidence
- PMBOK mapping evidence
- mastery updates
- XP
- achievements
- reflection completion
- coaching recommendations

Learning outputs must be traceable to authoritative learner actions and simulation events.

## 12. Ending state

```ts
interface EndingRuntimeState {
  endingId: string;
  endingProfileId: string;
  achievedAt: string;
  projectOutcome: string;
  leadershipOutcome: string;
  stakeholderOutcome: string;
  benefitsOutcome: string;
  evidenceRefs: string[];
}
```

Only one final ending may be authoritative for a completed run.

## 13. Projection boundary

Authoritative state contains facts. Projections contain derived views.

Examples of projections:

- pending decision count
- chapter progress percentage
- Mission Control task list
- performance dashboard
- stakeholder summary
- project-health summary

Projection rebuilds must produce the same result from the same ordered event stream.

## 14. Versioning and concurrency

Every state mutation must increment:

- aggregate `version`
- ordered `sequence`

Commands must include the expected aggregate version where optimistic concurrency is required.

## 15. Required invariants

1. No completed entity may re-enter `available` without an explicit reset workflow.
2. A decision consequence must be applied exactly once.
3. Chapter completion must reference only authoritative completion records.
4. All entity IDs must be stable and globally unique within the business case namespace.
5. Derived counts must never be persisted as independent sources of truth.
6. Replay from events must recreate equivalent state.
7. Informational inbox items and meetings must not be counted as pending decisions.
8. Archiving changes visibility, not historical existence.

## 16. Acceptance criteria

This specification is complete when:

- every Phase 1 catalog entity maps to a runtime state model
- every Phase 2 decision and consequence maps to authoritative state
- all chapter progress rules can be computed from state
- stakeholder conversations persist across chapters
- delayed consequences survive reloads and replay
- all surfaces can derive consistent projections from the same state
