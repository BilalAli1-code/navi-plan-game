import type {
  ActivityId,
  ChapterId,
  ContentPackageVersionId,
  DecisionId,
  DecisionOptionId,
  DocumentId,
  MeetingDefinitionId,
} from "../../shared-kernel/ids";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { ConditionExpression } from "./business-case/conditions";
import type { DecisionOutcomeDefinition } from "./decision-outcome-definition";

/**
 * Minimum read-only Content contracts for decision submission + resolution
 * (PS-ROADMAP-004 / PS-ROADMAP-005 / BC-006 Workstream 3).
 *
 * Full Content Aggregate / authoring is out of scope. These shapes are immutable
 * inputs resolved by Application from the run's contentPackageVersionId.
 * Fixture providers remain scaffolding, not production content.
 */

export interface DecisionOptionDefinition {
  readonly id: DecisionOptionId;
  readonly decisionDefinitionId: DecisionId;
  /** Authored outcome resolved deterministically for this option. */
  readonly outcome: DecisionOutcomeDefinition;
}

export type DecisionAvailability = "available" | "unavailable";

/**
 * Minimal prerequisite form: listed decision definitions must already have a
 * submitted Decision in this run. Unsupported declarative forms are rejected
 * at the provider boundary (not invented here).
 *
 * BC-006 W3 adds optional authored eligibility condition and chapter/evidence
 * gates evaluated by the shared eligibility policy against authoritative state.
 */
export interface DecisionDefinition {
  readonly id: DecisionId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly options: readonly DecisionOptionDefinition[];
  readonly availability: DecisionAvailability;
  readonly prerequisiteDecisionIds: readonly DecisionId[];
  /**
   * Document definition ids that must be present in SimulationState before the
   * decision is eligible (content `requiredEvidence` with requiredForEligibility).
   */
  readonly requiredEvidenceDocumentIds: readonly DocumentId[];
  /** Meeting definition ids required as completed evidence when authored. */
  readonly requiredEvidenceMeetingIds: readonly MeetingDefinitionId[];
  /** Learner-message / inbox definition ids required as delivered evidence. */
  readonly requiredEvidenceMessageIds: readonly string[];
  /** Activity ids that must be completed before eligibility. */
  readonly requiredEvidenceActivityIds: readonly ActivityId[];
  /**
   * Owning chapter for progressive unlock. Null skips chapter gating
   * (scaffold / legacy definitions).
   */
  readonly chapterId: ChapterId | null;
  /**
   * Authored `availableWhen` condition. Null is treated as always-true.
   */
  readonly eligibilityCondition: ConditionExpression | null;
  /** When non-null, submissions at/after this instant are expired. */
  readonly expiresAt: IsoTimestamp | null;
}
