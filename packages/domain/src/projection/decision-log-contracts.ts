import type {
  ContentPackageVersionId,
  DecisionId,
  DecisionOptionId,
  DecisionRecordId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { DecisionStatus } from "../simulation/run/decision";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Decision Log projection (PS-ROADMAP-012).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Envelope-compatible with ADR-006 / PS-ROADMAP-009 (flat payload blocks).
 *
 * Contract skeleton source: PS-ARCH-016 §8.6.
 */

export const DECISION_LOG_PROJECTION_TYPE =
  "decision_log" as const satisfies WorkplaceProjectionType;
export const DECISION_LOG_PROJECTION_SCHEMA_VERSION = 1 as const;

/**
 * Learner-facing entry status mirrors authoritative Decision.status.
 * PS-009 §8.6 uses pending/resolved wording; Domain today supports
 * `submitted` | `resolved` only. Keep Domain literals so Decision Log does
 * not diverge from `simulation.decisionHistory` for the same Decision.
 */
export type DecisionLogEntryStatus = DecisionStatus;

export interface DecisionLogSelectedOption {
  readonly optionId: DecisionOptionId;
  /** Label from projection-safe content at build time; null when unavailable. */
  readonly label: string | null;
}

/**
 * Learner-visible revealed outcome, or null when none is revealed yet /
 * none exists. Null is not a failure and not unavailable.
 */
export interface DecisionLogRevealedOutcome {
  readonly summary: string;
}

/**
 * One Decision Log entry per authoritative Decision occurrence.
 *
 * Identity:
 * - `entryId` = authoritative `DecisionRecordId` (stable across rebuilds)
 * - `decisionDefinitionId` = authored Decision definition id
 * - `sequence` = 1-based chronological occurrence order (oldest = 1)
 *
 * Presentation order of `entries` is newest-first (see builder). Frontend
 * must render payload order and must not reorder.
 */
export interface DecisionLogEntry {
  readonly entryId: DecisionRecordId;
  readonly decisionRecordId: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly sequence: number;
  /** Authoritative Decision.submittedAt — never fabricated on rebuild. */
  readonly decidedAt: IsoTimestamp;
  readonly title: string;
  readonly selectedOption: DecisionLogSelectedOption;
  readonly status: DecisionLogEntryStatus;
  readonly revealedOutcome: DecisionLogRevealedOutcome | null;
}

export interface DecisionLogSummary {
  readonly totalEntries: number;
  readonly isEmpty: boolean;
}

export interface DecisionLogProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof DECISION_LOG_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof DECISION_LOG_PROJECTION_SCHEMA_VERSION;

  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly learnerId: LearnerId;
  readonly contentPackageVersionId: ContentPackageVersionId;

  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  readonly sourceActionSequence: number;
  readonly sourceEventId: EventId | null;

  readonly generatedAt: IsoTimestamp;
  readonly semanticHash: ProjectionHash;

  /** Newest completed learner-visible decision first. */
  readonly entries: readonly DecisionLogEntry[];
  readonly summary: DecisionLogSummary;
}
