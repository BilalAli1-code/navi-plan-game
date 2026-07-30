import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Learner Progression projection (BC-006 Workstream 5).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Chapter requirement progress only — no XP, mastery, achievements, or reflection.
 */

export const LEARNER_PROGRESSION_PROJECTION_TYPE =
  "learner_progression" as const satisfies WorkplaceProjectionType;
export const LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION = 1 as const;

export type LearnerProgressionChapterStatus =
  "locked" | "available" | "active" | "blocked" | "completed";

export type LearnerProgressionRequirementKind =
  "decision" | "activity" | "meeting";

export type LearnerProgressionRequirementStatus = "pending" | "completed";

export interface LearnerProgressionRequirement {
  readonly kind: LearnerProgressionRequirementKind;
  readonly targetId: string;
  readonly status: LearnerProgressionRequirementStatus;
}

export type LearnerProgressionBlockerKind =
  "decision" | "activity" | "meeting" | "crisis";

export interface LearnerProgressionBlocker {
  readonly code: string;
  readonly kind: LearnerProgressionBlockerKind;
  readonly targetId: string;
  readonly message: string;
}

export interface LearnerProgressionChapter {
  readonly chapterId: string;
  readonly order: number;
  readonly title: string;
  readonly status: LearnerProgressionChapterStatus;
  readonly requirements: readonly LearnerProgressionRequirement[];
  readonly blockers: readonly LearnerProgressionBlocker[];
}

export interface LearnerProgressionSummary {
  readonly totalChapters: number;
  readonly completedChapterCount: number;
  readonly activeChapterId: string | null;
  readonly blockedChapterCount: number;
  readonly lockedChapterCount: number;
  readonly availableChapterCount: number;
}

export interface LearnerProgressionProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof LEARNER_PROGRESSION_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION;

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

  readonly chapters: readonly LearnerProgressionChapter[];
  readonly summary: LearnerProgressionSummary;
}
