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
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ProjectStateStatus } from "../simulation/content/consequence-definition";
import type { DecisionStatus } from "../simulation/run/decision";
import type { SimulationRunStatus } from "../simulation/run/status";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Simulation Projection (PS-ROADMAP-006).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Envelope-compatible with ADR-006 / PS-ROADMAP-009 shared workplace envelope
 * (flat payload blocks at the root; nested `payload` not required for v1).
 */

export const SIMULATION_PROJECTION_TYPE =
  "simulation" as const satisfies WorkplaceProjectionType;
export const SIMULATION_PROJECTION_SCHEMA_VERSION = 1 as const;

export interface SimulationRunProjection {
  readonly simulationRunId: SimulationRunId;
  readonly status: SimulationRunStatus;
  readonly startedAt: IsoTimestamp | null;
  readonly pausedAt: IsoTimestamp | null;
  readonly completedAt: IsoTimestamp | null;
  readonly archivedAt: IsoTimestamp | null;
  readonly currentChapterId: string | null;
  readonly currentDayId: string | null;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly sourceStateVersion: number;
}

export interface ProjectMetricProjection {
  readonly metricKey: MetricKey;
  readonly value: number;
  readonly unit: string | null;
}

export interface ProjectProjection {
  readonly status: ProjectStateStatus;
  readonly metrics: readonly ProjectMetricProjection[];
  readonly sourceStateVersion: number;
}

export interface AvailableDecisionOptionProjection {
  readonly optionId: DecisionOptionId;
  readonly label: string;
  readonly authoredOrder: number;
}

export interface AvailableDecisionProjection {
  readonly decisionDefinitionId: DecisionId;
  readonly title: string;
  readonly prompt: string;
  readonly description: string | null;
  readonly status: "available";
  readonly expiresAt: IsoTimestamp | null;
  readonly authoredOrder: number;
  readonly options: readonly AvailableDecisionOptionProjection[];
}

/**
 * Learner-safe history item.
 *
 * Visibility matrix (default hidden unless listed):
 * - learner-visible: ids, labels, timestamps, status, null qualityClassification,
 *   explicitly authored publicResultSummary
 * - server projection metadata: none in this item
 * - hidden: consequence payloads, application keys, signals, schedules,
 *   resolverVersion, hidden reason codes
 */
export interface DecisionHistoryProjection {
  readonly decisionRecordId: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionId: DecisionOptionId;
  readonly selectedOptionLabel: string | null;
  readonly submittedAt: IsoTimestamp;
  readonly resolvedAt: IsoTimestamp | null;
  readonly status: DecisionStatus;
  readonly decisionOutcomeId: DecisionOutcomeId | null;
  /** Explicit null when unset — not a score synonym. */
  readonly qualityClassification: string | null;
  readonly publicResultSummary: string | null;
  readonly sourceActionSequence: number | null;
}

export interface SimulationProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof SIMULATION_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof SIMULATION_PROJECTION_SCHEMA_VERSION;

  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly learnerId: LearnerId;
  readonly contentPackageVersionId: ContentPackageVersionId;

  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  readonly sourceActionSequence: number;
  /**
   * Provenance only — the trigger event that originally produced this stored
   * row on insert/replace. Not a recency cursor and not part of the semantic
   * hash. Same-source/same-hash no-ops do not update this field; later
   * successfully handled trigger events are tracked in projection_event_inbox.
   */
  readonly sourceEventId: EventId | null;

  readonly generatedAt: IsoTimestamp;
  /**
   * Deterministic consistency fingerprint (`fnv1a64:v1:<hex>`).
   * Not a cryptographic integrity, authentication, or tamper-protection hash.
   */
  readonly semanticHash: ProjectionHash;

  readonly run: SimulationRunProjection;
  readonly project: ProjectProjection;
  readonly availableDecisions: readonly AvailableDecisionProjection[];
  readonly decisionHistory: readonly DecisionHistoryProjection[];
}
