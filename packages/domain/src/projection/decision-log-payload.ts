import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  DecisionId,
  DecisionOptionId,
  DecisionRecordId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import { isDecisionStatus } from "../simulation/run/decision";
import {
  DECISION_LOG_PROJECTION_SCHEMA_VERSION,
  DECISION_LOG_PROJECTION_TYPE,
  type DecisionLogEntry,
  type DecisionLogProjection,
  type DecisionLogRevealedOutcome,
} from "./decision-log-contracts";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseRevealedOutcome = (
  value: unknown,
): Result<DecisionLogRevealedOutcome | null, RuleViolationError> => {
  if (value === null) {
    return ok(null);
  }
  if (
    !isPlainObject(value) ||
    typeof value.summary !== "string" ||
    value.summary.length === 0
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Decision Log revealedOutcome is invalid.",
      ),
    );
  }
  return ok({ summary: value.summary });
};

const parseEntry = (
  value: unknown,
): Result<DecisionLogEntry, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.entryId !== "string" ||
    typeof value.decisionRecordId !== "string" ||
    typeof value.decisionDefinitionId !== "string" ||
    typeof value.sequence !== "number" ||
    !Number.isInteger(value.sequence) ||
    value.sequence < 1 ||
    typeof value.decidedAt !== "string" ||
    typeof value.title !== "string" ||
    !isPlainObject(value.selectedOption) ||
    typeof value.selectedOption.optionId !== "string" ||
    typeof value.status !== "string" ||
    !isDecisionStatus(value.status)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Decision Log entry is invalid.",
      ),
    );
  }
  if (value.entryId !== value.decisionRecordId) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Decision Log entryId must equal decisionRecordId.",
      ),
    );
  }
  const label =
    value.selectedOption.label === undefined ||
    value.selectedOption.label === null
      ? null
      : String(value.selectedOption.label);
  const revealed = parseRevealedOutcome(value.revealedOutcome);
  if (!revealed.ok) {
    return revealed;
  }
  return ok({
    entryId: value.entryId as DecisionRecordId,
    decisionRecordId: value.decisionRecordId as DecisionRecordId,
    decisionDefinitionId: value.decisionDefinitionId as DecisionId,
    sequence: value.sequence,
    decidedAt: value.decidedAt as IsoTimestamp,
    title: value.title,
    selectedOption: {
      optionId: value.selectedOption.optionId as DecisionOptionId,
      label,
    },
    status: value.status,
    revealedOutcome: revealed.value,
  });
};

/**
 * Validate persisted Decision Log JSON before returning it as a typed contract.
 */
export const parseDecisionLogProjection = (
  value: unknown,
): Result<DecisionLogProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== DECISION_LOG_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (
    value.projectionSchemaVersion !== DECISION_LOG_PROJECTION_SCHEMA_VERSION
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Decision Log schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !Array.isArray(value.entries) ||
    !isPlainObject(value.summary)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Decision Log payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Decision Log semanticHash is invalid.",
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

  const entries: DecisionLogEntry[] = [];
  for (const raw of value.entries) {
    const parsed = parseEntry(raw);
    if (!parsed.ok) {
      return parsed;
    }
    entries.push(parsed.value);
  }

  if (
    typeof value.summary.totalEntries !== "number" ||
    !Number.isInteger(value.summary.totalEntries) ||
    value.summary.totalEntries < 0 ||
    typeof value.summary.isEmpty !== "boolean"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Decision Log summary is invalid.",
      ),
    );
  }
  if (value.summary.totalEntries !== entries.length) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Decision Log summary.totalEntries must equal entries length.",
      ),
    );
  }
  if (value.summary.isEmpty !== (entries.length === 0)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Decision Log summary.isEmpty must match empty entries.",
      ),
    );
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: DECISION_LOG_PROJECTION_TYPE,
    projectionSchemaVersion: DECISION_LOG_PROJECTION_SCHEMA_VERSION,
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
    entries,
    summary: {
      totalEntries: value.summary.totalEntries,
      isEmpty: value.summary.isEmpty,
    },
  });
};

export const serializeDecisionLogProjection = (
  projection: DecisionLogProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
