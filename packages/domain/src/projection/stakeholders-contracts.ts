import type {
  ContentPackageVersionId,
  ConversationId,
  EventId,
  LearnerId,
  MessageId,
  SimulationRunId,
  StakeholderId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { StakeholderMessageDirection } from "../simulation/run/stakeholder";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Stakeholders projection (PS-ROADMAP-019).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Authoritative source: SimulationState.stakeholders +
 * stakeholderConversations (introduced in schema v5 / PS-018).
 *
 * Unsupported in v1 UI: message composer, mutation controls, AI replies,
 * relationship/trust scores.
 */

export const STAKEHOLDERS_PROJECTION_TYPE =
  "stakeholders" as const satisfies WorkplaceProjectionType;
export const STAKEHOLDERS_PROJECTION_SCHEMA_VERSION = 1 as const;

export type StakeholdersUnsupportedCapability = "unsupported";

export interface StakeholdersCapabilities {
  readonly sendMessage: StakeholdersUnsupportedCapability;
  readonly editProfile: StakeholdersUnsupportedCapability;
}

/** Learner-safe profile snapshot (mirrors authoritative runtime profile). */
export interface StakeholdersLearnerSafeProfile {
  readonly displayName: string;
  readonly roleLabel: string | null;
  readonly organization: string | null;
  readonly department: string | null;
  readonly biography: string | null;
}

/**
 * Stable learner-facing author representation for v1 learner→Stakeholder
 * messages. Raw actor IDs are never exposed.
 */
export interface StakeholdersMessageAuthor {
  readonly kind: "learner";
  readonly label: "You";
}

export interface StakeholdersMessageItem {
  readonly messageId: MessageId;
  readonly conversationSequence: number;
  readonly direction: StakeholderMessageDirection;
  readonly author: StakeholdersMessageAuthor;
  readonly body: string;
  readonly occurredAt: IsoTimestamp;
}

/**
 * One conversation per Stakeholder when opened. Null when no authoritative
 * conversation exists yet (before the first message).
 */
export interface StakeholdersConversationItem {
  readonly conversationId: ConversationId;
  /** Authoritative conversationSequence ascending. */
  readonly messages: readonly StakeholdersMessageItem[];
}

/**
 * One public Stakeholders item per authoritative runtime Stakeholder.
 *
 * Identity: StakeholderId. Ordering: initializationSequence ascending.
 */
export interface StakeholdersItem {
  readonly stakeholderId: StakeholderId;
  readonly stakeholderDefinitionId: StakeholderId;
  readonly stakeholderDefinitionVersion: string;
  readonly initializationSequence: number;
  readonly profile: StakeholdersLearnerSafeProfile;
  readonly conversation: StakeholdersConversationItem | null;
}

export interface StakeholdersSummary {
  readonly totalStakeholders: number;
  readonly stakeholdersWithConversation: number;
  readonly totalMessages: number;
  readonly isEmpty: boolean;
}

export interface StakeholdersProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof STAKEHOLDERS_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof STAKEHOLDERS_PROJECTION_SCHEMA_VERSION;

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

  /** Authoritative initializationSequence ascending. */
  readonly stakeholders: readonly StakeholdersItem[];
  readonly summary: StakeholdersSummary;
  readonly capabilities: StakeholdersCapabilities;
}

export type { StakeholderMessageDirection };
