import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { CompetencyEvidenceAggregate } from "../learning/competency-aggregation";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { LearningProjectionXpSummary } from "./learning-projection-shared";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Mastery projection (BC-006 Workstream 6).
 *
 * Derived competency evidence aggregation. Bands unavailable until authored.
 */

export const MASTERY_PROJECTION_TYPE =
  "mastery" as const satisfies WorkplaceProjectionType;
export const MASTERY_PROJECTION_SCHEMA_VERSION = 1 as const;

export interface MasteryProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof MASTERY_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof MASTERY_PROJECTION_SCHEMA_VERSION;

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

  readonly competencies: readonly CompetencyEvidenceAggregate[];
  readonly xpSummary: LearningProjectionXpSummary;
}
