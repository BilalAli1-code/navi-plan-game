import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { ExperienceLevel } from "../simulation/content/business-case/enums";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { LearningSafeContent } from "../learning/content";
import { extractLearningEvidence } from "../learning/evidence";
import { evaluateMastery } from "../learning/mastery";
import { evaluateXpAwards } from "../learning/xp";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  MASTERY_PROJECTION_SCHEMA_VERSION,
  MASTERY_PROJECTION_TYPE,
  type MasteryProjection,
} from "./mastery-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildMasteryProjectionInput {
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
 * Pure Mastery projection builder (BC-006 Workstream 6).
 */
export const buildMasteryProjection = (
  input: BuildMasteryProjectionInput,
): Result<MasteryProjection, RuleViolationError> => {
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

  const evidence = extractLearningEvidence({
    snapshot,
    learningContent,
    experienceLevel,
  });
  const competencies = evaluateMastery(evidence, learningContent);
  const xpEvaluation = evaluateXpAwards({
    snapshot,
    learningContent,
    experienceLevel,
  });

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: MASTERY_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: MASTERY_PROJECTION_TYPE,
    projectionSchemaVersion: MASTERY_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    competencies,
    xpSummary: {
      availability: xpEvaluation.availability,
      reason: xpEvaluation.reason,
      totalXp: xpEvaluation.totalXp,
    },
  };

  return ok({
    ...withoutHash,
    semanticHash: computeMasterySemanticHash(withoutHash),
  });
};

export type SemanticMasteryInput = Omit<
  MasteryProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticMasteryPayload = (
  projection: SemanticMasteryInput,
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
  competencies: projection.competencies,
  xpSummary: projection.xpSummary,
});

export const computeMasterySemanticHash = (projection: SemanticMasteryInput) =>
  computeSemanticHashFromStableValue(semanticMasteryPayload(projection));
