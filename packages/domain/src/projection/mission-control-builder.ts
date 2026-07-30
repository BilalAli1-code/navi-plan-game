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
import { computeSemanticHashFromStableValue } from "./hash";
import { deriveProjectionId, asSimulationProjectionId } from "./ids";
import {
  MISSION_CONTROL_PROJECTION_SCHEMA_VERSION,
  MISSION_CONTROL_PROJECTION_TYPE,
  type MissionControlProjection,
  type MissionControlRecommendedAction,
  type MissionControlRecentRevealedOutcome,
} from "./mission-control-contracts";
import { countUpcomingMeetings } from "./meetings-builder";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildMissionControlProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  /** Full definitions for eligibility parity only — outcomes never projected. */
  readonly eligibilityDefinitions: readonly DecisionDefinition[];
  readonly projectionContent: ProjectionSafeContent;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const CHANNEL_UNAVAILABLE = {
  availability: "unavailable",
  reason: "channel_not_implemented",
} as const;

/**
 * Pure Mission Control projection builder (PS-ROADMAP-011 / PS-ROADMAP-017).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, clock, AI, repository
 * access, aggregate mutation, or fabricated channel data.
 *
 * Inbox unread counts remain unavailable (read/action-required unsupported).
 * Upcoming meetings count from authoritative meetings (scheduled + available).
 * Pending decisions and recommended actions are always available (may be empty).
 */
export const buildMissionControlProjection = (
  input: BuildMissionControlProjectionInput,
): Result<MissionControlProjection, RuleViolationError> => {
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

  const nextRecommendedActions: MissionControlRecommendedAction[] = [
    ...projectionContent.decisions,
  ]
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
          actionId: `decision:${safe.id}`,
          label: safe.title,
          targetKind: "decision" as const,
          targetId: safe.id,
          authoredOrder: safe.authoredOrder,
        },
      ];
    });

  const safeByDecisionId = new Map(
    projectionContent.decisions.map((entry) => [entry.id, entry]),
  );

  let recentRevealedOutcome: MissionControlRecentRevealedOutcome | null = null;
  const resolvedWithSummary = [...snapshot.decisions]
    .filter((decision) => decision.status === "resolved")
    .map((decision) => {
      const safe = safeByDecisionId.get(decision.decisionDefinitionId);
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
      (
        entry,
      ): entry is typeof entry & {
        publicResultSummary: string;
        decision: typeof entry.decision & { resolvedAt: IsoTimestamp };
      } =>
        typeof entry.publicResultSummary === "string" &&
        entry.publicResultSummary.length > 0 &&
        entry.decision.resolvedAt !== null,
    )
    .sort((a, b) => {
      if (a.decision.resolvedAt !== b.decision.resolvedAt) {
        return a.decision.resolvedAt < b.decision.resolvedAt ? 1 : -1;
      }
      return b.decision.id.localeCompare(a.decision.id);
    });

  const latest = resolvedWithSummary[0];
  if (latest) {
    recentRevealedOutcome = {
      decisionRecordId: latest.decision.id,
      decisionDefinitionId: latest.decision.decisionDefinitionId,
      selectedOptionLabel: latest.selectedOptionLabel,
      publicResultSummary: latest.publicResultSummary,
      resolvedAt: latest.decision.resolvedAt,
    };
  }

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: MISSION_CONTROL_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: MISSION_CONTROL_PROJECTION_TYPE,
    projectionSchemaVersion: MISSION_CONTROL_PROJECTION_SCHEMA_VERSION,
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
    counts: {
      pendingDecisions: {
        availability: "available" as const,
        count: nextRecommendedActions.length,
      },
      unreadActionRequiredInboxItems: CHANNEL_UNAVAILABLE,
      upcomingMeetings: {
        availability: "available" as const,
        count: countUpcomingMeetings(snapshot.meetings),
      },
      activeActivities: {
        availability: "available" as const,
        count: snapshot.activities.filter(
          (activity) => activity.status === "active",
        ).length,
      },
      blockingCrises: {
        availability: "available" as const,
        count: snapshot.crises.filter((crisis) => crisis.status === "triggered")
          .length,
      },
    },
    nextRecommendedActions,
    recentRevealedOutcome,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeMissionControlSemanticHash(withoutHash),
  });
};

export type SemanticMissionControlInput = Omit<
  MissionControlProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticMissionControlPayload = (
  projection: SemanticMissionControlInput,
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
  counts: projection.counts,
  nextRecommendedActions: projection.nextRecommendedActions,
  recentRevealedOutcome: projection.recentRevealedOutcome,
});

export const computeMissionControlSemanticHash = (
  projection: SemanticMissionControlInput,
) =>
  computeSemanticHashFromStableValue(semanticMissionControlPayload(projection));
