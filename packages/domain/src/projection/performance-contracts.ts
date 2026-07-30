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
 * Canonical learner-facing Performance projection (BC-006 Workstream 5).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Evidence-only summary — no XP, mastery, achievements, or reflection.
 */

export const PERFORMANCE_PROJECTION_TYPE =
  "performance" as const satisfies WorkplaceProjectionType;
export const PERFORMANCE_PROJECTION_SCHEMA_VERSION = 1 as const;

export interface PerformanceRunSummary {
  readonly simulationRunId: SimulationRunId;
  readonly status: SimulationRunStatus;
  readonly startedAt: IsoTimestamp | null;
  readonly completedAt: IsoTimestamp | null;
  readonly currentChapterId: string | null;
  readonly currentDayId: string | null;
  readonly contentPackageVersionId: ContentPackageVersionId;
}

export interface PerformanceMetric {
  readonly metricKey: MetricKey;
  readonly value: number;
  readonly unit: string | null;
}

export interface PerformanceProjectSummary {
  readonly status: ProjectStateStatus;
  readonly metrics: readonly PerformanceMetric[];
}

export interface PerformanceDecisionCounts {
  readonly submitted: number;
  readonly resolved: number;
}

export interface PerformanceActivityCounts {
  readonly active: number;
  readonly completed: number;
}

export interface PerformanceMeetingCounts {
  readonly upcoming: number;
  readonly active: number;
  readonly completed: number;
  readonly cancelled: number;
}

export interface PerformanceCrisisSummary {
  readonly activeCount: number;
  readonly resolvedCount: number;
  /** Triggered crisis ids sorted ascending. */
  readonly activeCrisisIds: readonly string[];
}

export interface PerformanceRecentlyResolvedDecision {
  readonly decisionRecordId: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionLabel: string | null;
  readonly publicResultSummary: string;
  readonly resolvedAt: IsoTimestamp;
}

export interface PerformanceProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof PERFORMANCE_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof PERFORMANCE_PROJECTION_SCHEMA_VERSION;

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

  readonly runSummary: PerformanceRunSummary;
  readonly projectSummary: PerformanceProjectSummary;
  readonly decisionCounts: PerformanceDecisionCounts;
  readonly activityCounts: PerformanceActivityCounts;
  readonly meetingCounts: PerformanceMeetingCounts;
  readonly documentCount: number;
  readonly crisisSummary: PerformanceCrisisSummary;
  /** Newest resolved decisions with revealed public summaries (max 5). */
  readonly recentlyResolvedDecisions: readonly PerformanceRecentlyResolvedDecision[];
}
