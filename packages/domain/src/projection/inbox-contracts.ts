import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  LearnerMessageDefinitionId,
  LearnerMessageOccurrenceId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { LearnerMessageSenderSnapshot } from "../simulation/run/learner-message";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { ProjectionSafeInboxClassification } from "./content";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Inbox projection (PS-ROADMAP-014).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Authoritative source: SimulationState.learnerMessages (schema v3).
 *
 * Unsupported in v1: read, archive, reply, compose, forward, delete.
 */

export const INBOX_PROJECTION_TYPE =
  "inbox" as const satisfies WorkplaceProjectionType;
export const INBOX_PROJECTION_SCHEMA_VERSION = 1 as const;

/** Explicit capability markers — do not invent unread/archive/reply state. */
export type InboxUnsupportedCapability = "unsupported";

export interface InboxCapabilities {
  readonly readState: InboxUnsupportedCapability;
  readonly archive: InboxUnsupportedCapability;
  readonly reply: InboxUnsupportedCapability;
  readonly compose: InboxUnsupportedCapability;
}

export interface InboxMessageSender {
  readonly senderId: string | null;
  readonly displayName: string;
  readonly roleLabel: string | null;
}

/**
 * One public Inbox message per authoritative learner-message occurrence.
 *
 * Identity:
 * - `messageId` = authoritative `LearnerMessageOccurrenceId`
 * - `sequence` = authoritative `deliverySequence` (1-based)
 *
 * Presentation order of `messages` is newest-first (see builder). Frontend
 * must render payload order and must not reorder.
 */
export interface InboxMessage {
  readonly messageId: LearnerMessageOccurrenceId;
  readonly definitionId: LearnerMessageDefinitionId;
  readonly definitionVersion: string;
  readonly sequence: number;
  readonly deliveredAt: IsoTimestamp | null;
  readonly sender: InboxMessageSender;
  readonly subject: string;
  /** Deterministic truncation of learner-safe body; never from hidden content. */
  readonly preview: string;
  readonly body: string;
  readonly classification: ProjectionSafeInboxClassification;
  readonly relatedDecisionId: string | null;
  readonly relatedMeetingId: string | null;
  readonly relatedDocumentIds: readonly string[];
  readonly linkedDecisionStatus: "none" | "pending" | "submitted" | "resolved";
  readonly actionState: "informational" | "action_required" | "completed";
}

export interface InboxClassificationCounts {
  readonly informational: number;
  readonly action_required: number;
  readonly decision_bearing: number;
}

export interface InboxSummary {
  readonly totalMessages: number;
  readonly isEmpty: boolean;
  readonly classificationCounts: InboxClassificationCounts;
}

export interface InboxProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof INBOX_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof INBOX_PROJECTION_SCHEMA_VERSION;

  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly learnerId: LearnerId;
  readonly contentPackageVersionId: ContentPackageVersionId;

  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  readonly sourceActionSequence: number;
  readonly sourceEventId: EventId | null;

  readonly generatedAt: IsoTimestamp;
  readonly semanticHash: ProjectionHash;

  /** Newest delivered learner-visible message first. */
  readonly messages: readonly InboxMessage[];
  readonly summary: InboxSummary;
  readonly capabilities: InboxCapabilities;
}

/** Re-export sender snapshot shape for builders that map 1:1. */
export type { LearnerMessageSenderSnapshot };
