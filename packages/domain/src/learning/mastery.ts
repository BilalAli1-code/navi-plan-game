/**
 * BC-006 Workstream 6 — mastery evaluation (bands unavailable until authored).
 */

import { aggregateCompetencyEvidence } from "./competency-aggregation";
import type { CompetencyEvidenceAggregate } from "./competency-aggregation";
import type { LearningSafeContent } from "./content";
import type { LearningEvidenceRecord } from "./evidence";

export type {
  CompetencyEvidenceAggregate,
  MasteryBandAvailability,
  MasteryBandUnavailableReason,
} from "./competency-aggregation";

/**
 * Evaluate mastery aggregates from derived evidence. Band assignment is
 * intentionally unavailable — content does not yet define mastery thresholds.
 */
export const evaluateMastery = (
  evidence: readonly LearningEvidenceRecord[],
  learningContent: LearningSafeContent,
): readonly CompetencyEvidenceAggregate[] =>
  aggregateCompetencyEvidence(evidence, learningContent);
