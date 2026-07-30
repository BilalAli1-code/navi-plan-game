import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  AnalyticsSignalId,
  ConsequenceId,
  DecisionOutcomeDefinitionId,
  DecisionOutcomeId,
  DecisionRecordId,
  LearningSignalId,
  ResolverVersion,
  StakeholderSignalId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";

/**
 * Immutable DecisionOutcome (PS-ROADMAP-005).
 *
 * One Decision may have at most one authoritative outcome. Rehydration never
 * recalculates resolution. qualityClassification is nullable until an approved
 * public enum exists.
 */

export interface DecisionOutcome {
  readonly id: DecisionOutcomeId;
  readonly decisionRecordId: DecisionRecordId;
  readonly outcomeDefinitionId: DecisionOutcomeDefinitionId;
  readonly resolverVersion: ResolverVersion;
  readonly resolvedAt: IsoTimestamp;
  readonly qualityClassification: string | null;
  readonly consequenceIds: readonly ConsequenceId[];
  readonly learningSignalIds: readonly LearningSignalId[];
  readonly stakeholderSignalIds: readonly StakeholderSignalId[];
  readonly analyticsSignalIds: readonly AnalyticsSignalId[];
  readonly explanationReference: string | null;
}

export interface CreateDecisionOutcomeInput {
  readonly id: DecisionOutcomeId;
  readonly decisionRecordId: DecisionRecordId;
  readonly outcomeDefinitionId: DecisionOutcomeDefinitionId;
  readonly resolverVersion: ResolverVersion;
  readonly resolvedAt: IsoTimestamp;
  readonly qualityClassification: string | null;
  readonly consequenceIds: readonly ConsequenceId[];
  readonly learningSignalIds: readonly LearningSignalId[];
  readonly stakeholderSignalIds: readonly StakeholderSignalId[];
  readonly analyticsSignalIds: readonly AnalyticsSignalId[];
  readonly explanationReference: string | null;
}

const requireNonEmpty = (
  value: string,
  field: string,
): Result<string, RuleViolationError> => {
  if (value.trim().length === 0) {
    return err(
      ruleViolationError(
        "PERSISTED_OUTCOME_INVALID",
        `DecisionOutcome.${field} must be a non-empty string.`,
        { field },
      ),
    );
  }
  return ok(value);
};

export const createDecisionOutcome = (
  input: CreateDecisionOutcomeInput,
): Result<DecisionOutcome, RuleViolationError> => {
  for (const [field, value] of [
    ["id", input.id],
    ["decisionRecordId", input.decisionRecordId],
    ["outcomeDefinitionId", input.outcomeDefinitionId],
    ["resolverVersion", input.resolverVersion],
  ] as const) {
    const checked = requireNonEmpty(value, field);
    if (!checked.ok) {
      return checked;
    }
  }
  if (input.consequenceIds.length === 0) {
    return err(
      ruleViolationError(
        "DECISION_OUTCOME_DEFINITION_INVALID",
        "DecisionOutcome must reference at least one Consequence.",
      ),
    );
  }
  const unique = new Set(input.consequenceIds);
  if (unique.size !== input.consequenceIds.length) {
    return err(
      ruleViolationError(
        "DECISION_OUTCOME_DEFINITION_INVALID",
        "DecisionOutcome.consequenceIds must be unique.",
      ),
    );
  }
  return ok({
    id: input.id,
    decisionRecordId: input.decisionRecordId,
    outcomeDefinitionId: input.outcomeDefinitionId,
    resolverVersion: input.resolverVersion,
    resolvedAt: input.resolvedAt,
    qualityClassification: input.qualityClassification,
    consequenceIds: [...input.consequenceIds],
    learningSignalIds: [...input.learningSignalIds],
    stakeholderSignalIds: [...input.stakeholderSignalIds],
    analyticsSignalIds: [...input.analyticsSignalIds],
    explanationReference: input.explanationReference,
  });
};

