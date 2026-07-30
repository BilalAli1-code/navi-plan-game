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
import type { CoachingInterventionType } from "../simulation/content/business-case/canonical-contracts";
import type { CoachingTimingHint } from "../learning/coaching";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import {
  COACHING_PROJECTION_SCHEMA_VERSION,
  COACHING_PROJECTION_TYPE,
  type CoachingProjection,
  type CoachingProjectionIntervention,
} from "./coaching-contracts";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const interventionTypes: readonly CoachingInterventionType[] = [
  "orientation",
  "hint",
  "reflection_prompt",
  "remediation",
  "debrief",
];

const timingHints: readonly CoachingTimingHint[] = [
  "at_chapter_start",
  "before_decision",
  "after_decision",
  "when_struggling",
  "at_chapter_end",
];

const parseStringArray = (
  value: unknown,
  field: string,
): Result<readonly string[], RuleViolationError> => {
  if (!Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        `Coaching ${field} must be an array.`,
      ),
    );
  }
  const items: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string" || raw.trim().length === 0) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Coaching ${field} must contain non-empty strings.`,
        ),
      );
    }
    items.push(raw);
  }
  return ok(items);
};

const parseIntervention = (
  value: unknown,
): Result<CoachingProjectionIntervention, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.id !== "string" ||
    value.id.trim().length === 0 ||
    typeof value.interventionType !== "string" ||
    !interventionTypes.includes(
      value.interventionType as CoachingInterventionType,
    ) ||
    typeof value.title !== "string" ||
    typeof value.guidance !== "string" ||
    typeof value.timingHint !== "string" ||
    !timingHints.includes(value.timingHint as CoachingTimingHint) ||
    typeof value.fallbackText !== "string" ||
    value.fallbackText.trim().length === 0
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Coaching intervention is invalid.",
      ),
    );
  }
  const relatedDecisionIds = parseStringArray(
    value.relatedDecisionIds,
    "relatedDecisionIds",
  );
  if (!relatedDecisionIds.ok) {
    return relatedDecisionIds;
  }
  const relatedActivityIds = parseStringArray(
    value.relatedActivityIds,
    "relatedActivityIds",
  );
  if (!relatedActivityIds.ok) {
    return relatedActivityIds;
  }
  return ok({
    id: value.id,
    interventionType: value.interventionType as CoachingInterventionType,
    chapterId:
      value.chapterId === null || value.chapterId === undefined
        ? null
        : String(value.chapterId),
    title: value.title,
    guidance: value.guidance,
    relatedDecisionIds: relatedDecisionIds.value,
    relatedActivityIds: relatedActivityIds.value,
    timingHint: value.timingHint as CoachingTimingHint,
    fallbackText: value.fallbackText,
  });
};

export const parseCoachingProjection = (
  value: unknown,
): Result<CoachingProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== COACHING_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (value.projectionSchemaVersion !== COACHING_PROJECTION_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Coaching schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !Array.isArray(value.interventions)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Coaching payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Coaching semanticHash is invalid.",
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

  const interventions: CoachingProjectionIntervention[] = [];
  for (const raw of value.interventions) {
    const parsed = parseIntervention(raw);
    if (!parsed.ok) {
      return parsed;
    }
    interventions.push(parsed.value);
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: COACHING_PROJECTION_TYPE,
    projectionSchemaVersion: COACHING_PROJECTION_SCHEMA_VERSION,
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
    interventions,
  });
};

export const serializeCoachingProjection = (
  projection: CoachingProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
