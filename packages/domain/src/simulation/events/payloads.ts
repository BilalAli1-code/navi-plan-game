import type {
  ActionRecordId,
  ActivityId,
  ActorId,
  AnalyticsSignalId,
  CommandId,
  ConsequenceDefinitionId,
  ConsequenceId,
  ContentPackageVersionId,
  ConversationId,
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
  MeetingDefinitionId,
  MeetingOccurrenceId,
  MessageId,
  MetricKey,
  ResolverVersion,
  ScheduledEventId,
  StakeholderId,
  StakeholderSignalId,
} from "../../shared-kernel/ids";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { SimulationActionType } from "../commands/envelope";
import type { ActivitySourceKind } from "../run/activity";
import type { NotificationSourceKind } from "../run/notification";
import type {
  ConsequenceTarget,
  ConsequenceTiming,
  ProjectStateStatus,
  SupportedConsequenceType,
} from "../content/consequence-definition";

/**
 * Domain-event payloads (PS-DOM-013 / PS-ROADMAP-004 / PS-ROADMAP-005).
 */

export interface SimulationActionAcceptedPayload {
  readonly actionType: SimulationActionType;
  readonly commandId: CommandId;
  readonly actionRecordId: ActionRecordId;
  readonly sequenceNumber: number;
}

export interface DecisionSubmittedPayload {
  readonly decisionId: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionId: DecisionOptionId;
  readonly sourceActionId: ActionRecordId;
  readonly submittedBy: ActorId;
  readonly submittedAt: IsoTimestamp;
  readonly contextStateVersion: number;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export interface DecisionResolvedPayload {
  readonly decisionRecordId: DecisionRecordId;
  readonly decisionOutcomeId: DecisionOutcomeId;
  readonly resolverVersion: ResolverVersion;
  readonly qualityClassification: string | null;
  readonly consequenceIds: readonly ConsequenceId[];
  readonly resolvedAt: IsoTimestamp;
}

export interface ConsequenceCreatedPayload {
  readonly consequenceId: ConsequenceId;
  readonly consequenceDefinitionId: ConsequenceDefinitionId;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceType: SupportedConsequenceType;
  readonly timing: ConsequenceTiming;
  readonly target: ConsequenceTarget;
  readonly resolverVersion: ResolverVersion;
}

export interface ConsequenceAppliedPayload {
  readonly consequenceId: ConsequenceId;
  readonly appliedAt: IsoTimestamp;
  readonly resultingStateVersion: number;
  readonly effectSummary: string;
}

export interface ConsequenceScheduledPayload {
  readonly consequenceId: ConsequenceId;
  readonly scheduledEventId: ScheduledEventId;
  readonly delayMs: number;
  readonly dueAt: IsoTimestamp;
  readonly createdAt: IsoTimestamp;
}

export interface ProjectMetricChangedPayload {
  readonly metricKey: MetricKey;
  readonly previousValue: number;
  readonly delta: number;
  readonly nextValue: number;
  readonly reasonCode: string;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceId: ConsequenceId;
}

export interface ProjectStateTransitionedPayload {
  readonly previousStatus: ProjectStateStatus;
  readonly nextStatus: ProjectStateStatus;
  readonly reasonCode: string;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly consequenceId: ConsequenceId;
}

export interface LearningSignalEmittedPayload {
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

export interface StakeholderSignalEmittedPayload {
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

export interface AnalyticsSignalEmittedPayload {
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

/** System-delivered learner message occurrence (no full body in event). */
export interface LearnerMessageDeliveredPayload {
  readonly occurrenceId: LearnerMessageOccurrenceId;
  readonly messageDefinitionId: LearnerMessageDefinitionId;
  readonly definitionVersion: string;
  readonly deliverySequence: number;
  readonly deliveredAt: IsoTimestamp | null;
  /**
   * Origin decision when delivered via consequence application; `null` for
   * content-driven DeliverLearnerMessage initialization.
   */
  readonly originDecisionRecordId: DecisionRecordId | null;
  /**
   * Origin consequence when delivered via consequence application; `null` for
   * content-driven DeliverLearnerMessage initialization.
   */
  readonly consequenceId: ConsequenceId | null;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly causationEventId: EventId | null;
}

/** Meeting occurrence scheduled (learner-safe identity facts; full body in state). */
export interface MeetingScheduledPayload {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly meetingDefinitionVersion: string;
  readonly scheduleSequence: number;
  readonly scheduledFor: IsoTimestamp;
  readonly status: "scheduled";
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export interface MeetingMadeAvailablePayload {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly scheduleSequence: number;
  readonly status: "available";
  readonly availableAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

export interface MeetingStartedPayload {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly scheduleSequence: number;
  readonly status: "started";
  readonly startedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

export interface MeetingCompletedPayload {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly scheduleSequence: number;
  readonly status: "completed";
  readonly completedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

export interface MeetingCancelledPayload {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly scheduleSequence: number;
  readonly status: "cancelled";
  readonly cancelledAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

/** Runtime Stakeholder initialized (learner-safe identity facts; profile in state). */
export interface StakeholderInitializedPayload {
  readonly stakeholderId: StakeholderId;
  readonly stakeholderDefinitionId: StakeholderId;
  readonly stakeholderDefinitionVersion: string;
  readonly initializationSequence: number;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

/** One conversation per Stakeholder opened on first learner message (PS-018). */
export interface StakeholderConversationOpenedPayload {
  readonly conversationId: ConversationId;
  readonly stakeholderId: StakeholderId;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

/** Learner-to-Stakeholder message recorded (body remains in authoritative state). */
export interface StakeholderMessageSentPayload {
  readonly messageId: MessageId;
  readonly conversationId: ConversationId;
  readonly stakeholderId: StakeholderId;
  readonly conversationSequence: number;
  readonly direction: "learner_to_stakeholder";
  readonly authorActorId: ActorId;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

/** Runtime Document initialized (learner-safe content remains in authoritative state). */
export interface DocumentInitializedPayload {
  readonly documentId: DocumentId;
  readonly documentDefinitionId: DocumentId;
  readonly documentDefinitionVersion: string;
  readonly creationSequence: number;
  readonly status: "available";
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

/** Runtime Notification initialized (learner-safe content remains in authoritative state). */
export interface NotificationInitializedPayload {
  readonly notificationId: NotificationId;
  readonly creationSequence: number;
  readonly status: "active";
  readonly sourceKind: NotificationSourceKind;
  readonly sourceId: string | null;
  readonly sourceReason: string | null;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

/** Runtime Activity initialized (learner-safe content remains in authoritative state). */
export interface ActivityInitializedPayload {
  readonly activityId: ActivityId;
  readonly creationSequence: number;
  readonly status: "active";
  readonly sourceKind: ActivitySourceKind;
  readonly sourceId: string | null;
  readonly sourceReason: string | null;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

/** Runtime Activity completed (completion metadata remains in authoritative state). */
export interface ActivityCompletedPayload {
  readonly activityId: ActivityId;
  readonly completionSequence: number;
  readonly status: "completed";
  readonly completedAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
  readonly contentPackageVersionId: ContentPackageVersionId;
}
