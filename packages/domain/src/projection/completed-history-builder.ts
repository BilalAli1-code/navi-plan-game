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
  COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  type CompletedHistoryCapabilities,
  type CompletedHistoryItem,
  type CompletedHistoryProjection,
  type CompletedHistorySummary,
} from "./completed-history-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildCompletedHistoryProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const UNSUPPORTED_CAPABILITIES: CompletedHistoryCapabilities = {
  reopen: "unsupported",
  clear: "unsupported",
  export: "unsupported",
};

const toCompletedHistoryItem = (
  activity: ActivityRuntime & {
    readonly status: "completed";
    readonly completionSequence: number;
    readonly completedAt: IsoTimestamp;
  },
): CompletedHistoryItem => ({
  activityId: activity.activityId,
  creationSequence: activity.creationSequence,
  completionSequence: activity.completionSequence,
  title: activity.content.title,
  summary: activity.content.summary,
  body: activity.content.body,
  source: {
    kind: activity.source.kind,
    sourceId: activity.source.sourceId,
    reason: activity.source.reason,
  },
  status: "completed",
  createdAt: activity.createdAt,
  completedAt: activity.completedAt,
});

const summarize = (
  items: readonly CompletedHistoryItem[],
): CompletedHistorySummary => ({
  totalCompleted: items.length,
  isEmpty: items.length === 0,
});

/**
 * Pure Completed History projection builder (PS-ROADMAP-022).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, repository access,
 * aggregate mutation, or event mirroring.
 *
 * Source of truth: authoritative SimulationRun snapshot `activities` filtered
 * to status="completed".
 * Ordering: completionSequence descending (most recently completed first).
 * completingCommandId is NOT included in public items.
 */
export const buildCompletedHistoryProjection = (
  input: BuildCompletedHistoryProjectionInput,
): Result<CompletedHistoryProjection, RuleViolationError> => {
  const { snapshot, generatedAt } = input;

  const completedRuntimes = snapshot.activities.filter(
    (
      activity,
    ): activity is ActivityRuntime & {
      readonly status: "completed";
      readonly completionSequence: number;
      readonly completedAt: IsoTimestamp;
    } =>
      activity.status === "completed" &&
      activity.completionSequence !== null &&
      activity.completedAt !== null,
  );

  const seenIds = new Set<string>();
  for (const activity of completedRuntimes) {
    if (seenIds.has(activity.activityId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Completed History source contains duplicate Activity IDs.",
          { activityId: activity.activityId },
        ),
      );
    }
    seenIds.add(activity.activityId);
  }

  // Sort descending by completionSequence (most recently completed first).
  const ordered = [...completedRuntimes].sort((a, b) => {
    if (a.completionSequence !== b.completionSequence) {
      return b.completionSequence - a.completionSequence;
    }
    return b.activityId.localeCompare(a.activityId);
  });

  const completedItems = ordered.map(toCompletedHistoryItem);

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
    projectionSchemaVersion: COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    completedItems,
    summary: summarize(completedItems),
    capabilities: UNSUPPORTED_CAPABILITIES,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeCompletedHistorySemanticHash(withoutHash),
  });
};

export type SemanticCompletedHistoryInput = Omit<
  CompletedHistoryProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticCompletedHistoryPayload = (
  projection: SemanticCompletedHistoryInput,
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
  completedItems: projection.completedItems,
  summary: projection.summary,
  capabilities: projection.capabilities,
});

export const computeCompletedHistorySemanticHash = (
  projection: SemanticCompletedHistoryInput,
) =>
  computeSemanticHashFromStableValue(
    semanticCompletedHistoryPayload(projection),
  );
