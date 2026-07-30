import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { CompetencyEvidenceAggregate } from "../learning/competency-aggregation";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import type { LearningProjectionXpSummary } from "./learning-projection-shared";
import {
  MASTERY_PROJECTION_SCHEMA_VERSION,
  MASTERY_PROJECTION_TYPE,
  type MasteryProjection,
} from "./mastery-contracts";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseXpSummary = (
  value: unknown,
): Result<LearningProjectionXpSummary, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    value.availability !== "unavailable" ||
    value.reason !== "xp_amounts_not_authored" ||
    value.totalXp !== 0
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mastery xpSummary is invalid.",
      ),
    );
  }
  return ok({
    availability: "unavailable",
    reason: "xp_amounts_not_authored",
    totalXp: 0,
  });
};

const parseCompetency = (
  value: unknown,
): Result<CompetencyEvidenceAggregate, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.competencyId !== "string" ||
    value.competencyId.trim().length === 0 ||
    typeof value.title !== "string" ||
    typeof value.evidenceCount !== "number" ||
    !Number.isInteger(value.evidenceCount) ||
    value.evidenceCount < 0 ||
    typeof value.totalDelta !== "number" ||
    !Array.isArray(value.evidenceIds) ||
    value.bandAvailability !== "unavailable" ||
    value.bandUnavailableReason !== "mastery_thresholds_not_authored" ||
    value.band !== null
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mastery competency aggregate is invalid.",
      ),
    );
  }
  const evidenceIds: string[] = [];
  for (const raw of value.evidenceIds) {
    if (typeof raw !== "string" || raw.trim().length === 0) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Mastery evidenceIds must be non-empty strings.",
        ),
      );
    }
    evidenceIds.push(raw);
  }
  return ok({
    competencyId: value.competencyId,
    title: value.title,
    evidenceCount: value.evidenceCount,
    totalDelta: Number(value.totalDelta),
    evidenceIds,
    bandAvailability: "unavailable",
    bandUnavailableReason: "mastery_thresholds_not_authored",
    band: null,
  });
};

export const parseMasteryProjection = (
  value: unknown,
): Result<MasteryProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== MASTERY_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (value.projectionSchemaVersion !== MASTERY_PROJECTION_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Mastery schema version '${String(value.projectionSchemaVersion)}'.`,
      ),
    );
  }
  if (
    typeof value.projectionId !== "string" ||
    typeof value.tenantId !== "string" ||
    typeof value.simulationRunId !== "string" ||
    typeof value.learnerId !== "string" ||
    typeof value.contentPackageVersionId !== "string" ||
    typeof value.sourceAggregateVersion !== "number" ||
    typeof value.sourceStateVersion !== "number" ||
    typeof value.sourceActionSequence !== "number" ||
    typeof value.generatedAt !== "string" ||
    typeof value.semanticHash !== "string" ||
    !Array.isArray(value.competencies) ||
    !isPlainObject(value.xpSummary)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mastery payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mastery semanticHash is invalid.",
      ),
    );
  }

  const position = assertProjectionSourcePosition({
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
  });
  if (!position.ok) {
    return position;
  }

  const xpSummary = parseXpSummary(value.xpSummary);
  if (!xpSummary.ok) {
    return xpSummary;
  }

  const competencies: CompetencyEvidenceAggregate[] = [];
  for (const raw of value.competencies) {
    const parsed = parseCompetency(raw);
    if (!parsed.ok) {
      return parsed;
    }
    competencies.push(parsed.value);
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: MASTERY_PROJECTION_TYPE,
    projectionSchemaVersion: MASTERY_PROJECTION_SCHEMA_VERSION,
    tenantId: value.tenantId as TenantId,
    simulationRunId: value.simulationRunId as SimulationRunId,
    learnerId: value.learnerId as LearnerId,
    contentPackageVersionId:
      value.contentPackageVersionId as ContentPackageVersionId,
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
    sourceEventId:
      value.sourceEventId === null || value.sourceEventId === undefined
        ? null
        : (value.sourceEventId as EventId),
    generatedAt: value.generatedAt as IsoTimestamp,
    semanticHash: asProjectionHash(value.semanticHash),
    competencies,
    xpSummary: xpSummary.value,
  });
};

export const serializeMasteryProjection = (
  projection: MasteryProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
