import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { DecisionDefinition } from "../simulation/content/decision-definition";
import {
  buildDecisionEligibilityContextFromParts,
  isDecisionDefinitionAvailable,
} from "../simulation/run/decision-eligibility";
import type { ProjectionSafeContent } from "./content";
import {
  SIMULATION_PROJECTION_SCHEMA_VERSION,
  SIMULATION_PROJECTION_TYPE,
  type DecisionHistoryProjection,
  type SimulationProjection,
} from "./contracts";
import { computeProjectionSemanticHash } from "./hash";
import { deriveSimulationProjectionId } from "./ids";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface ProjectionSourceEvent {
  readonly eventId: EventId;
  readonly eventType: string;
}

export interface BuildSimulationProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  /** Full definitions for eligibility parity only — outcomes never projected. */
  readonly eligibilityDefinitions: readonly DecisionDefinition[];
  readonly projectionContent: ProjectionSafeContent;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: ProjectionSourceEvent;
}

/**
 * Pure canonical projection builder.
 * No I/O, clock, AI, or aggregate mutation.
 *
 * Visibility: schedules, signals, consequence payloads, resolver internals,
 * and hidden outcomes are omitted by construction.
 */
export const buildSimulationProjection = (
  input: BuildSimulationProjectionInput,
): Result<SimulationProjection, RuleViolationError> => {
  const { snapshot, projectionContent, generatedAt } = input;

  if (
    projectionContent.contentPackageVersionId !==
    snapshot.contentPackageVersionId
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_CONTENT_VERSION_MISMATCH",
        "Projection content version does not match the run contentPackageVersionId.",
      ),
    );
  }

  const eligibilityById = new Map(
    input.eligibilityDefinitions.map((definition) => [
      definition.id,
      definition,
    ]),
  );

  for (const safe of projectionContent.decisions) {
    if (safe.contentPackageVersionId !== snapshot.contentPackageVersionId) {
      return err(
        ruleViolationError(
          "PROJECTION_CONTENT_VERSION_MISMATCH",
          `Projection-safe decision '${safe.id}' has mismatched content version.`,
        ),
      );
    }
  }

  const metrics = Object.values(snapshot.projectMetrics)
    .map((metric) => ({
      metricKey: metric.key,
      value: metric.value,
      unit: metric.unit,
    }))
    .sort((a, b) => a.metricKey.localeCompare(b.metricKey));

  const availableDecisions = [...projectionContent.decisions]
    .sort((a, b) =>
      a.authoredOrder !== b.authoredOrder
        ? a.authoredOrder - b.authoredOrder
        : a.id.localeCompare(b.id),
    )
    .flatMap((safe) => {
      const full = eligibilityById.get(safe.id);
      if (!full) {
        return [];
      }
      const eligibility = isDecisionDefinitionAvailable(
        buildDecisionEligibilityContextFromParts({
          runStatus: snapshot.status,
          contentPackageVersionId: snapshot.contentPackageVersionId,
          currentChapterId: snapshot.currentChapterId,
          decisions: snapshot.decisions,
          documents: snapshot.documents,
          meetings: snapshot.meetings,
          learnerMessages: snapshot.learnerMessages,
          activities: snapshot.activities,
          projectMetrics: snapshot.projectMetrics,
        }),
        full,
        generatedAt,
      );
      if (!eligibility.ok) {
        return [];
      }
      return [
        {
          decisionDefinitionId: safe.id,
          title: safe.title,
          prompt: safe.prompt,
          description: safe.description,
          status: "available" as const,
          expiresAt: safe.expiresAt,
          authoredOrder: safe.authoredOrder,
          options: [...safe.options]
            .sort((left, right) =>
              left.authoredOrder !== right.authoredOrder
                ? left.authoredOrder - right.authoredOrder
                : left.id.localeCompare(right.id),
            )
            .map((option) => ({
              optionId: option.id,
              label: option.label,
              authoredOrder: option.authoredOrder,
            })),
        },
      ];
    });

  const safeByDecisionId = new Map(
    projectionContent.decisions.map((entry) => [entry.id, entry]),
  );
  const outcomeById = new Map(
    snapshot.decisionOutcomes.map((outcome) => [outcome.id, outcome]),
  );

  const decisionHistory: DecisionHistoryProjection[] = [];
  const sortedDecisions = [...snapshot.decisions].sort((a, b) => {
    if (a.submittedAt !== b.submittedAt) {
      return a.submittedAt < b.submittedAt ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  for (const decision of sortedDecisions) {
    const safe = safeByDecisionId.get(decision.decisionDefinitionId);
    const optionLabel =
      safe?.options.find((option) => option.id === decision.selectedOptionId)
        ?.label ?? null;
    const outcome =
      decision.outcomeId === null
        ? null
        : (outcomeById.get(decision.outcomeId) ?? null);
    if (decision.status === "resolved" && decision.outcomeId && !outcome) {
      return err(
        ruleViolationError(
          "PROJECTION_REFERENCE_INVALID",
          `Resolved Decision '${decision.id}' references missing Outcome.`,
        ),
      );
    }
    decisionHistory.push({
      decisionRecordId: decision.id,
      decisionDefinitionId: decision.decisionDefinitionId,
      selectedOptionId: decision.selectedOptionId,
      selectedOptionLabel: optionLabel,
      submittedAt: decision.submittedAt,
      resolvedAt: decision.resolvedAt,
      status: decision.status,
      decisionOutcomeId: decision.outcomeId,
      qualityClassification: outcome?.qualityClassification ?? null,
      publicResultSummary:
        safe?.publicResultSummaryByOptionId[decision.selectedOptionId] ?? null,
      sourceActionSequence: null,
    });
  }

  const withoutHash = {
    projectionId: deriveSimulationProjectionId({
      tenantId: snapshot.tenantId,
      simulationRunId: snapshot.simulationRunId,
    }),
    projectionType: SIMULATION_PROJECTION_TYPE,
    projectionSchemaVersion: SIMULATION_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    run: {
      simulationRunId: snapshot.simulationRunId,
      status: snapshot.status,
      startedAt: snapshot.startedAt,
      pausedAt: snapshot.pausedAt,
      completedAt: snapshot.completedAt,
      archivedAt: snapshot.archivedAt,
      currentChapterId: snapshot.currentChapterId,
      currentDayId: snapshot.currentDayId,
      contentPackageVersionId: snapshot.contentPackageVersionId,
      sourceStateVersion: snapshot.stateVersion,
    },
    project: {
      status: snapshot.projectState.status,
      metrics,
      sourceStateVersion: snapshot.stateVersion,
    },
    availableDecisions,
    decisionHistory,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeProjectionSemanticHash(withoutHash),
  });
};
