import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { ExperienceLevel } from "../simulation/content/business-case/enums";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import { evaluateAchievements } from "../learning/achievements";
import type { LearningSafeContent } from "../learning/content";
import { evaluateXpAwards } from "../learning/xp";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION,
  ACHIEVEMENTS_PROJECTION_TYPE,
  type AchievementsProjection,
} from "./achievements-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildAchievementsProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly learningContent: LearningSafeContent;
  readonly experienceLevel: ExperienceLevel | null;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

/**
 * Pure Achievements projection builder (BC-006 Workstream 6).
 */
export const buildAchievementsProjection = (
  input: BuildAchievementsProjectionInput,
): Result<AchievementsProjection, RuleViolationError> => {
  const { snapshot, learningContent, experienceLevel, generatedAt } = input;

  if (
    learningContent.contentPackageVersionId !== snapshot.contentPackageVersionId
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_CONTENT_VERSION_MISMATCH",
        "Learning content version does not match the run contentPackageVersionId.",
      ),
    );
  }

  const awards = evaluateAchievements({
    snapshot,
    learningContent,
    experienceLevel,
  });
  const xpEvaluation = evaluateXpAwards({
    snapshot,
    learningContent,
    experienceLevel,
  });

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: ACHIEVEMENTS_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: ACHIEVEMENTS_PROJECTION_TYPE,
    projectionSchemaVersion: ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    awards,
    xpSummary: {
      availability: xpEvaluation.availability,
      reason: xpEvaluation.reason,
      totalXp: xpEvaluation.totalXp,
    },
  };

  return ok({
    ...withoutHash,
    semanticHash: computeAchievementsSemanticHash(withoutHash),
  });
};

export type SemanticAchievementsInput = Omit<
  AchievementsProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticAchievementsPayload = (
  projection: SemanticAchievementsInput,
): Readonly<Record<string, unknown>> => ({
  projectionId: projection.projectionId,
  projectionType: projection.projectionType,
  projectionSchemaVersion: projection.projectionSchemaVersion,
  tenantId: projection.tenantId,
  simulationRunId: projection.simulationRunId,
  learnerId: projection.learnerId,
  contentPackageVersionId: projection.contentPackageVersionId,
  sourceAggregateVersion: projection.sourceAggregateVersion,
  sourceStateVersion: projection.sourceStateVersion,
  sourceActionSequence: projection.sourceActionSequence,
  awards: projection.awards,
  xpSummary: projection.xpSummary,
});

export const computeAchievementsSemanticHash = (
  projection: SemanticAchievementsInput,
) =>
  computeSemanticHashFromStableValue(semanticAchievementsPayload(projection));
