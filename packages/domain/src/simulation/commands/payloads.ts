import type {
  ActivityId,
  ArtifactId,
  ChapterId,
  ConversationId,
  DecisionId,
  DecisionOptionId,
  DocumentId,
  LearnerMessageDefinitionId,
  MeetingId,
  NotificationId,
  StakeholderId,
} from "../../shared-kernel/ids";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { ActivitySourceKind } from "../run/activity";
import type { NotificationSourceKind } from "../run/notification";
import type { SimulationCommandType } from "./envelope";

/**
 * Command payloads.
 *
 * These are intentionally generic, content-agnostic structural contracts: they
 * describe the *shape* of a learner intent, not any business-case-specific rule
 * or validation logic.
 */

/** Select an option for a pending decision. */
export interface SubmitDecisionPayload {
  readonly decisionId: DecisionId;
  readonly optionId: DecisionOptionId;
  readonly rationale?: string;
}

/**
 * Initialize a runtime Activity on SimulationRun (PS-ROADMAP-022).
 *
 * Carries learner-safe title/summary/body and immutable provenance. Hidden
 * authoring fields must never appear here.
 */
export interface InitializeActivityPayload {
  readonly activityId: ActivityId;
  readonly title: string;
  readonly summary: string;
  readonly body?: string;
  readonly sourceKind: ActivitySourceKind;
  readonly sourceId?: string;
  readonly sourceReason?: string;
}

/** Mark an activity as completed by the learner. */
export interface CompleteActivityPayload {
  readonly activityId: ActivityId;
  readonly note?: string;
}

/**
 * Initialize a runtime Stakeholder on SimulationRun (PS-ROADMAP-018).
 *
 * Carries the learner-safe profile snapshot pinned at initialization. Hidden
 * authoring fields must never appear here.
 */
export interface InitializeStakeholderPayload {
  readonly stakeholderId: StakeholderId;
  /** Content definition version pin; defaults to `"1"` when omitted. */
  readonly definitionVersion?: string;
  readonly displayName: string;
  readonly roleLabel?: string;
  readonly organization?: string;
  readonly department?: string;
  readonly biography?: string;
}

/**
 * Send a learner-authored message to an initialized Stakeholder (PS-ROADMAP-018).
 *
 * v1: one conversation per Stakeholder (`conversation:{recipientId}`). Omitting
 * `conversationId` opens/uses that default; a provided id must match it.
 * Does not deliver Inbox learner messages and does not generate AI replies.
 */
export interface SendStakeholderMessagePayload {
  readonly recipientId: StakeholderId;
  readonly body: string;
  /**
   * Conversation to append to. Omit to use the deterministic one-per-Stakeholder
   * conversation. When provided, must equal `conversation:{recipientId}`.
   */
  readonly conversationId?: ConversationId;
}

/** Schedule a meeting with one or more stakeholders. */
export interface ScheduleMeetingPayload {
  /**
   * Content meeting definition identity. Occurrence identity is derived as
   * `meeting_occurrence:${meetingId}` (one occurrence per MeetingId per run).
   */
  readonly meetingId: MeetingId;
  readonly title: string;
  readonly scheduledFor: IsoTimestamp;
  readonly participantIds: readonly StakeholderId[];
  readonly agenda?: string;
  /** Content definition version pin; defaults to `"1"` when omitted. */
  readonly definitionVersion?: string;
  /** Optional duration in whole minutes. */
  readonly durationMinutes?: number;
  /** Optional learner-safe channel label (e.g. conference room / video). */
  readonly channel?: string;
  /** Optional learner-safe location label. */
  readonly location?: string;
  /**
   * Optional display names keyed by stakeholderId. Missing entries fall back to
   * the stakeholderId string (learner-safe placeholder until PS-018).
   */
  readonly participantDisplayNames?: Readonly<Record<string, string>>;
}

/** Make a scheduled meeting available (authoritative; not wall-clock derived). */
export interface MakeMeetingAvailablePayload {
  readonly meetingId: MeetingId;
}

/** Start a scheduled or available meeting. */
export interface StartMeetingPayload {
  readonly meetingId: MeetingId;
}

/** Complete a started meeting. */
export interface CompleteMeetingPayload {
  readonly meetingId: MeetingId;
}

/** Cancel a scheduled or available meeting (not after start/complete). */
export interface CancelMeetingPayload {
  readonly meetingId: MeetingId;
}

