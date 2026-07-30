import type {
  ActivityId,
  CommandId,
  ConsequenceDefinitionId,
  ConsequenceId,
  ConversationId,
  DecisionOutcomeId,
  DecisionRecordId,
  DocumentId,
  LearnerMessageDefinitionId,
  LearnerMessageOccurrenceId,
  NotificationId,
  LearningSignalId,
  MeetingId,
  MeetingOccurrenceId,
  MessageId,
  ResolverVersion,
  ScheduledEventId,
  SimulationRunId,
  StakeholderId,
  StakeholderSignalId,
  AnalyticsSignalId,
} from "../../shared-kernel/ids";
import {
  asActivityId,
  asAnalyticsSignalId,
  asConsequenceId,
  asConversationId,
  asDecisionOutcomeId,
  asDocumentId,
  asLearnerMessageOccurrenceId,
  asNotificationId,
  asLearningSignalId,
  asMeetingOccurrenceId,
  asMessageId,
  asScheduledEventId,
  asStakeholderSignalId,
} from "../../shared-kernel/ids";

/**
 * Deterministic exactly-once application identities (PS-ROADMAP-005).
 *
 * Logical key:
 *   simulationRunId + DecisionRecordId + ConsequenceDefinitionId + resolverVersion
 *
 * These are not a substitute for optimistic concurrency / uniqueness checks;
 * they make retries and rehydration produce stable references.
 */

export const buildConsequenceApplicationKey = (input: {
  readonly simulationRunId: SimulationRunId;
  readonly decisionRecordId: DecisionRecordId;
  readonly consequenceDefinitionId: ConsequenceDefinitionId;
  readonly resolverVersion: ResolverVersion;
}): string =>
  [
    input.simulationRunId,
    input.decisionRecordId,
    input.consequenceDefinitionId,
    input.resolverVersion,
  ].join("|");

export const deriveConsequenceId = (input: {
  readonly simulationRunId: SimulationRunId;
  readonly decisionRecordId: DecisionRecordId;
  readonly consequenceDefinitionId: ConsequenceDefinitionId;
  readonly resolverVersion: ResolverVersion;
}): ConsequenceId =>
  asConsequenceId(`consequence:${buildConsequenceApplicationKey(input)}`);

export const deriveDecisionOutcomeId = (input: {
  readonly decisionRecordId: DecisionRecordId;
  readonly resolverVersion: ResolverVersion;
}): DecisionOutcomeId =>
  asDecisionOutcomeId(
    `outcome:${input.decisionRecordId}:${input.resolverVersion}`,
  );

export const deriveScheduledEventId = (
  consequenceId: ConsequenceId,
): ScheduledEventId => asScheduledEventId(`schedule:${consequenceId}`);

export const deriveLearningSignalId = (
  consequenceId: ConsequenceId,
): LearningSignalId => asLearningSignalId(`learning_signal:${consequenceId}`);

export const deriveStakeholderSignalId = (
  consequenceId: ConsequenceId,
): StakeholderSignalId =>
  asStakeholderSignalId(`stakeholder_signal:${consequenceId}`);

export const deriveAnalyticsSignalId = (
  consequenceId: ConsequenceId,
): AnalyticsSignalId =>
  asAnalyticsSignalId(`analytics_signal:${consequenceId}`);

/**
 * Stable learner-message occurrence identity derived from the consequence
 * application identity (exactly-once key → consequenceId).
 */
export const deriveLearnerMessageOccurrenceId = (
  consequenceId: ConsequenceId,
): LearnerMessageOccurrenceId =>
  asLearnerMessageOccurrenceId(`learner_message:${consequenceId}`);

/**
 * Stable learner-message occurrence identity for content-driven
 * DeliverLearnerMessage initialization (one occurrence per definition id).
 */
export const deriveInitLearnerMessageOccurrenceId = (
  messageDefinitionId: LearnerMessageDefinitionId,
): LearnerMessageOccurrenceId =>
  asLearnerMessageOccurrenceId(`learner_message:init:${messageDefinitionId}`);

/**
 * Stable meeting occurrence identity for ScheduleMeeting.
 *
 * One occurrence per MeetingId per SimulationRun. Retries and replays reuse
 * the same identity; distinct MeetingIds produce distinct occurrences.
 */
export const deriveMeetingOccurrenceId = (
  meetingId: MeetingId,
): MeetingOccurrenceId =>
  asMeetingOccurrenceId(`meeting_occurrence:${meetingId}`);

/**
 * Deterministic one-conversation-per-Stakeholder identity (PS-ROADMAP-018).
 *
 * Format: `conversation:{stakeholderId}`
 */
export const deriveStakeholderConversationId = (
  stakeholderId: StakeholderId,
): ConversationId => asConversationId(`conversation:${stakeholderId}`);

/**
 * Deterministic Stakeholder message occurrence identity from a command.
 *
 * Format: `stakeholder_message:{commandId}`
 */
export const deriveStakeholderMessageIdFromCommand = (
  commandId: CommandId,
): MessageId => asMessageId(`stakeholder_message:${commandId}`);

/**
 * Deterministic Stakeholder message occurrence identity from a consequence.
 *
 * Format: `stakeholder_message:consequence:{consequenceId}`
 */
export const deriveStakeholderMessageIdFromConsequence = (
  consequenceId: ConsequenceId,
): MessageId => asMessageId(`stakeholder_message:consequence:${consequenceId}`);

/**
 * Deterministic Document identity from a consequence.
 *
 * Format: `document:consequence:{consequenceId}`
 */
export const deriveDocumentIdFromConsequence = (
  consequenceId: ConsequenceId,
): DocumentId => asDocumentId(`document:consequence:${consequenceId}`);

/**
 * Deterministic Notification identity from a consequence.
 *
 * Format: `notification:consequence:{consequenceId}`
 */
export const deriveNotificationIdFromConsequence = (
  consequenceId: ConsequenceId,
): NotificationId =>
  asNotificationId(`notification:consequence:${consequenceId}`);

/**
 * Deterministic Activity identity from a consequence.
 *
 * Format: `activity:consequence:{consequenceId}`
 */
export const deriveActivityIdFromConsequence = (
  consequenceId: ConsequenceId,
): ActivityId => asActivityId(`activity:consequence:${consequenceId}`);
