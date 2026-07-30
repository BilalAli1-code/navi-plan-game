import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { ExperienceLevel } from "../simulation/content/business-case/enums";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import {
  buildDeterministicCoachingFallback,
  selectCoachingInterventions,
} from "../learning/coaching";
import type { LearningSafeContent } from "../learning/content";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  COACHING_PROJECTION_SCHEMA_VERSION,
  COACHING_PROJECTION_TYPE,
  type CoachingProjection,
  type CoachingProjectionIntervention,
} from "./coaching-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildCoachingProjectionInput {
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
 * Pure Coaching projection builder (BC-006 Workstream 6).
 */
export const buildCoachingProjection = (
  input: BuildCoachingProjectionInput,
): Result<CoachingProjection, RuleViolationError> => {
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

  const selected = selectCoachingInterventions({
    snapshot,
    learningContent,
    experienceLevel,
  });
  const interventions: CoachingProjectionIntervention[] = selected.map(
    (instruction) => ({
      ...instruction,
      fallbackText: buildDeterministicCoachingFallback(instruction),
    }),
  );

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: COACHING_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: COACHING_PROJECTION_TYPE,
    projectionSchemaVersion: COACHING_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    interventions,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeCoachingSemanticHash(withoutHash),
  });
};

export type SemanticCoachingInput = Omit<
  CoachingProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticCoachingPayload = (
  projection: SemanticCoachingInput,
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
  interventions: projection.interventions,
});

export const computeCoachingSemanticHash = (
  projection: SemanticCoachingInput,
) => computeSemanticHashFromStableValue(semanticCoachingPayload(projection));
