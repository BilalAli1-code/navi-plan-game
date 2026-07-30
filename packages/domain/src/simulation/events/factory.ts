import type {
  ActionRecordId,
  ActivityId,
  ActorId,
  AnalyticsSignalId,
  CausationId,
  CommandId,
  ConsequenceDefinitionId,
  ConsequenceId,
  ContentPackageVersionId,
  CorrelationId,
  DecisionId,
  DecisionOptionId,
  DecisionOutcomeId,
  DecisionRecordId,
  DocumentId,
  EventId,
  NotificationId,
  LearnerMessageDefinitionId,
  LearnerMessageOccurrenceId,
  LearningSignalId,
  ConversationId,
  MeetingDefinitionId,
  MeetingOccurrenceId,
  MessageId,
  MetricKey,
  ResolverVersion,
  ScheduledEventId,
  SimulationRunId,
  StakeholderId,
  StakeholderSignalId,
  TenantId,
} from "../../shared-kernel/ids";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { SimulationActionType } from "../commands/envelope";
import type {
  ConsequenceTarget,
  ConsequenceTiming,
  ProjectStateStatus,
  SupportedConsequenceType,
} from "../content/consequence-definition";
import { SIMULATION_RUN_AGGREGATE_TYPE } from "../run/lifecycle-events";
import type { ActivitySourceKind } from "../run/activity";
import type { NotificationSourceKind } from "../run/notification";
import type {
  ActivityCompletedEvent,
  ActivityInitializedEvent,
  AnalyticsSignalEmittedEvent,
  ConsequenceAppliedEvent,
  ConsequenceCreatedEvent,
  ConsequenceScheduledEvent,
  DecisionResolvedEvent,
  DecisionSubmittedEvent,
  LearnerMessageDeliveredEvent,
  LearningSignalEmittedEvent,
  MeetingCancelledEvent,
  MeetingCompletedEvent,
  MeetingMadeAvailableEvent,
  MeetingScheduledEvent,
  MeetingStartedEvent,
  ProjectMetricChangedEvent,
  ProjectStateTransitionedEvent,
  SimulationActionAcceptedEvent,
  DocumentInitializedEvent,
  NotificationInitializedEvent,
  StakeholderConversationOpenedEvent,
  StakeholderInitializedEvent,
  StakeholderMessageSentEvent,
  StakeholderSignalEmittedEvent,
} from "./events";

export { SIMULATION_RUN_AGGREGATE_TYPE } from "../run/lifecycle-events";

export const SIMULATION_ACTION_ACCEPTED_EVENT_VERSION = 1;
export const DECISION_SUBMITTED_EVENT_VERSION = 1;
export const DECISION_RESOLVED_EVENT_VERSION = 1;
export const CONSEQUENCE_CREATED_EVENT_VERSION = 1;
export const CONSEQUENCE_APPLIED_EVENT_VERSION = 1;
export const CONSEQUENCE_SCHEDULED_EVENT_VERSION = 1;
export const PROJECT_METRIC_CHANGED_EVENT_VERSION = 1;
export const PROJECT_STATE_TRANSITIONED_EVENT_VERSION = 1;
export const LEARNING_SIGNAL_EMITTED_EVENT_VERSION = 1;
export const STAKEHOLDER_SIGNAL_EMITTED_EVENT_VERSION = 1;
export const ANALYTICS_SIGNAL_EMITTED_EVENT_VERSION = 1;
export const LEARNER_MESSAGE_DELIVERED_EVENT_VERSION = 1;
export const MEETING_SCHEDULED_EVENT_VERSION = 1;
export const MEETING_MADE_AVAILABLE_EVENT_VERSION = 1;
export const MEETING_STARTED_EVENT_VERSION = 1;
export const MEETING_COMPLETED_EVENT_VERSION = 1;
export const MEETING_CANCELLED_EVENT_VERSION = 1;
export const STAKEHOLDER_INITIALIZED_EVENT_VERSION = 1;
export const STAKEHOLDER_CONVERSATION_OPENED_EVENT_VERSION = 1;
export const STAKEHOLDER_MESSAGE_SENT_EVENT_VERSION = 1;
export const DOCUMENT_INITIALIZED_EVENT_VERSION = 1;
export const NOTIFICATION_INITIALIZED_EVENT_VERSION = 1;
export const ACTIVITY_INITIALIZED_EVENT_VERSION = 1;
export const ACTIVITY_COMPLETED_EVENT_VERSION = 1;

