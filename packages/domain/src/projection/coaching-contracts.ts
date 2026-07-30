import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { CoachingInterventionType } from "../simulation/content/business-case/canonical-contracts";
import type { CoachingTimingHint } from "../learning/coaching";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Coaching projection (BC-006 Workstream 6).
 *
 * Selected interventions with deterministic fallback text only — no AI.
 */

export const COACHING_PROJECTION_TYPE =
  "coaching" as const satisfies WorkplaceProjectionType;
export const COACHING_PROJECTION_SCHEMA_VERSION = 1 as const;

export interface CoachingProjectionIntervention {
  readonly id: string;
  readonly interventionType: CoachingInterventionType;
  readonly chapterId: string | null;
  readonly title: string;
  readonly guidance: string;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedActivityIds: readonly string[];
  readonly timingHint: CoachingTimingHint;
  readonly fallbackText: string;
}

export interface CoachingProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof COACHING_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof COACHING_PROJECTION_SCHEMA_VERSION;

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

  readonly interventions: readonly CoachingProjectionIntervention[];
}
