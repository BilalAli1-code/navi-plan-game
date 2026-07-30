import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ProjectionSafeContent } from "./content";
import {
  DECISION_LOG_PROJECTION_SCHEMA_VERSION,
  DECISION_LOG_PROJECTION_TYPE,
  type DecisionLogEntry,
  type DecisionLogProjection,
} from "./decision-log-contracts";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildDecisionLogProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly projectionContent: ProjectionSafeContent;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

/**
 * Pure Decision Log projection builder (PS-ROADMAP-012).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, clock, AI, repository
 * access, aggregate mutation, or browser logic.
 *
 * Source of truth: authoritative SimulationRun snapshot decisions (same set as
 * `simulation.decisionHistory`). Does not read Mission Control or Simulation
 * Projection rows.
 *
 * Ordering:
 * - `sequence` is 1-based chronological (oldest submitted first; tie-break
 *   DecisionRecordId ascending)
 * - `entries` array is newest-first (submittedAt desc, DecisionRecordId desc)
 *
 * Revealed outcomes: included only when Decision.status === "resolved" and a
 * non-empty publicResultSummary exists in projection-safe content. Hidden
 * scoring, outcome ids, facilitator notes, and unrevealed summaries are never
 * projected.
 */
export const buildDecisionLogProjection = (
  input: BuildDecisionLogProjectionInput,
): Result<DecisionLogProjection, RuleViolationError> => {
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

  const safeByDecisionId = new Map(
    projectionContent.decisions.map((entry) => [entry.id, entry]),
  );

  const chronological = [...snapshot.decisions].sort((a, b) => {
    if (a.submittedAt !== b.submittedAt) {
      return a.submittedAt < b.submittedAt ? -1 : 1;
    }
    return a.id.localeCompare(b.id);
  });

  const sequenceByRecordId = new Map<string, number>();
  chronological.forEach((decision, index) => {
    sequenceByRecordId.set(decision.id, index + 1);
  });

  const entriesChronological: DecisionLogEntry[] = chronological.map(
    (decision) => {
      const safe = safeByDecisionId.get(decision.decisionDefinitionId);
      const selectedOptionLabel =
        safe?.options.find((option) => option.id === decision.selectedOptionId)
          ?.label ?? null;
      const publicSummary =
        safe?.publicResultSummaryByOptionId[decision.selectedOptionId] ?? null;
      const revealedOutcome =
        decision.status === "resolved" &&
        typeof publicSummary === "string" &&
        publicSummary.length > 0
          ? { summary: publicSummary }
          : null;

      return {
        entryId: decision.id,
        decisionRecordId: decision.id,
        decisionDefinitionId: decision.decisionDefinitionId,
        sequence: sequenceByRecordId.get(decision.id) ?? 0,
        decidedAt: decision.submittedAt,
        title: safe?.title ?? "",
        selectedOption: {
          optionId: decision.selectedOptionId,
          label: selectedOptionLabel,
        },
        status: decision.status,
        revealedOutcome,
      };
    },
  );

  // Newest-first presentation; sequence remains chronological identity.
  const entries = [...entriesChronological].sort((a, b) => {
    if (a.decidedAt !== b.decidedAt) {
      return a.decidedAt < b.decidedAt ? 1 : -1;
    }
    return b.entryId.localeCompare(a.entryId);
  });

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: DECISION_LOG_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: DECISION_LOG_PROJECTION_TYPE,
    projectionSchemaVersion: DECISION_LOG_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    entries,
    summary: {
      totalEntries: entries.length,
      isEmpty: entries.length === 0,
    },
  };

  return ok({
    ...withoutHash,
    semanticHash: computeDecisionLogSemanticHash(withoutHash),
  });
};

export type SemanticDecisionLogInput = Omit<
  DecisionLogProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticDecisionLogPayload = (
  projection: SemanticDecisionLogInput,
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
  entries: projection.entries,
  summary: projection.summary,
});

export const computeDecisionLogSemanticHash = (
  projection: SemanticDecisionLogInput,
) => computeSemanticHashFromStableValue(semanticDecisionLogPayload(projection));
