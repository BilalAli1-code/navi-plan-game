import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  DecisionId,
  DecisionOptionId,
  DecisionOutcomeId,
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
import { isDecisionStatus } from "../simulation/run/decision";
import { isSimulationRunStatus } from "../simulation/run/status";
import {
  SIMULATION_PROJECTION_SCHEMA_VERSION,
  SIMULATION_PROJECTION_TYPE,
  type SimulationProjection,
} from "./contracts";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Validate persisted projection JSON before returning it as a typed contract.
 */
export const parseSimulationProjection = (
  value: unknown,
): Result<SimulationProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== SIMULATION_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (value.projectionSchemaVersion !== SIMULATION_PROJECTION_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported projection schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !isPlainObject(value.run) ||
    !isPlainObject(value.project) ||
    !Array.isArray(value.availableDecisions) ||
    !Array.isArray(value.decisionHistory)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload fields are incomplete.",
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
    typeof value.run.status !== "string" ||
    !isSimulationRunStatus(value.run.status)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection run.status is invalid.",
      ),
    );
  }
  if (
    typeof value.project.status !== "string" ||
    !isProjectStateStatus(value.project.status) ||
    !Array.isArray(value.project.metrics)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection project block is invalid.",
      ),
    );
  }

  const seenAvailable = new Set<string>();
  for (const entry of value.availableDecisions) {
    if (
      !isPlainObject(entry) ||
      typeof entry.decisionDefinitionId !== "string"
    ) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Available decision entry is invalid.",
        ),
      );
    }
    if (seenAvailable.has(entry.decisionDefinitionId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Duplicate available decision.",
        ),
      );
    }
    seenAvailable.add(entry.decisionDefinitionId);
  }

  const seenHistory = new Set<string>();
  for (const entry of value.decisionHistory) {
    if (!isPlainObject(entry) || typeof entry.decisionRecordId !== "string") {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Decision history entry is invalid.",
        ),
      );
    }
    if (seenHistory.has(entry.decisionRecordId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Duplicate decision history entry.",
        ),
      );
    }
    if (typeof entry.status !== "string" || !isDecisionStatus(entry.status)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Decision history status is invalid.",
        ),
      );
    }
    seenHistory.add(entry.decisionRecordId);
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: SIMULATION_PROJECTION_TYPE,
    projectionSchemaVersion: SIMULATION_PROJECTION_SCHEMA_VERSION,
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
    run: {
      simulationRunId: value.run.simulationRunId as SimulationRunId,
      status: value.run.status,
      startedAt: (value.run.startedAt ?? null) as IsoTimestamp | null,
      pausedAt: (value.run.pausedAt ?? null) as IsoTimestamp | null,
      completedAt: (value.run.completedAt ?? null) as IsoTimestamp | null,
      archivedAt: (value.run.archivedAt ?? null) as IsoTimestamp | null,
      currentChapterId:
        value.run.currentChapterId === undefined ||
        value.run.currentChapterId === null
          ? null
          : String(value.run.currentChapterId),
      currentDayId:
        value.run.currentDayId === undefined || value.run.currentDayId === null
          ? null
          : String(value.run.currentDayId),
      contentPackageVersionId: value.run
        .contentPackageVersionId as ContentPackageVersionId,
      sourceStateVersion: Number(value.run.sourceStateVersion),
    },
    project: {
      status: value.project.status,
      sourceStateVersion: Number(value.project.sourceStateVersion),
      metrics: value.project.metrics.map((metric) => {
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
    availableDecisions: value.availableDecisions.map((entry) => {
      const record = entry as Record<string, unknown>;
      const options = Array.isArray(record.options) ? record.options : [];
      return {
        decisionDefinitionId: record.decisionDefinitionId as DecisionId,
        title: String(record.title),
        prompt: String(record.prompt),
        description:
          record.description === undefined || record.description === null
            ? null
            : String(record.description),
        status: "available" as const,
        expiresAt: (record.expiresAt ?? null) as IsoTimestamp | null,
        authoredOrder: Number(record.authoredOrder),
        options: options.map((option) => {
          const optionRecord = option as Record<string, unknown>;
          return {
            optionId: optionRecord.optionId as DecisionOptionId,
            label: String(optionRecord.label),
            authoredOrder: Number(optionRecord.authoredOrder),
          };
        }),
      };
    }),
    decisionHistory: value.decisionHistory.map((entry) => {
      const record = entry as Record<string, unknown>;
      return {
        decisionRecordId: record.decisionRecordId as DecisionRecordId,
        decisionDefinitionId: record.decisionDefinitionId as DecisionId,
        selectedOptionId: record.selectedOptionId as DecisionOptionId,
        selectedOptionLabel:
          record.selectedOptionLabel === undefined ||
          record.selectedOptionLabel === null
            ? null
            : String(record.selectedOptionLabel),
        submittedAt: record.submittedAt as IsoTimestamp,
        resolvedAt: (record.resolvedAt ?? null) as IsoTimestamp | null,
        status:
          record.status as SimulationProjection["decisionHistory"][number]["status"],
        decisionOutcomeId:
          record.decisionOutcomeId === undefined ||
          record.decisionOutcomeId === null
            ? null
            : (record.decisionOutcomeId as DecisionOutcomeId),
        qualityClassification:
          record.qualityClassification === undefined
            ? null
            : (record.qualityClassification as string | null),
        publicResultSummary:
          record.publicResultSummary === undefined ||
          record.publicResultSummary === null
            ? null
            : String(record.publicResultSummary),
        sourceActionSequence:
          record.sourceActionSequence === undefined ||
          record.sourceActionSequence === null
            ? null
            : Number(record.sourceActionSequence),
      };
    }),
  });
};

export const serializeSimulationProjection = (
  projection: SimulationProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
