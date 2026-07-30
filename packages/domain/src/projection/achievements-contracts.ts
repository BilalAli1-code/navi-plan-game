import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { AchievementAward } from "../learning/achievements";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { LearningProjectionXpSummary } from "./learning-projection-shared";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Achievements projection (BC-006 Workstream 6).
 *
 * Derived, read-only, rebuildable. Awards from authored conditions only.
 */

export const ACHIEVEMENTS_PROJECTION_TYPE =
  "achievements" as const satisfies WorkplaceProjectionType;
export const ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION = 1 as const;

export interface AchievementsProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof ACHIEVEMENTS_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION;

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

  readonly awards: readonly AchievementAward[];
  readonly xpSummary: LearningProjectionXpSummary;
}
