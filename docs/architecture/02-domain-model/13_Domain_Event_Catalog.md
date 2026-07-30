# Domain Event Catalog

**Document ID:** PS-DOM-013  
**Version:** 1.1  
**Status:** Approved

## Canonical Envelope

```ts
interface DomainEvent<TType extends string, TPayload> {
  eventId: string;
  eventType: TType;
  eventVersion: number;
  aggregateId: string;
  aggregateType: string;
  aggregateVersion: number;
  sequenceNumber: number;
  occurredAt: string;
  recordedAt: string;
  actorId: string | null;
  correlationId: string;
  causationId: string | null;
  tenantId: string | null;
  simulationRunId: string | null;
  payload: TPayload;
}
```

## Event Families

### Runtime
- `SimulationRunCreated`
- `SimulationRunStarted`
- `SimulationRunPaused`
- `SimulationRunResumed`
- `SimulationRunCompleted`
- `SimulationRunFailed`
- `SimulationRunRecovered`
- `SimulationRunArchived`
- `SimulationActionAccepted`
- `SimulationActionRejected`
- `SimulationActionProcessed`
- `SimulationCheckpointCreated`
- `ScheduledEventReleased`

### Simulation
- `ProjectStateTransitioned`
- `ProjectMetricChanged`
- `ProjectHealthChanged`
- `MilestoneCompleted`
- `ChangeRequestApproved`
- `TeamMoraleChanged`

### Progression
- `ChapterUnlocked`
- `ChapterActivated`
- `ChapterCompleted`
- `DayUnlocked`
- `DayActivated`
- `DayCompleted`
- `ActivityUnlocked`
- `ActivityStarted`
- `ActivityCompleted`
- `CompletionRequirementSatisfied`

### Decision and Consequence
- `DecisionSubmitted`
- `DecisionValidated`
- `DecisionRejected`
- `DecisionResolved`
- `ConsequenceCreated`
- `ConsequenceApplied`
- `ConsequenceScheduled`
- `ConsequenceCompensated`
- `LearnerMessageDelivered` (system-delivered learner Inbox message occurrence; see PS-DOM-017)

### Risk and Issue
- `RiskIdentified`
- `RiskAssessed`
- `RiskResponseSelected`
- `RiskEscalated`
- `RiskRealized`
- `RiskClosed`
- `IssueCreated`
- `IssueEscalated`
- `IssueResolved`

### Content
- `ContentPackageCreated`
- `ContentPackageValidated`
- `ContentPackagePublished`
- `ContentPackageDeprecated`
- `ContentPackageArchived`

### Stakeholder
- `StakeholderRelationshipInitialized`
- `StakeholderInteractionRecorded`
- `ConversationMessageRecorded`
- `StakeholderTrustChanged`
- `StakeholderSupportChanged`
- `StakeholderConcernRaised`
- `StakeholderCommitmentCreated`
- `StakeholderCommitmentFulfilled`
- `StakeholderPostureChanged`
- `StakeholderEscalationCreated`

### Learning
- `MasteryEvidenceRecorded`
- `CompetencyMasteryChanged`
- `LearningObjectiveProgressed`
- `ReflectionRecorded`
- `ReflectionEvaluated`
- `AssessmentAttemptCompleted`
- `AchievementUnlocked`
- `LearningRecommendationCreated`
- `ExamReadinessChanged`

### Projection, Analytics, AI, Identity, Reporting
- `ProjectionInvalidated`
- `ProjectionRebuilt`
- `AnalyticsSignalRecorded`
- `InsightGenerated`
- `ForecastGenerated`
- `AIRequestCreated`
- `AIResponseGenerated`
- `AIResponseValidated`
- `AIFallbackUsed`
- `UserRegistered`
- `EnrollmentCreated`
- `ReportRequested`
- `ReportGenerated`
- `ReportDelivered`

## Delivery Semantics

ProjectSim uses at-least-once asynchronous delivery.

Consumers must be idempotent. The transactional outbox pattern is preferred.

## Ordering

- Aggregate sequence is authoritative.
- Global order is not assumed.
- Correlation and causation connect related events.
- Replay uses aggregate sequence, not broker arrival order.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial domain-event catalog |
| 1.1 | Approved | Add `SimulationRunArchived` to Runtime family (aligns catalog with PS-DOM-003 / PS-DOM-014 Completed→Archived lifecycle; PS-ROADMAP-003) |
