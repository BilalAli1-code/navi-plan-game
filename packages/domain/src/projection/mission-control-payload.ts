import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  DecisionId,
  DecisionRecordId,
  EventId,
  LearnerId,
  MetricKey,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import { isProjectStateStatus } from "../simulation/content/consequence-definition";
import { isSimulationRunStatus } from "../simulation/run/status";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import {
  MISSION_CONTROL_PROJECTION_SCHEMA_VERSION,
  MISSION_CONTROL_PROJECTION_TYPE,
  type MissionControlChannelCount,
  type MissionControlProjection,
  type MissionControlRecommendedAction,
  type MissionControlRecentRevealedOutcome,
} from "./mission-control-contracts";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseChannelCount = (
  value: unknown,
  fieldName: string,
): Result<MissionControlChannelCount, RuleViolationError> => {
  if (!isPlainObject(value) || typeof value.availability !== "string") {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        `Mission Control ${fieldName} is invalid.`,
      ),
    );
  }
  if (value.availability === "unavailable") {
    if (value.reason !== "channel_not_implemented") {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Mission Control ${fieldName} unavailable reason is invalid.`,
        ),
      );
    }
    return ok({
      availability: "unavailable",
      reason: "channel_not_implemented",
    });
  }
  if (value.availability === "available") {
    if (
      typeof value.count !== "number" ||
      !Number.isInteger(value.count) ||
      value.count < 0
    ) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Mission Control ${fieldName} count is invalid.`,
        ),
      );
    }
    return ok({
      availability: "available",
      count: value.count,
    });
  }
  return err(
    ruleViolationError(
      "PROJECTION_PAYLOAD_INVALID",
      `Mission Control ${fieldName} availability is invalid.`,
    ),
  );
};

const parseRecommendedAction = (
  value: unknown,
): Result<MissionControlRecommendedAction, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.actionId !== "string" ||
    typeof value.label !== "string" ||
    value.targetKind !== "decision" ||
    typeof value.targetId !== "string" ||
    typeof value.authoredOrder !== "number"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mission Control recommended action is invalid.",
      ),
    );
  }
  return ok({
    actionId: value.actionId,
    label: value.label,
    targetKind: "decision",
    targetId: value.targetId as DecisionId,
    authoredOrder: value.authoredOrder,
  });
};

const parseRecentOutcome = (
  value: unknown,
): Result<MissionControlRecentRevealedOutcome | null, RuleViolationError> => {
  if (value === null) {
    return ok(null);
  }
  if (
    !isPlainObject(value) ||
    typeof value.decisionRecordId !== "string" ||
    typeof value.decisionDefinitionId !== "string" ||
    typeof value.publicResultSummary !== "string" ||
    typeof value.resolvedAt !== "string"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mission Control recentRevealedOutcome is invalid.",
      ),
    );
  }
  return ok({
    decisionRecordId: value.decisionRecordId as DecisionRecordId,
    decisionDefinitionId: value.decisionDefinitionId as DecisionId,
    selectedOptionLabel:
      value.selectedOptionLabel === undefined ||
      value.selectedOptionLabel === null
        ? null
        : String(value.selectedOptionLabel),
    publicResultSummary: value.publicResultSummary,
    resolvedAt: value.resolvedAt as IsoTimestamp,
  });
};

/**
 * Validate persisted Mission Control JSON before returning it as a typed contract.
 */
