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
  PERFORMANCE_PROJECTION_SCHEMA_VERSION,
  PERFORMANCE_PROJECTION_TYPE,
  type PerformanceProjection,
  type PerformanceRecentlyResolvedDecision,
} from "./performance-contracts";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseRecentlyResolved = (
  value: unknown,
): Result<PerformanceRecentlyResolvedDecision, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.decisionRecordId !== "string" ||
    typeof value.decisionDefinitionId !== "string" ||
    typeof value.publicResultSummary !== "string" ||
    value.publicResultSummary.trim().length === 0 ||
    typeof value.resolvedAt !== "string" ||
    Number.isNaN(Date.parse(value.resolvedAt))
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance recentlyResolvedDecision is invalid.",
      ),
    );
  }
  for (const forbidden of [
    "outcomeId",
    "facilitatorNotes",
    "score",
    "xp",
    "mastery",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Performance recentlyResolvedDecision must not include hidden field '${forbidden}'.`,
        ),
      );
    }
  }
  return ok({
    decisionRecordId: value.decisionRecordId as DecisionRecordId,
    decisionDefinitionId: value.decisionDefinitionId as DecisionId,
    selectedOptionLabel:
      value.selectedOptionLabel === null ||
      value.selectedOptionLabel === undefined
        ? null
        : String(value.selectedOptionLabel),
    publicResultSummary: value.publicResultSummary,
    resolvedAt: value.resolvedAt as IsoTimestamp,
  });
};

export const parsePerformanceProjection = (
  value: unknown,
): Result<PerformanceProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== PERFORMANCE_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (value.projectionSchemaVersion !== PERFORMANCE_PROJECTION_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Performance schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !isPlainObject(value.decisionCounts) ||
    !isPlainObject(value.activityCounts) ||
    !isPlainObject(value.meetingCounts) ||
    typeof value.documentCount !== "number" ||
    !isPlainObject(value.crisisSummary) ||
    !Array.isArray(value.recentlyResolvedDecisions)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance semanticHash is invalid.",
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

  if (
    typeof value.runSummary.status !== "string" ||
    !isSimulationRunStatus(value.runSummary.status)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance runSummary.status is invalid.",
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
        "Performance projectSummary is invalid.",
      ),
    );
  }

  const decisionCounts = value.decisionCounts;
  if (
    typeof decisionCounts.submitted !== "number" ||
    !Number.isInteger(decisionCounts.submitted) ||
    decisionCounts.submitted < 0 ||
    typeof decisionCounts.resolved !== "number" ||
    !Number.isInteger(decisionCounts.resolved) ||
    decisionCounts.resolved < 0
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance decisionCounts are invalid.",
      ),
    );
  }

  const activityCounts = value.activityCounts;
  if (
    typeof activityCounts.active !== "number" ||
    !Number.isInteger(activityCounts.active) ||
    activityCounts.active < 0 ||
    typeof activityCounts.completed !== "number" ||
    !Number.isInteger(activityCounts.completed) ||
    activityCounts.completed < 0
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance activityCounts are invalid.",
      ),
    );
  }

  const meetingCounts = value.meetingCounts;
  for (const field of [
    "upcoming",
    "active",
    "completed",
    "cancelled",
  ] as const) {
    const count = meetingCounts[field];
    if (
      typeof count !== "number" ||
      !Number.isInteger(count) ||
      (count as number) < 0
    ) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Performance meetingCounts are invalid.",
        ),
      );
    }
  }

  if (!Number.isInteger(value.documentCount) || value.documentCount < 0) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance documentCount is invalid.",
      ),
    );
  }

  const crisisSummary = value.crisisSummary;
  if (
    typeof crisisSummary.activeCount !== "number" ||
    !Number.isInteger(crisisSummary.activeCount) ||
    crisisSummary.activeCount < 0 ||
    typeof crisisSummary.resolvedCount !== "number" ||
    !Number.isInteger(crisisSummary.resolvedCount) ||
    crisisSummary.resolvedCount < 0 ||
    !Array.isArray(crisisSummary.activeCrisisIds)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance crisisSummary is invalid.",
      ),
    );
  }
  const activeCrisisIds: string[] = [];
  for (const raw of crisisSummary.activeCrisisIds) {
    if (typeof raw !== "string" || raw.trim().length === 0) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Performance activeCrisisIds must be non-empty strings.",
        ),
      );
    }
    activeCrisisIds.push(raw);
  }
  if (activeCrisisIds.length !== crisisSummary.activeCount) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance crisisSummary.activeCount must match activeCrisisIds length.",
      ),
    );
  }
  for (let index = 1; index < activeCrisisIds.length; index += 1) {
    if (activeCrisisIds[index]! < activeCrisisIds[index - 1]!) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Performance activeCrisisIds must be sorted ascending.",
        ),
      );
    }
  }

  const recentlyResolvedDecisions: PerformanceRecentlyResolvedDecision[] = [];
  if (value.recentlyResolvedDecisions.length > 5) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Performance recentlyResolvedDecisions must contain at most 5 items.",
      ),
    );
  }
  for (const raw of value.recentlyResolvedDecisions) {
    const parsed = parseRecentlyResolved(raw);
    if (!parsed.ok) {
      return parsed;
    }
    recentlyResolvedDecisions.push(parsed.value);
  }

  for (const forbidden of [
    "xp",
    "mastery",
    "achievements",
    "reflection",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Performance projection must not include hidden field '${forbidden}'.`,
        ),
      );
    }
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: PERFORMANCE_PROJECTION_TYPE,
    projectionSchemaVersion: PERFORMANCE_PROJECTION_SCHEMA_VERSION,
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
    decisionCounts: {
      submitted: decisionCounts.submitted,
      resolved: decisionCounts.resolved,
    },
    activityCounts: {
      active: activityCounts.active,
      completed: activityCounts.completed,
    },
    meetingCounts: {
      upcoming: meetingCounts.upcoming as number,
      active: meetingCounts.active as number,
      completed: meetingCounts.completed as number,
      cancelled: meetingCounts.cancelled as number,
    },
    documentCount: value.documentCount,
    crisisSummary: {
      activeCount: crisisSummary.activeCount,
      resolvedCount: crisisSummary.resolvedCount,
      activeCrisisIds,
    },
    recentlyResolvedDecisions,
  });
};

export const serializePerformanceProjection = (
  projection: PerformanceProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