/**
 * Initialize an authoritative runtime Document on SimulationRun (PS-ROADMAP-020).
 *
 * Learner-safe plain-text snapshot is pinned at command time. Content must
 * originate from trusted server-side flows (not a public mutation API).
 */
export interface InitializeDocumentPayload {
  readonly documentId: DocumentId;
  /** Content definition version pin; defaults to `"1"` when omitted. */
  readonly definitionVersion?: string;
  readonly title: string;
  readonly body: string;
  readonly category?: string;
  readonly description?: string;
}

/**
 * Initialize a runtime Notification on SimulationRun (PS-ROADMAP-021).
 *
 * Carries learner-safe title/summary/body and immutable provenance. Hidden
 * authoring fields, severity, and delivery metadata must never appear here.
 */
export interface InitializeNotificationPayload {
  readonly notificationId: NotificationId;
  readonly title: string;
  readonly summary: string;
  readonly body?: string;
  readonly sourceKind: NotificationSourceKind;
  readonly sourceId?: string;
  readonly sourceReason?: string;
}

/**
 * Deliver a system learner-message occurrence (content-driven inbox init).
 *
 * Trusted/internal command for chapter initialization. Occurrence identity is
 * stable per messageDefinitionId (`learner_message:init:{messageDefinitionId}`).
 */
export interface DeliverLearnerMessagePayload {
  readonly messageDefinitionId: LearnerMessageDefinitionId;
  /** Content definition version pin; defaults to `"1"` when omitted. */
  readonly definitionVersion?: string;
  readonly senderId?: string | null;
  readonly senderDisplayName: string;
  readonly senderRoleLabel?: string | null;
  readonly subject: string;
  readonly body: string;
}

/** Optional ending notification emitted when a chapter is completed. */
export interface CompleteChapterEndingNotification {
  readonly notificationId: NotificationId;
  readonly title: string;
  readonly summary: string;
  readonly body?: string;
}

/**
 * Complete a chapter when required decisions/activities/meetings are done.
 *
 * Trusted/internal command. Idempotent for the same chapterId once completed.
 */
export interface CompleteChapterPayload {
  readonly chapterId: ChapterId;
  readonly nextChapterId?: ChapterId | null;
  readonly requiredDecisionIds: readonly DecisionId[];
  readonly requiredActivityIds: readonly ActivityId[];
  readonly requiredMeetingIds: readonly MeetingId[];
  readonly endingNotification?: CompleteChapterEndingNotification | null;
  /**
   * Optional pinned-package crisis definitions for W4 engine evaluation.
   * Trusted/internal; not a learner-facing API surface.
   */
  readonly crises?: readonly import("../content/business-case/entities").CrisisDefinition[];
  /** Optional authored completionWhen condition from the pinned chapter. */
  readonly completionWhen?:
    import("../content/business-case/conditions").ConditionExpression | null;
}

/** Upload an artifact (document/deliverable), optionally tied to an activity. */
export interface UploadArtifactPayload {
  readonly artifactId: ArtifactId;
  readonly fileName: string;
  readonly contentType: string;
  readonly byteSize: number;
  readonly relatedActivityId?: ActivityId;
}

/** Maps each command type to its payload, enabling exhaustive lookups. */
export interface SimulationCommandPayloadMap {
  readonly SubmitDecision: SubmitDecisionPayload;
  readonly InitializeActivity: InitializeActivityPayload;
  readonly CompleteActivity: CompleteActivityPayload;
  readonly InitializeStakeholder: InitializeStakeholderPayload;
  readonly SendStakeholderMessage: SendStakeholderMessagePayload;
  readonly ScheduleMeeting: ScheduleMeetingPayload;
  readonly MakeMeetingAvailable: MakeMeetingAvailablePayload;
  readonly StartMeeting: StartMeetingPayload;
  readonly CompleteMeeting: CompleteMeetingPayload;
  readonly CancelMeeting: CancelMeetingPayload;
  readonly InitializeDocument: InitializeDocumentPayload;
  readonly InitializeNotification: InitializeNotificationPayload;
  readonly DeliverLearnerMessage: DeliverLearnerMessagePayload;
  readonly CompleteChapter: CompleteChapterPayload;
  readonly UploadArtifact: UploadArtifactPayload;
}

/** Compile-time guarantee that the payload map covers every command type. */
type PayloadMapCoversAllCommands =
  SimulationCommandType extends keyof SimulationCommandPayloadMap
    ? true
    : never;
export const PAYLOAD_MAP_IS_EXHAUSTIVE: PayloadMapCoversAllCommands = true;
