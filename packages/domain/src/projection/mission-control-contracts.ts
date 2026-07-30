import type {
  ContentPackageVersionId,
  DecisionId,
  DecisionRecordId,
  EventId,
  LearnerId,
  MetricKey,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ProjectStateStatus } from "../simulation/content/consequence-definition";
import type { SimulationRunStatus } from "../simulation/run/status";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Mission Control projection (PS-ROADMAP-011).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Envelope-compatible with ADR-006 / PS-ROADMAP-009 (flat payload blocks).
 *
 * Contract skeleton source: PS-ARCH-016 §8.2.
 */

export const MISSION_CONTROL_PROJECTION_TYPE =
  "mission_control" as const satisfies WorkplaceProjectionType;
export const MISSION_CONTROL_PROJECTION_SCHEMA_VERSION = 1 as const;

/**
 * Explicit channel availability for counts that depend on unimplemented
 * workplace channels. Empty (`available` + 0) is not the same as unavailable.
 */
export type MissionControlChannelCount =
  | {
      readonly availability: "available";
      readonly count: number;
    }
  | {
      readonly availability: "unavailable";
      readonly reason: "channel_not_implemented";
    };

export interface MissionControlRunSummary {
  readonly simulationRunId: SimulationRunId;
  readonly status: SimulationRunStatus;
  readonly startedAt: IsoTimestamp | null;
  readonly completedAt: IsoTimestamp | null;
  readonly currentChapterId: string | null;
  readonly currentDayId: string | null;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export interface MissionControlMetric {
  readonly metricKey: MetricKey;
  readonly value: number;
  readonly unit: string | null;
}

export interface MissionControlProjectSummary {
  readonly status: ProjectStateStatus;
  readonly metrics: readonly MissionControlMetric[];
}

export interface MissionControlCounts {
  /** Always available from authoritative Decision eligibility. */
  readonly pendingDecisions: {
    readonly availability: "available";
    readonly count: number;
  };
  /** Inbox channel remains unavailable while read/action-required is unsupported. */
  readonly unreadActionRequiredInboxItems: MissionControlChannelCount;
  /**
   * Upcoming meetings count from authoritative SimulationState.meetings
   * (PS-ROADMAP-017): statuses `scheduled` and `available`.
   */
  readonly upcomingMeetings: MissionControlChannelCount;
  /** Active activities from authoritative SimulationState.activities. */
  readonly activeActivities: {
    readonly availability: "available";
    readonly count: number;
  };
  /** Triggered crises that block chapter progression. */
  readonly blockingCrises: {
    readonly availability: "available";
    readonly count: number;
  };
}

/**
 * Authoritative recommended action target.
 * Only Decision targets are emitted in v1 — never arbitrary URLs.
 */
export type MissionControlActionTargetKind = "decision";

export interface MissionControlRecommendedAction {
  /** Stable identity derived from authoritative Decision definition id. */
  readonly actionId: string;
  readonly label: string;
  readonly targetKind: MissionControlActionTargetKind;
  readonly targetId: DecisionId;
  readonly authoredOrder: number;
}

/**
 * Most recent learner-visible revealed outcome, or null when none exists.
 * Null means empty (no revealed outcome), not unavailable.
 */
export interface MissionControlRecentRevealedOutcome {
  readonly decisionRecordId: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionLabel: string | null;
  readonly publicResultSummary: string;
  readonly resolvedAt: IsoTimestamp;
}

export interface MissionControlProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof MISSION_CONTROL_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof MISSION_CONTROL_PROJECTION_SCHEMA_VERSION;

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

  readonly runSummary: MissionControlRunSummary;
  readonly projectSummary: MissionControlProjectSummary;
  readonly counts: MissionControlCounts;
  readonly nextRecommendedActions: readonly MissionControlRecommendedAction[];
  readonly recentRevealedOutcome: MissionControlRecentRevealedOutcome | null;
}
