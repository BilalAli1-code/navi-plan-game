import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  MeetingDefinitionId,
  MeetingOccurrenceId,
  SimulationRunId,
  StakeholderId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type {
  MeetingLifecycleStatus,
  MeetingParticipantSnapshot,
} from "../simulation/run/meeting";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Meetings projection (PS-ROADMAP-017).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Authoritative source: SimulationState.meetings (schema v4 / PS-016).
 *
 * Unsupported in v1 UI: start/complete/cancel/reschedule mutation controls.
 */

export const MEETINGS_PROJECTION_TYPE =
  "meetings" as const satisfies WorkplaceProjectionType;
export const MEETINGS_PROJECTION_SCHEMA_VERSION = 1 as const;

export type MeetingsUnsupportedCapability = "unsupported";

export interface MeetingsCapabilities {
  readonly start: MeetingsUnsupportedCapability;
  readonly complete: MeetingsUnsupportedCapability;
  readonly cancel: MeetingsUnsupportedCapability;
  readonly reschedule: MeetingsUnsupportedCapability;
}

export interface MeetingsParticipant {
  readonly stakeholderId: StakeholderId;
  readonly displayName: string;
}

/**
 * One public Meetings item per authoritative MeetingOccurrence.
 *
 * Identity:
 * - `meetingOccurrenceId` = authoritative occurrence ID
 * - `scheduleSequence` = authoritative monotonic sequence (1-based)
 *
 * Presentation order of `meetings` is scheduleSequence ascending (see builder).
 * Frontend must render payload order and must not reorder.
 */
export interface MeetingsItem {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly meetingDefinitionVersion: string;
  readonly scheduleSequence: number;
  readonly scheduledFor: IsoTimestamp;
  readonly durationMinutes: number | null;
  readonly title: string;
  readonly agenda: string | null;
  readonly participants: readonly MeetingsParticipant[];
  readonly channel: string | null;
  readonly location: string | null;
  readonly status: MeetingLifecycleStatus;
  readonly scheduledAt: IsoTimestamp;
  readonly availableAt: IsoTimestamp | null;
  readonly startedAt: IsoTimestamp | null;
  readonly completedAt: IsoTimestamp | null;
  readonly cancelledAt: IsoTimestamp | null;
  /**
   * Canonical Decision definition ids authored on the meeting definition.
   * Empty when projection-safe meeting metadata is unavailable (fail closed).
   * Never invents decision links from titles/agenda text.
   */
  readonly relatedDecisionIds: readonly string[];
}

export interface MeetingsSummary {
  readonly totalMeetings: number;
  readonly upcomingCount: number;
  readonly activeCount: number;
  readonly completedCount: number;
  readonly cancelledCount: number;
  readonly isEmpty: boolean;
}

export interface MeetingsProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof MEETINGS_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof MEETINGS_PROJECTION_SCHEMA_VERSION;

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

  /** Authoritative scheduleSequence ascending. */
  readonly meetings: readonly MeetingsItem[];
  readonly summary: MeetingsSummary;
  readonly capabilities: MeetingsCapabilities;
}

export type { MeetingLifecycleStatus, MeetingParticipantSnapshot };