interface BaseEventInput {
  readonly eventId: EventId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly aggregateVersion: number;
  readonly sequenceNumber: number;
  readonly actorId: ActorId | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly tenantId: TenantId | null;
  readonly simulationRunId: SimulationRunId;
  readonly aggregateType?: string;
}

const envelope = <TType extends string, TPayload>(
  input: BaseEventInput,
  eventType: TType,
  eventVersion: number,
  payload: TPayload,
) => ({
  eventId: input.eventId,
  eventType,
  eventVersion,
  aggregateId: input.simulationRunId,
  aggregateType: input.aggregateType ?? SIMULATION_RUN_AGGREGATE_TYPE,
  aggregateVersion: input.aggregateVersion,
  sequenceNumber: input.sequenceNumber,
  occurredAt: input.occurredAt,
  recordedAt: input.recordedAt,
  actorId: input.actorId,
  correlationId: input.correlationId,
  causationId: input.causationId,
  tenantId: input.tenantId,
  simulationRunId: input.simulationRunId,
  payload,
});

export interface CreateSimulationActionAcceptedEventInput extends BaseEventInput {
  readonly actionType: SimulationActionType;
  readonly commandId: CommandId;
  readonly actionRecordId: ActionRecordId;
}

export const createSimulationActionAcceptedEvent = (
  input: CreateSimulationActionAcceptedEventInput,
): SimulationActionAcceptedEvent =>
  envelope(
    input,
    "SimulationActionAccepted",
    SIMULATION_ACTION_ACCEPTED_EVENT_VERSION,
    {
      actionType: input.actionType,
      commandId: input.commandId,
      actionRecordId: input.actionRecordId,
      sequenceNumber: input.sequenceNumber,
    },
  );

