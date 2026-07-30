import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { DecisionId, EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ProjectionSafeContent } from "./content";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  PERFORMANCE_PROJECTION_SCHEMA_VERSION,
  PERFORMANCE_PROJECTION_TYPE,
  type PerformanceProjection,
  type PerformanceRecentlyResolvedDecision,
} from "./performance-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildPerformanceProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly projectionContent: ProjectionSafeContent;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const countMeetingStatuses = (
  meetings: SimulationRunReadSnapshot["meetings"],
) => {
  let upcoming = 0;
  let active = 0;
  let completed = 0;
  let cancelled = 0;
  for (const meeting of meetings) {
    if (meeting.status === "scheduled" || meeting.status === "available") {
      upcoming += 1;
    } else if (meeting.status === "started") {
      active += 1;
    } else if (meeting.status === "completed") {
      completed += 1;
    } else if (meeting.status === "cancelled") {
      cancelled += 1;
    }
  }
  return { upcoming, active, completed, cancelled };
};

/**
 * Pure Performance projection builder (BC-006 Workstream 5).
 *
 * Deterministic, side-effect-free, learner-safe. No XP/mastery/achievements/
 * reflection. Source of truth: authoritative SimulationRun snapshot.
 */
export const buildPerformanceProjection = (
  input: BuildPerformanceProjectionInput,
): Result<PerformanceProjection, RuleViolationError> => {
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

  let submittedCount = 0;
  let resolvedCount = 0;
  for (const decision of snapshot.decisions) {
    if (decision.status === "submitted") {
      submittedCount += 1;
    } else if (decision.status === "resolved") {
      resolvedCount += 1;
    }
  }

  let activeActivities = 0;
  let completedActivities = 0;
  for (const activity of snapshot.activities) {
    if (activity.status === "active") {
      activeActivities += 1;
    } else if (activity.status === "completed") {
      completedActivities += 1;
    }
  }

  const meetingCounts = countMeetingStatuses(snapshot.meetings);

  const activeCrisisIds = snapshot.crises
    .filter((crisis) => crisis.status === "triggered")
    .map((crisis) => crisis.crisisId)
    .sort((a, b) => a.localeCompare(b));

  let resolvedCrisisCount = 0;
  for (const crisis of snapshot.crises) {
    if (crisis.status === "resolved") {
      resolvedCrisisCount += 1;
    }
  }

  const safeByDecisionId = new Map(
    projectionContent.decisions.map((entry) => [entry.id, entry]),
  );

  const recentlyResolvedDecisions: PerformanceRecentlyResolvedDecision[] = [
    ...snapshot.decisions,
  ]
    .filter(
      (decision): decision is typeof decision & { resolvedAt: IsoTimestamp } =>
        decision.status === "resolved" && decision.resolvedAt !== null,
    )
    .map((decision) => {
      const safe = safeByDecisionId.get(
        decision.decisionDefinitionId as DecisionId,
      );
      const publicResultSummary =
        safe?.publicResultSummaryByOptionId[decision.selectedOptionId] ?? null;
      const selectedOptionLabel =
        safe?.options.find((option) => option.id === decision.selectedOptionId)
          ?.label ?? null;
      return {
        decision,
        publicResultSummary,
        selectedOptionLabel,
      };
    })
    .filter(
      (entry): entry is typeof entry & { publicResultSummary: string } =>
        typeof entry.publicResultSummary === "string" &&
        entry.publicResultSummary.length > 0,
    )
    .sort((a, b) => {
      if (a.decision.resolvedAt !== b.decision.resolvedAt) {
        return a.decision.resolvedAt < b.decision.resolvedAt ? 1 : -1;
      }
      return b.decision.id.localeCompare(a.decision.id);
    })
    .slice(0, 5)
    .map((entry) => ({
      decisionRecordId: entry.decision.id,
      decisionDefinitionId: entry.decision.decisionDefinitionId,
      selectedOptionLabel: entry.selectedOptionLabel,
      publicResultSummary: entry.publicResultSummary,
      resolvedAt: entry.decision.resolvedAt,
    }));

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: PERFORMANCE_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: PERFORMANCE_PROJECTION_TYPE,
    projectionSchemaVersion: PERFORMANCE_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    runSummary: {
      simulationRunId: snapshot.simulationRunId,
      status: snapshot.status,
      startedAt: snapshot.startedAt,
      completedAt: snapshot.completedAt,
      currentChapterId: snapshot.currentChapterId,
      currentDayId: snapshot.currentDayId,
      contentPackageVersionId: snapshot.contentPackageVersionId,
    },
    projectSummary: {
      status: snapshot.projectState.status,
      metrics,
    },
    decisionCounts: {
      submitted: submittedCount,
      resolved: resolvedCount,
    },
    activityCounts: {
      active: activeActivities,
      completed: completedActivities,
    },
    meetingCounts,
    documentCount: snapshot.documents.length,
    crisisSummary: {
      activeCount: activeCrisisIds.length,
      resolvedCount: resolvedCrisisCount,
      activeCrisisIds,
    },
    recentlyResolvedDecisions,
  };

  return ok({
    ...withoutHash,
    semanticHash: computePerformanceSemanticHash(withoutHash),
  });
};

export type SemanticPerformanceInput = Omit<
  PerformanceProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticPerformancePayload = (
  projection: SemanticPerformanceInput,
): Readonly<Record<string, unknown>> => ({
  projectionId: projection.projectionId,
  projectionType: projection.projectionType,
  projectionSchemaVersion: projection.projectionSchemaVersion,
  tenantId: projection.tenantId,
  simulationRunId: projection.simulationRunId,
  learnerId: projection.learnerId,
  contentPackageVersionId: projection.contentPackageVersionId,
  sourceAggregateVersion: projection.sourceAggregateVersion,
  sourceStateVersion: projection.sourceStateVersion,
  sourceActionSequence: projection.sourceActionSequence,
  runSummary: projection.runSummary,
  projectSummary: projection.projectSummary,
  decisionCounts: projection.decisionCounts,
  activityCounts: projection.activityCounts,
  meetingCounts: projection.meetingCounts,
  documentCount: projection.documentCount,
  crisisSummary: projection.crisisSummary,
  recentlyResolvedDecisions: projection.recentlyResolvedDecisions,
});

export const computePerformanceSemanticHash = (
  projection: SemanticPerformanceInput,
) => computeSemanticHashFromStableValue(semanticPerformancePayload(projection));
