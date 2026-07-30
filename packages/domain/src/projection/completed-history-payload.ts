import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ActivityId,
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import { isActivitySourceKind } from "../simulation/run/activity";
import {
  COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  type CompletedActivitySourceProjection,
  type CompletedHistoryCapabilities,
  type CompletedHistoryItem,
  type CompletedHistoryProjection,
  type CompletedHistorySummary,
} from "./completed-history-contracts";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseCapabilities = (
  value: unknown,
): Result<CompletedHistoryCapabilities, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    value.reopen !== "unsupported" ||
    value.clear !== "unsupported" ||
    value.export !== "unsupported"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Completed History capabilities must mark reopen/clear/export as unsupported.",
      ),
    );
  }
  return ok({
    reopen: "unsupported",
    clear: "unsupported",
    export: "unsupported",
  });
};

const parseSource = (
  value: unknown,
): Result<CompletedActivitySourceProjection, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.kind !== "string" ||
    !isActivitySourceKind(value.kind) ||
    (value.sourceId !== null && typeof value.sourceId !== "string") ||
    (value.reason !== null && typeof value.reason !== "string")
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Completed History activity source is invalid.",
      ),
    );
  }
  return ok({
    kind: value.kind,
    sourceId: value.sourceId as string | null,
    reason: value.reason as string | null,
  });
};

const parseCompletedHistoryItem = (
  value: unknown,
): Result<CompletedHistoryItem, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.activityId !== "string" ||
    value.activityId.trim().length === 0 ||
    typeof value.creationSequence !== "number" ||
    !Number.isInteger(value.creationSequence) ||
    value.creationSequence < 1 ||
    typeof value.completionSequence !== "number" ||
    !Number.isInteger(value.completionSequence) ||
    value.completionSequence < 1 ||
    typeof value.title !== "string" ||
    value.title.trim().length === 0 ||
    typeof value.summary !== "string" ||
    value.summary.trim().length === 0 ||
    (value.body !== null && typeof value.body !== "string") ||
    value.status !== "completed" ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    typeof value.completedAt !== "string" ||
    Number.isNaN(Date.parse(value.completedAt))
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Completed History item is invalid.",
      ),
    );
  }

  for (const forbidden of [
    "originatingCommandId",
    "completingCommandId",
    "causationId",
    "correlationId",
    "aggregateVersion",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Completed History item must not include hidden field '${forbidden}'.`,
        ),
      );
    }
  }

  const source = parseSource(value.source);
  if (!source.ok) {
    return source;
  }

  return ok({
    activityId: value.activityId as ActivityId,
    creationSequence: value.creationSequence,
    completionSequence: value.completionSequence,
    title: value.title,
    summary: value.summary,
    body: value.body as string | null,
    source: source.value,
    status: "completed",
    createdAt: value.createdAt as IsoTimestamp,
    completedAt: value.completedAt as IsoTimestamp,
  });
};

const parseSummary = (
  value: unknown,
  itemsLength: number,
): Result<CompletedHistorySummary, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.totalCompleted !== "number" ||
    !Number.isInteger(value.totalCompleted) ||
    value.totalCompleted < 0 ||
    typeof value.isEmpty !== "boolean"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Completed History summary is invalid.",
      ),
    );
  }
  if (value.totalCompleted !== itemsLength) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Completed History summary.totalCompleted must equal completedItems length.",
      ),
    );
  }
  if (value.isEmpty !== (itemsLength === 0)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Completed History summary.isEmpty must match empty completedItems.",
      ),
    );
  }
  return ok({
    totalCompleted: value.totalCompleted,
    isEmpty: value.isEmpty,
  });
};

/**
 * Validate persisted Completed History JSON before returning it as a typed contract.
 */
export const parseCompletedHistoryProjection = (
  value: unknown,
): Result<CompletedHistoryProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== COMPLETED_HISTORY_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (
    value.projectionSchemaVersion !==
    COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Completed History schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !Array.isArray(value.completedItems)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Completed History payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Completed History semanticHash is invalid.",
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

  const capabilities = parseCapabilities(value.capabilities);
  if (!capabilities.ok) {
    return capabilities;
  }

  const completedItems: CompletedHistoryItem[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.completedItems) {
    const parsed = parseCompletedHistoryItem(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenIds.has(parsed.value.activityId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Completed History items must have unique activityId values.",
        ),
      );
    }
    seenIds.add(parsed.value.activityId);
    completedItems.push(parsed.value);
  }

  for (let index = 1; index < completedItems.length; index += 1) {
    const previous = completedItems[index - 1]!;
    const current = completedItems[index]!;
    if (current.completionSequence > previous.completionSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Completed History items must be ordered descending by completionSequence.",
        ),
      );
    }
  }

  const summary = parseSummary(value.summary, completedItems.length);
  if (!summary.ok) {
    return summary;
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
    projectionSchemaVersion: COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION,
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
    completedItems,
    summary: summary.value,
    capabilities: capabilities.value,
  });
};

export const serializeCompletedHistoryProjection = (
  projection: CompletedHistoryProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
