import type {
  ActivityId,
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ActivitySourceKind } from "../simulation/run/activity";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Completed History projection (PS-ROADMAP-022).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Authoritative source: SimulationState.activities filtered to status="completed"
 * (schema v8 / PS-022).
 *
 * Distinct from Activities (active items) and Notifications (one-way informational items).
 * completingCommandId is authoritative but must NOT appear in public projection items.
 */

export const COMPLETED_HISTORY_PROJECTION_TYPE =
  "completed_history" as const satisfies WorkplaceProjectionType;
export const COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION = 1 as const;

export type CompletedHistoryUnsupportedCapability = "unsupported";

export interface CompletedHistoryCapabilities {
  readonly reopen: CompletedHistoryUnsupportedCapability;
  readonly clear: CompletedHistoryUnsupportedCapability;
  readonly export: CompletedHistoryUnsupportedCapability;
}

export interface CompletedActivitySourceProjection {
  readonly kind: ActivitySourceKind;
  readonly sourceId: string | null;
  readonly reason: string | null;
}

/**
 * One public Completed History item per authoritative completed ActivityRuntime.
 *
 * Identity: ActivityId. Ordering: completionSequence descending (most recently completed first).
 * completingCommandId is not exposed publicly.
 */
export interface CompletedHistoryItem {
  readonly activityId: ActivityId;
  readonly creationSequence: number;
  readonly completionSequence: number;
  readonly title: string;
  readonly summary: string;
  readonly body: string | null;
  readonly source: CompletedActivitySourceProjection;
  readonly status: "completed";
  readonly createdAt: IsoTimestamp;
  readonly completedAt: IsoTimestamp;
}

export interface CompletedHistorySummary {
  readonly totalCompleted: number;
  readonly isEmpty: boolean;
}

export interface CompletedHistoryProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof COMPLETED_HISTORY_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION;

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

  /** Completed activities ordered by completionSequence descending (most recent first). */
  readonly completedItems: readonly CompletedHistoryItem[];
  readonly summary: CompletedHistorySummary;
  readonly capabilities: CompletedHistoryCapabilities;
}

export type { ActivitySourceKind };
