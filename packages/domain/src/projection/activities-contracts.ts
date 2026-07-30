import type {
  ActivityId,
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type {
  ActivityLifecycleState,
  ActivitySourceKind,
} from "../simulation/run/activity";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Activities projection (PS-ROADMAP-022).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Authoritative source: SimulationState.activities filtered to status="active"
 * (schema v8 / PS-022).
 *
 * Distinct from Completed History (completed activities) and Notifications
 * (one-way informational items).
 */

export const ACTIVITIES_PROJECTION_TYPE =
  "activities" as const satisfies WorkplaceProjectionType;
export const ACTIVITIES_PROJECTION_SCHEMA_VERSION = 1 as const;

export type ActivitiesUnsupportedCapability = "unsupported";

export interface ActivitiesCapabilities {
  readonly complete: ActivitiesUnsupportedCapability;
  readonly reopen: ActivitiesUnsupportedCapability;
  readonly assign: ActivitiesUnsupportedCapability;
}

export interface ActivitySourceProjection {
  readonly kind: ActivitySourceKind;
  readonly sourceId: string | null;
  readonly reason: string | null;
}

/**
 * One public Activities item per authoritative active ActivityRuntime.
 *
 * Identity: ActivityId. Ordering: creationSequence ascending (oldest first).
 * Lifecycle v1: active only (completed items appear in Completed History).
 * completingCommandId is not exposed publicly.
 */
export interface ActivitiesItem {
  readonly activityId: ActivityId;
  readonly creationSequence: number;
  readonly title: string;
  readonly summary: string;
  readonly body: string | null;
  readonly source: ActivitySourceProjection;
  readonly status: ActivityLifecycleState;
  readonly createdAt: IsoTimestamp;
}

export interface ActivitiesSummary {
  readonly totalActivities: number;
  readonly isEmpty: boolean;
}

export interface ActivitiesProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof ACTIVITIES_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof ACTIVITIES_PROJECTION_SCHEMA_VERSION;

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

  /** Active activities ordered by creationSequence ascending (oldest first). */
  readonly activities: readonly ActivitiesItem[];
  readonly summary: ActivitiesSummary;
  readonly capabilities: ActivitiesCapabilities;
}

export type { ActivityLifecycleState, ActivitySourceKind };