export const parseMissionControlProjection = (
  value: unknown,
): Result<MissionControlProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== MISSION_CONTROL_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (
    value.projectionSchemaVersion !== MISSION_CONTROL_PROJECTION_SCHEMA_VERSION
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Mission Control schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !isPlainObject(value.runSummary) ||
    !isPlainObject(value.projectSummary) ||
    !isPlainObject(value.counts) ||
    !Array.isArray(value.nextRecommendedActions)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mission Control payload fields are incomplete.",
      ),
    );
  }

  const source = assertProjectionSourcePosition({
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
  });
  if (!source.ok) {
    return err(source.error);
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection semanticHash must match fnv1a64:v1:<16-hex>.",
      ),
    );
  }

  if (
    typeof value.runSummary.status !== "string" ||
    !isSimulationRunStatus(value.runSummary.status)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mission Control runSummary.status is invalid.",
      ),
    );
  }
  if (
    typeof value.projectSummary.status !== "string" ||
    !isProjectStateStatus(value.projectSummary.status) ||
    !Array.isArray(value.projectSummary.metrics)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mission Control projectSummary is invalid.",
      ),
    );
  }

  const pendingDecisions = parseChannelCount(
    value.counts.pendingDecisions,
    "counts.pendingDecisions",
  );
  if (!pendingDecisions.ok) {
    return err(pendingDecisions.error);
  }
  if (pendingDecisions.value.availability !== "available") {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mission Control pendingDecisions must be available.",
      ),
    );
  }

  const inbox = parseChannelCount(
    value.counts.unreadActionRequiredInboxItems,
    "counts.unreadActionRequiredInboxItems",
  );
  if (!inbox.ok) {
    return err(inbox.error);
  }
  const meetings = parseChannelCount(
    value.counts.upcomingMeetings,
    "counts.upcomingMeetings",
  );
  if (!meetings.ok) {
    return err(meetings.error);
  }

  const activeActivities = parseChannelCount(
    value.counts.activeActivities,
    "counts.activeActivities",
  );
  if (!activeActivities.ok) {
    return err(activeActivities.error);
  }
  if (activeActivities.value.availability !== "available") {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mission Control activeActivities must be available.",
      ),
    );
  }

  const blockingCrises = parseChannelCount(
    value.counts.blockingCrises,
    "counts.blockingCrises",
  );
  if (!blockingCrises.ok) {
    return err(blockingCrises.error);
  }
  if (blockingCrises.value.availability !== "available") {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Mission Control blockingCrises must be available.",
      ),
    );
  }

  const seenActions = new Set<string>();
  const actions: MissionControlRecommendedAction[] = [];
  for (const entry of value.nextRecommendedActions) {
    const parsed = parseRecommendedAction(entry);
    if (!parsed.ok) {
      return err(parsed.error);
    }
    if (seenActions.has(parsed.value.actionId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Duplicate Mission Control recommended action.",
        ),
      );
    }
    seenActions.add(parsed.value.actionId);
    actions.push(parsed.value);
  }

  const recent = parseRecentOutcome(value.recentRevealedOutcome ?? null);
  if (!recent.ok) {
    return err(recent.error);
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: MISSION_CONTROL_PROJECTION_TYPE,
    projectionSchemaVersion: MISSION_CONTROL_PROJECTION_SCHEMA_VERSION,
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
    runSummary: {
      simulationRunId: value.runSummary.simulationRunId as SimulationRunId,
      status: value.runSummary.status,
      startedAt: (value.runSummary.startedAt ?? null) as IsoTimestamp | null,
      completedAt: (value.runSummary.completedAt ??
        null) as IsoTimestamp | null,
      currentChapterId:
        value.runSummary.currentChapterId === undefined ||
        value.runSummary.currentChapterId === null
          ? null
          : String(value.runSummary.currentChapterId),
      currentDayId:
        value.runSummary.currentDayId === undefined ||
        value.runSummary.currentDayId === null
          ? null
          : String(value.runSummary.currentDayId),
      contentPackageVersionId: value.runSummary
        .contentPackageVersionId as ContentPackageVersionId,
    },
    projectSummary: {
      status: value.projectSummary.status,
      metrics: value.projectSummary.metrics.map((metric) => {
        const record = metric as Record<string, unknown>;
        return {
          metricKey: record.metricKey as MetricKey,
          value: Number(record.value),
          unit:
            record.unit === undefined || record.unit === null
              ? null
              : String(record.unit),
        };
      }),
    },
    counts: {
      pendingDecisions: {
        availability: "available",
        count: pendingDecisions.value.count,
      },
      unreadActionRequiredInboxItems: inbox.value,
      upcomingMeetings: meetings.value,
      activeActivities: {
        availability: "available",
        count: activeActivities.value.count,
      },
      blockingCrises: {
        availability: "available",
        count: blockingCrises.value.count,
      },
    },
    nextRecommendedActions: actions,
    recentRevealedOutcome: recent.value,
  });
};

export const serializeMissionControlProjection = (
  projection: MissionControlProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
