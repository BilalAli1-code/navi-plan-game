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
import {
  isActivityLifecycleState,
  isActivitySourceKind,
} from "../simulation/run/activity";
import {
  ACTIVITIES_PROJECTION_SCHEMA_VERSION,
  ACTIVITIES_PROJECTION_TYPE,
  type ActivitiesCapabilities,
  type ActivitiesItem,
  type ActivitiesProjection,
  type ActivitiesSummary,
  type ActivitySourceProjection,
} from "./activities-contracts";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseCapabilities = (
  value: unknown,
): Result<ActivitiesCapabilities, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    value.complete !== "unsupported" ||
    value.reopen !== "unsupported" ||
    value.assign !== "unsupported"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Activities capabilities must mark complete/reopen/assign as unsupported.",
      ),
    );
  }
  return ok({
    complete: "unsupported",
    reopen: "unsupported",
    assign: "unsupported",
  });
};

const parseSource = (
  value: unknown,
): Result<ActivitySourceProjection, RuleViolationError> => {
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
        "Activity source is invalid.",
      ),
    );
  }
  return ok({
    kind: value.kind,
    sourceId: value.sourceId as string | null,
    reason: value.reason as string | null,
  });
};

const parseActivityItem = (
  value: unknown,
): Result<ActivitiesItem, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.activityId !== "string" ||
    value.activityId.trim().length === 0 ||
    typeof value.creationSequence !== "number" ||
    !Number.isInteger(value.creationSequence) ||
    value.creationSequence < 1 ||
    typeof value.title !== "string" ||
    value.title.trim().length === 0 ||
    typeof value.summary !== "string" ||
    value.summary.trim().length === 0 ||
    (value.body !== null && typeof value.body !== "string") ||
    typeof value.status !== "string" ||
    !isActivityLifecycleState(value.status) ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Activities item is invalid.",
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
          `Activities item must not include hidden or unsupported field '${forbidden}'.`,
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
    title: value.title,
    summary: value.summary,
    body: value.body as string | null,
    source: source.value,
    status: value.status,
    createdAt: value.createdAt as IsoTimestamp,
  });
};

const parseSummary = (
  value: unknown,
  activitiesLength: number,
): Result<ActivitiesSummary, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.totalActivities !== "number" ||
    !Number.isInteger(value.totalActivities) ||
    value.totalActivities < 0 ||
    typeof value.isEmpty !== "boolean"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Activities summary is invalid.",
      ),
    );
  }
  if (value.totalActivities !== activitiesLength) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Activities summary.totalActivities must equal activities length.",
      ),
    );
  }
  if (value.isEmpty !== (activitiesLength === 0)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Activities summary.isEmpty must match empty activities.",
      ),
    );
  }
  return ok({
    totalActivities: value.totalActivities,
    isEmpty: value.isEmpty,
  });
};

/**
 * Validate persisted Activities JSON before returning it as a typed contract.
 */
export const parseActivitiesProjection = (
  value: unknown,
): Result<ActivitiesProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== ACTIVITIES_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (value.projectionSchemaVersion !== ACTIVITIES_PROJECTION_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Activities schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !Array.isArray(value.activities)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Activities payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Activities semanticHash is invalid.",
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

  const activities: ActivitiesItem[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.activities) {
    const parsed = parseActivityItem(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenIds.has(parsed.value.activityId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Activities items must have unique activityId values.",
        ),
      );
    }
    seenIds.add(parsed.value.activityId);
    activities.push(parsed.value);
  }

  for (let index = 1; index < activities.length; index += 1) {
    const previous = activities[index - 1]!;
    const current = activities[index]!;
    if (current.creationSequence < previous.creationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Activities must be ordered ascending by creationSequence.",
        ),
      );
    }
  }

  const summary = parseSummary(value.summary, activities.length);
  if (!summary.ok) {
    return summary;
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: ACTIVITIES_PROJECTION_TYPE,
    projectionSchemaVersion: ACTIVITIES_PROJECTION_SCHEMA_VERSION,
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
    activities,
    summary: summary.value,
    capabilities: capabilities.value,
  });
};

export const serializeActivitiesProjection = (
  projection: ActivitiesProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