const parseIdArray = (
  value: unknown,
  field: string,
): Result<readonly string[], RuleViolationError> => {
  if (!Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PERSISTED_OUTCOME_INVALID",
        `DecisionOutcome.${field} must be an array.`,
        { field },
      ),
    );
  }
  if (!value.every((entry) => typeof entry === "string" && entry.length > 0)) {
    return err(
      ruleViolationError(
        "PERSISTED_OUTCOME_INVALID",
        `DecisionOutcome.${field} must contain non-empty strings.`,
        { field },
      ),
    );
  }
  return ok(value as readonly string[]);
};

export const rehydrateDecisionOutcome = (
  value: unknown,
): Result<DecisionOutcome, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PERSISTED_OUTCOME_INVALID",
        "Persisted DecisionOutcome must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.decisionRecordId !== "string" ||
    typeof record.outcomeDefinitionId !== "string" ||
    typeof record.resolverVersion !== "string" ||
    typeof record.resolvedAt !== "string"
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_OUTCOME_INVALID",
        "DecisionOutcome identity fields are incomplete.",
      ),
    );
  }
  const consequenceIds = parseIdArray(record.consequenceIds, "consequenceIds");
  if (!consequenceIds.ok) {
    return consequenceIds;
  }
  const learningSignalIds = parseIdArray(
    record.learningSignalIds ?? [],
    "learningSignalIds",
  );
  if (!learningSignalIds.ok) {
    return learningSignalIds;
  }
  const stakeholderSignalIds = parseIdArray(
    record.stakeholderSignalIds ?? [],
    "stakeholderSignalIds",
  );
  if (!stakeholderSignalIds.ok) {
    return stakeholderSignalIds;
  }
  const analyticsSignalIds = parseIdArray(
    record.analyticsSignalIds ?? [],
    "analyticsSignalIds",
  );
  if (!analyticsSignalIds.ok) {
    return analyticsSignalIds;
  }

  const qualityClassification =
    record.qualityClassification === undefined ||
    record.qualityClassification === null
      ? null
      : typeof record.qualityClassification === "string"
        ? record.qualityClassification
        : null;
  if (
    record.qualityClassification !== undefined &&
    record.qualityClassification !== null &&
    typeof record.qualityClassification !== "string"
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_OUTCOME_INVALID",
        "qualityClassification must be a string or null.",
      ),
    );
  }

  const explanationReference =
    record.explanationReference === undefined ||
    record.explanationReference === null
      ? null
      : typeof record.explanationReference === "string"
        ? record.explanationReference
        : null;

  return createDecisionOutcome({
    id: record.id as DecisionOutcomeId,
    decisionRecordId: record.decisionRecordId as DecisionRecordId,
    outcomeDefinitionId:
      record.outcomeDefinitionId as DecisionOutcomeDefinitionId,
    resolverVersion: record.resolverVersion as ResolverVersion,
    resolvedAt: record.resolvedAt as IsoTimestamp,
    qualityClassification,
    consequenceIds: consequenceIds.value as ConsequenceId[],
    learningSignalIds: learningSignalIds.value as LearningSignalId[],
    stakeholderSignalIds: stakeholderSignalIds.value as StakeholderSignalId[],
    analyticsSignalIds: analyticsSignalIds.value as AnalyticsSignalId[],
    explanationReference,
  });
};

export const serializeDecisionOutcome = (
  outcome: DecisionOutcome,
): Readonly<Record<string, unknown>> => ({
  id: outcome.id,
  decisionRecordId: outcome.decisionRecordId,
  outcomeDefinitionId: outcome.outcomeDefinitionId,
  resolverVersion: outcome.resolverVersion,
  resolvedAt: outcome.resolvedAt,
  qualityClassification: outcome.qualityClassification,
  consequenceIds: [...outcome.consequenceIds],
  learningSignalIds: [...outcome.learningSignalIds],
  stakeholderSignalIds: [...outcome.stakeholderSignalIds],
  analyticsSignalIds: [...outcome.analyticsSignalIds],
  explanationReference: outcome.explanationReference,
});
