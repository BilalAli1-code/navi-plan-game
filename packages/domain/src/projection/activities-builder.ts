import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ActivityRuntime } from "../simulation/run/activity";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  ACTIVITIES_PROJECTION_SCHEMA_VERSION,
  ACTIVITIES_PROJECTION_TYPE,
  type ActivitiesCapabilities,
  type ActivitiesItem,
  type ActivitiesProjection,
  type ActivitiesSummary,
} from "./activities-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildActivitiesProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const UNSUPPORTED_CAPABILITIES: ActivitiesCapabilities = {
  complete: "unsupported",
  reopen: "unsupported",
  assign: "unsupported",
};

const toActivitiesItem = (activity: ActivityRuntime): ActivitiesItem => ({
  activityId: activity.activityId,
  creationSequence: activity.creationSequence,
  title: activity.content.title,
  summary: activity.content.summary,
  body: activity.content.body,
  source: {
    kind: activity.source.kind,
    sourceId: activity.source.sourceId,
    reason: activity.source.reason,
  },
  status: activity.status,
  createdAt: activity.createdAt,
});

const summarize = (
  activities: readonly ActivitiesItem[],
): ActivitiesSummary => ({
  totalActivities: activities.length,
  isEmpty: activities.length === 0,
});

/**
 * Pure Activities projection builder (PS-ROADMAP-022).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, repository access,
 * aggregate mutation, or event mirroring.
 *
 * Source of truth: authoritative SimulationRun snapshot `activities` filtered
 * to status="active".
 * Ordering: creationSequence ascending; stable tie-break by ActivityId.
 */
export const buildActivitiesProjection = (
  input: BuildActivitiesProjectionInput,
): Result<ActivitiesProjection, RuleViolationError> => {
  const { snapshot, generatedAt } = input;
  const runtimes = snapshot.activities.filter(
    (activity) => activity.status === "active",
  );

  const seenIds = new Set<string>();
  for (const activity of runtimes) {
    if (seenIds.has(activity.activityId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Activities source contains duplicate Activity IDs.",
          { activityId: activity.activityId },
        ),
      );
    }
    seenIds.add(activity.activityId);
  }

  const ordered = [...runtimes].sort((a, b) => {
    if (a.creationSequence !== b.creationSequence) {
      return a.creationSequence - b.creationSequence;
    }
    return a.activityId.localeCompare(b.activityId);
  });

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!;
    const current = ordered[index]!;
    if (current.creationSequence <= previous.creationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Activity creationSequence values must be unique and strictly increasing.",
        ),
      );
    }
  }

  const activities = ordered.map(toActivitiesItem);

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: ACTIVITIES_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: ACTIVITIES_PROJECTION_TYPE,
    projectionSchemaVersion: ACTIVITIES_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    activities,
    summary: summarize(activities),
    capabilities: UNSUPPORTED_CAPABILITIES,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeActivitiesSemanticHash(withoutHash),
  });
};

export type SemanticActivitiesInput = Omit<
  ActivitiesProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticActivitiesPayload = (
  projection: SemanticActivitiesInput,
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
  activities: projection.activities,
  summary: projection.summary,
  capabilities: projection.capabilities,
});

export const computeActivitiesSemanticHash = (
  projection: SemanticActivitiesInput,
) => computeSemanticHashFromStableValue(semanticActivitiesPayload(projection));
