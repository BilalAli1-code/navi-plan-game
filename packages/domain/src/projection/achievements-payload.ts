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
import { ACHIEVEMENT_AWARD_RULE_VERSION } from "../learning/achievements";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import type { LearningProjectionXpSummary } from "./learning-projection-shared";
import {
  ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION,
  ACHIEVEMENTS_PROJECTION_TYPE,
  type AchievementsProjection,
} from "./achievements-contracts";
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
        "Achievements xpSummary is invalid.",
      ),
    );
  }
  return ok({
    availability: "unavailable",
    reason: "xp_amounts_not_authored",
    totalXp: 0,
  });
};

const parseAward = (
  value: unknown,
): Result<AchievementsProjection["awards"][number], RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.achievementId !== "string" ||
    value.achievementId.trim().length === 0 ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.awardId !== "string" ||
    value.awardId.trim().length === 0 ||
    !Array.isArray(value.qualifyingEvidenceIds) ||
    value.ruleVersion !== ACHIEVEMENT_AWARD_RULE_VERSION
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Achievements award is invalid.",
      ),
    );
  }
  const qualifyingEvidenceIds: string[] = [];
  for (const raw of value.qualifyingEvidenceIds) {
    if (typeof raw !== "string" || raw.trim().length === 0) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Achievements qualifyingEvidenceIds must be non-empty strings.",
        ),
      );
    }
    qualifyingEvidenceIds.push(raw);
  }
  return ok({
    achievementId: value.achievementId,
    title: value.title,
    description: value.description,
    awardId: value.awardId,
    qualifyingEvidenceIds,
    ruleVersion: ACHIEVEMENT_AWARD_RULE_VERSION,
  });
};

export const parseAchievementsProjection = (
  value: unknown,
): Result<AchievementsProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== ACHIEVEMENTS_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (
    value.projectionSchemaVersion !== ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Achievements schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !Array.isArray(value.awards) ||
    !isPlainObject(value.xpSummary)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Achievements payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Achievements semanticHash is invalid.",
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

  const awards: AchievementsProjection["awards"][number][] = [];
  for (const raw of value.awards) {
    const parsed = parseAward(raw);
    if (!parsed.ok) {
      return parsed;
    }
    awards.push(parsed.value);
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: ACHIEVEMENTS_PROJECTION_TYPE,
    projectionSchemaVersion: ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION,
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
    awards,
    xpSummary: xpSummary.value,
  });
};

export const serializeAchievementsProjection = (
  projection: AchievementsProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