export interface CreateDecisionSubmittedEventInput extends BaseEventInput {
  readonly decisionId: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionId: DecisionOptionId;
  readonly sourceActionId: ActionRecordId;
  readonly submittedBy: ActorId;
  readonly submittedAt: IsoTimestamp;
  readonly contextStateVersion: number;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createDecisionSubmittedEvent = (
  input: CreateDecisionSubmittedEventInput,
): DecisionSubmittedEvent =>
  envelope(input, "DecisionSubmitted", DECISION_SUBMITTED_EVENT_VERSION, {
    decisionId: input.decisionId,
    decisionDefinitionId: input.decisionDefinitionId,
    selectedOptionId: input.selectedOptionId,
    sourceActionId: input.sourceActionId,
    submittedBy: input.submittedBy,
    submittedAt: input.submittedAt,
    contextStateVersion: input.contextStateVersion,
    contentPackageVersionId: input.contentPackageVersionId,
  });

export interface CreateDecisionResolvedEventInput extends BaseEventInput {
  readonly decisionRecordId: DecisionRecordId;
  readonly decisionOutcomeId: DecisionOutcomeId;
  readonly resolverVersion: ResolverVersion;
  readonly qualityClassification: string | null;
  readonly consequenceIds: readonly ConsequenceId[];
  readonly resolvedAt: IsoTimestamp;
}

export const createDecisionResolvedEvent = (
  input: CreateDecisionResolvedEventInput,
): DecisionResolvedEvent =>
  envelope(input, "DecisionResolved", DECISION_RESOLVED_EVENT_VERSION, {
    decisionRecordId: input.decisionRecordId,
    decisionOutcomeId: input.decisionOutcomeId,
    resolverVersion: input.resolverVersion,
    qualityClassification: input.qualityClassification,
    consequenceIds: [...input.consequenceIds],
    resolvedAt: input.resolvedAt,
  });

export interface CreateConsequenceCreatedEventInput extends BaseEventInput {
  readonly consequenceId: ConsequenceId;
  readonly consequenceDefinitionId: ConsequenceDefinitionId;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceType: SupportedConsequenceType;
  readonly timing: ConsequenceTiming;
  readonly target: ConsequenceTarget;
  readonly resolverVersion: ResolverVersion;
}

export const createConsequenceCreatedEvent = (
  input: CreateConsequenceCreatedEventInput,
): ConsequenceCreatedEvent =>
  envelope(input, "ConsequenceCreated", CONSEQUENCE_CREATED_EVENT_VERSION, {
    consequenceId: input.consequenceId,
    consequenceDefinitionId: input.consequenceDefinitionId,
    originDecisionRecordId: input.originDecisionRecordId,
    consequenceType: input.consequenceType,
    timing: input.timing,
    target: input.target,
    resolverVersion: input.resolverVersion,
  });

export interface CreateConsequenceAppliedEventInput extends BaseEventInput {
  readonly consequenceId: ConsequenceId;
  readonly appliedAt: IsoTimestamp;
  readonly resultingStateVersion: number;
  readonly effectSummary: string;
}

export const createConsequenceAppliedEvent = (
  input: CreateConsequenceAppliedEventInput,
): ConsequenceAppliedEvent =>
  envelope(input, "ConsequenceApplied", CONSEQUENCE_APPLIED_EVENT_VERSION, {
    consequenceId: input.consequenceId,
    appliedAt: input.appliedAt,
    resultingStateVersion: input.resultingStateVersion,
    effectSummary: input.effectSummary,
  });

export interface CreateConsequenceScheduledEventInput extends BaseEventInput {
  readonly consequenceId: ConsequenceId;
  readonly scheduledEventId: ScheduledEventId;
  readonly delayMs: number;
  readonly dueAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
}

export const createConsequenceScheduledEvent = (
  input: CreateConsequenceScheduledEventInput,
): ConsequenceScheduledEvent =>
  envelope(input, "ConsequenceScheduled", CONSEQUENCE_SCHEDULED_EVENT_VERSION, {
    consequenceId: input.consequenceId,
    scheduledEventId: input.scheduledEventId,
    delayMs: input.delayMs,
    dueAt: input.dueAt,
    createdAt: input.createdAt,
  });

export interface CreateProjectMetricChangedEventInput extends BaseEventInput {
  readonly metricKey: MetricKey;
  readonly previousValue: number;
  readonly delta: number;
  readonly nextValue: number;
  readonly reasonCode: string;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceId: ConsequenceId;
}

export const createProjectMetricChangedEvent = (
  input: CreateProjectMetricChangedEventInput,
): ProjectMetricChangedEvent =>
  envelope(
    input,
    "ProjectMetricChanged",
    PROJECT_METRIC_CHANGED_EVENT_VERSION,
    {
      metricKey: input.metricKey,
      previousValue: input.previousValue,
      delta: input.delta,
      nextValue: input.nextValue,
      reasonCode: input.reasonCode,
      originDecisionRecordId: input.originDecisionRecordId,
      consequenceId: input.consequenceId,
    },
  );

export interface CreateProjectStateTransitionedEventInput extends BaseEventInput {
  readonly previousStatus: ProjectStateStatus;
  readonly nextStatus: ProjectStateStatus;
  readonly reasonCode: string;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceId: ConsequenceId;
}

export const createProjectStateTransitionedEvent = (
  input: CreateProjectStateTransitionedEventInput,
): ProjectStateTransitionedEvent =>
  envelope(
    input,
    "ProjectStateTransitioned",
    PROJECT_STATE_TRANSITIONED_EVENT_VERSION,
    {
      previousStatus: input.previousStatus,
      nextStatus: input.nextStatus,
      reasonCode: input.reasonCode,
      originDecisionRecordId: input.originDecisionRecordId,
      consequenceId: input.consequenceId,
    },
  );

export interface CreateLearningSignalEmittedEventInput extends BaseEventInput {
  readonly signalId: LearningSignalId;
  readonly signalType: string;
  readonly competencyKey: string;
  readonly delta: number;
  readonly reasonCode: string;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceId: ConsequenceId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly causationEventId: EventId | null;
}

export const createLearningSignalEmittedEvent = (
  input: CreateLearningSignalEmittedEventInput,
): LearningSignalEmittedEvent =>
  envelope(
    input,
    "LearningSignalEmitted",
    LEARNING_SIGNAL_EMITTED_EVENT_VERSION,
    {
      signalId: input.signalId,
      signalType: input.signalType,
      competencyKey: input.competencyKey,
      delta: input.delta,
      reasonCode: input.reasonCode,
      originDecisionRecordId: input.originDecisionRecordId,
      consequenceId: input.consequenceId,
      contentPackageVersionId: input.contentPackageVersionId,
      causationEventId: input.causationEventId,
    },
  );

export interface CreateStakeholderSignalEmittedEventInput extends BaseEventInput {
  readonly signalId: StakeholderSignalId;
  readonly signalType: string;
  readonly stakeholderId: StakeholderId;
  readonly sentimentDelta: number;
  readonly reasonCode: string;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceId: ConsequenceId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly causationEventId: EventId | null;
}

export const createStakeholderSignalEmittedEvent = (
  input: CreateStakeholderSignalEmittedEventInput,
): StakeholderSignalEmittedEvent =>
  envelope(
    input,
    "StakeholderSignalEmitted",
    STAKEHOLDER_SIGNAL_EMITTED_EVENT_VERSION,
    {
      signalId: input.signalId,
      signalType: input.signalType,
      stakeholderId: input.stakeholderId,
      sentimentDelta: input.sentimentDelta,
      reasonCode: input.reasonCode,
      originDecisionRecordId: input.originDecisionRecordId,
      consequenceId: input.consequenceId,
      contentPackageVersionId: input.contentPackageVersionId,
      causationEventId: input.causationEventId,
    },
  );

export interface CreateAnalyticsSignalEmittedEventInput extends BaseEventInput {
  readonly signalId: AnalyticsSignalId;
  readonly signalType: string;
  readonly dimension: string;
  readonly value: number;
  readonly reasonCode: string;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceId: ConsequenceId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly causationEventId: EventId | null;
}

export const createAnalyticsSignalEmittedEvent = (
  input: CreateAnalyticsSignalEmittedEventInput,
): AnalyticsSignalEmittedEvent =>
  envelope(
    input,
    "AnalyticsSignalEmitted",
    ANALYTICS_SIGNAL_EMITTED_EVENT_VERSION,
    {
      signalId: input.signalId,
      signalType: input.signalType,
      dimension: input.dimension,
      value: input.value,
      reasonCode: input.reasonCode,
      originDecisionRecordId: input.originDecisionRecordId,
      consequenceId: input.consequenceId,
      contentPackageVersionId: input.contentPackageVersionId,
      causationEventId: input.causationEventId,
    },
  );

export interface CreateLearnerMessageDeliveredEventInput extends BaseEventInput {
  readonly occurrenceId: LearnerMessageOccurrenceId;
  readonly messageDefinitionId: LearnerMessageDefinitionId;
  readonly definitionVersion: string;
  readonly deliverySequence: number;
  readonly deliveredAt: IsoTimestamp | null;
  readonly originDecisionRecordId: DecisionRecordId | null;
  readonly consequenceId: ConsequenceId | null;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly causationEventId: EventId | null;
}

export const createLearnerMessageDeliveredEvent = (
  input: CreateLearnerMessageDeliveredEventInput,
): LearnerMessageDeliveredEvent =>
  envelope(
    input,
    "LearnerMessageDelivered",
    LEARNER_MESSAGE_DELIVERED_EVENT_VERSION,
    {
      occurrenceId: input.occurrenceId,
      messageDefinitionId: input.messageDefinitionId,
      definitionVersion: input.definitionVersion,
      deliverySequence: input.deliverySequence,
      deliveredAt: input.deliveredAt,
      originDecisionRecordId: input.originDecisionRecordId,
      consequenceId: input.consequenceId,
      contentPackageVersionId: input.contentPackageVersionId,
      causationEventId: input.causationEventId,
    },
  );

export interface CreateMeetingScheduledEventInput extends BaseEventInput {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly meetingDefinitionVersion: string;
  readonly scheduleSequence: number;
  readonly scheduledFor: IsoTimestamp;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createMeetingScheduledEvent = (
  input: CreateMeetingScheduledEventInput,
): MeetingScheduledEvent =>
  envelope(input, "MeetingScheduled", MEETING_SCHEDULED_EVENT_VERSION, {
    meetingOccurrenceId: input.meetingOccurrenceId,
    meetingDefinitionId: input.meetingDefinitionId,
    meetingDefinitionVersion: input.meetingDefinitionVersion,
    scheduleSequence: input.scheduleSequence,
    scheduledFor: input.scheduledFor,
    status: "scheduled",
    originatingCommandId: input.originatingCommandId,
    contentPackageVersionId: input.contentPackageVersionId,
  });

export interface CreateMeetingMadeAvailableEventInput extends BaseEventInput {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly scheduleSequence: number;
  readonly availableAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

export const createMeetingMadeAvailableEvent = (
  input: CreateMeetingMadeAvailableEventInput,
): MeetingMadeAvailableEvent =>
  envelope(
    input,
    "MeetingMadeAvailable",
    MEETING_MADE_AVAILABLE_EVENT_VERSION,
    {
      meetingOccurrenceId: input.meetingOccurrenceId,
      meetingDefinitionId: input.meetingDefinitionId,
      scheduleSequence: input.scheduleSequence,
      status: "available",
      availableAt: input.availableAt,
      originatingCommandId: input.originatingCommandId,
    },
  );

export interface CreateMeetingStartedEventInput extends BaseEventInput {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly scheduleSequence: number;
  readonly startedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

export const createMeetingStartedEvent = (
  input: CreateMeetingStartedEventInput,
): MeetingStartedEvent =>
  envelope(input, "MeetingStarted", MEETING_STARTED_EVENT_VERSION, {
    meetingOccurrenceId: input.meetingOccurrenceId,
    meetingDefinitionId: input.meetingDefinitionId,
    scheduleSequence: input.scheduleSequence,
    status: "started",
    startedAt: input.startedAt,
    originatingCommandId: input.originatingCommandId,
  });

export interface CreateMeetingCompletedEventInput extends BaseEventInput {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly scheduleSequence: number;
  readonly completedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

export const createMeetingCompletedEvent = (
  input: CreateMeetingCompletedEventInput,
): MeetingCompletedEvent =>
  envelope(input, "MeetingCompleted", MEETING_COMPLETED_EVENT_VERSION, {
    meetingOccurrenceId: input.meetingOccurrenceId,
    meetingDefinitionId: input.meetingDefinitionId,
    scheduleSequence: input.scheduleSequence,
    status: "completed",
    completedAt: input.completedAt,
    originatingCommandId: input.originatingCommandId,
  });

export interface CreateMeetingCancelledEventInput extends BaseEventInput {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly scheduleSequence: number;
  readonly cancelledAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

export const createMeetingCancelledEvent = (
  input: CreateMeetingCancelledEventInput,
): MeetingCancelledEvent =>
  envelope(input, "MeetingCancelled", MEETING_CANCELLED_EVENT_VERSION, {
    meetingOccurrenceId: input.meetingOccurrenceId,
    meetingDefinitionId: input.meetingDefinitionId,
    scheduleSequence: input.scheduleSequence,
    status: "cancelled",
    cancelledAt: input.cancelledAt,
    originatingCommandId: input.originatingCommandId,
  });

export interface CreateStakeholderInitializedEventInput extends BaseEventInput {
  readonly stakeholderId: StakeholderId;
  readonly stakeholderDefinitionId: StakeholderId;
  readonly stakeholderDefinitionVersion: string;
  readonly initializationSequence: number;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createStakeholderInitializedEvent = (
  input: CreateStakeholderInitializedEventInput,
): StakeholderInitializedEvent =>
  envelope(
    input,
    "StakeholderInitialized",
    STAKEHOLDER_INITIALIZED_EVENT_VERSION,
    {
      stakeholderId: input.stakeholderId,
      stakeholderDefinitionId: input.stakeholderDefinitionId,
      stakeholderDefinitionVersion: input.stakeholderDefinitionVersion,
      initializationSequence: input.initializationSequence,
      originatingCommandId: input.originatingCommandId,
      contentPackageVersionId: input.contentPackageVersionId,
    },
  );

export interface CreateStakeholderConversationOpenedEventInput extends BaseEventInput {
  readonly conversationId: ConversationId;
  readonly stakeholderId: StakeholderId;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createStakeholderConversationOpenedEvent = (
  input: CreateStakeholderConversationOpenedEventInput,
): StakeholderConversationOpenedEvent =>
  envelope(
    input,
    "StakeholderConversationOpened",
    STAKEHOLDER_CONVERSATION_OPENED_EVENT_VERSION,
    {
      conversationId: input.conversationId,
      stakeholderId: input.stakeholderId,
      originatingCommandId: input.originatingCommandId,
      contentPackageVersionId: input.contentPackageVersionId,
    },
  );

export interface CreateStakeholderMessageSentEventInput extends BaseEventInput {
  readonly messageId: MessageId;
  readonly conversationId: ConversationId;
  readonly stakeholderId: StakeholderId;
  readonly conversationSequence: number;
  readonly authorActorId: ActorId;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createStakeholderMessageSentEvent = (
  input: CreateStakeholderMessageSentEventInput,
): StakeholderMessageSentEvent =>
  envelope(
    input,
    "StakeholderMessageSent",
    STAKEHOLDER_MESSAGE_SENT_EVENT_VERSION,
    {
      messageId: input.messageId,
      conversationId: input.conversationId,
      stakeholderId: input.stakeholderId,
      conversationSequence: input.conversationSequence,
      direction: "learner_to_stakeholder",
      authorActorId: input.authorActorId,
      originatingCommandId: input.originatingCommandId,
      contentPackageVersionId: input.contentPackageVersionId,
    },
  );

export interface CreateDocumentInitializedEventInput extends BaseEventInput {
  readonly documentId: DocumentId;
  readonly documentDefinitionId: DocumentId;
  readonly documentDefinitionVersion: string;
  readonly creationSequence: number;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createDocumentInitializedEvent = (
  input: CreateDocumentInitializedEventInput,
): DocumentInitializedEvent =>
  envelope(input, "DocumentInitialized", DOCUMENT_INITIALIZED_EVENT_VERSION, {
    documentId: input.documentId,
    documentDefinitionId: input.documentDefinitionId,
    documentDefinitionVersion: input.documentDefinitionVersion,
    creationSequence: input.creationSequence,
    status: "available",
    originatingCommandId: input.originatingCommandId,
    contentPackageVersionId: input.contentPackageVersionId,
  });

export interface CreateNotificationInitializedEventInput extends BaseEventInput {
  readonly notificationId: NotificationId;
  readonly creationSequence: number;
  readonly sourceKind: NotificationSourceKind;
  readonly sourceId: string | null;
  readonly sourceReason: string | null;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createNotificationInitializedEvent = (
  input: CreateNotificationInitializedEventInput,
): NotificationInitializedEvent =>
  envelope(
    input,
    "NotificationInitialized",
    NOTIFICATION_INITIALIZED_EVENT_VERSION,
    {
      notificationId: input.notificationId,
      creationSequence: input.creationSequence,
      status: "active",
      sourceKind: input.sourceKind,
      sourceId: input.sourceId,
      sourceReason: input.sourceReason,
      originatingCommandId: input.originatingCommandId,
      contentPackageVersionId: input.contentPackageVersionId,
    },
  );

export interface CreateActivityInitializedEventInput extends BaseEventInput {
  readonly activityId: ActivityId;
  readonly creationSequence: number;
  readonly sourceKind: ActivitySourceKind;
  readonly sourceId: string | null;
  readonly sourceReason: string | null;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createActivityInitializedEvent = (
  input: CreateActivityInitializedEventInput,
): ActivityInitializedEvent =>
  envelope(input, "ActivityInitialized", ACTIVITY_INITIALIZED_EVENT_VERSION, {
    activityId: input.activityId,
    creationSequence: input.creationSequence,
    status: "active",
    sourceKind: input.sourceKind,
    sourceId: input.sourceId,
    sourceReason: input.sourceReason,
    originatingCommandId: input.originatingCommandId,
    contentPackageVersionId: input.contentPackageVersionId,
  });

export interface CreateActivityCompletedEventInput extends BaseEventInput {
  readonly activityId: ActivityId;
  readonly completionSequence: number;
  readonly completedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export const createActivityCompletedEvent = (
  input: CreateActivityCompletedEventInput,
): ActivityCompletedEvent =>
  envelope(input, "ActivityCompleted", ACTIVITY_COMPLETED_EVENT_VERSION, {
    activityId: input.activityId,
    completionSequence: input.completionSequence,
    status: "completed",
    completedAt: input.completedAt,
    originatingCommandId: input.originatingCommandId,
    contentPackageVersionId: input.contentPackageVersionId,
  });
