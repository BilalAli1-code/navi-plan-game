/**
 * BC-006 Workstream 6 — deterministic decision assessment (no invented bands).
 */

import type { Decision } from "../simulation/run/decision";
import type { DecisionOutcome } from "../simulation/run/decision-outcome";
import type { LearningSafeContent } from "./content";
import type { LearningEvidenceRecord } from "./evidence";
import { parseConsequenceDefinitionIdFromLearningSignalId } from "./evidence";

export const DECISION_ASSESSOR_VERSION = "decision-assessor/v1";

const THRESHOLD_SENSITIVE_COMPETENCIES = new Set([
  "competency.governance",
  "competency.quality-compliance",
]);

const isThresholdSensitiveReasonCode = (reasonCode: string): boolean => {
  const normalized = reasonCode.toLowerCase();
  return normalized.includes("unsafe") || normalized.includes("ethic");
};

/**
 * Threshold failure when a negative competency delta targets governance /
 * quality-compliance competencies, or when the authored reason code signals
 * unsafe / ethical concern.
 */
export const isThresholdFailureEvidence = (
  evidence: LearningEvidenceRecord,
  learningContent: LearningSafeContent,
): boolean => {
  if (evidence.contributionDelta === null || evidence.contributionDelta >= 0) {
    return false;
  }
  if (
    evidence.competencyIds.some((competencyId) =>
      THRESHOLD_SENSITIVE_COMPETENCIES.has(competencyId),
    )
  ) {
    return true;
  }
  if (evidence.sourceType !== "decision_learning_signal") {
    return false;
  }
  const consequenceDefinitionId =
    parseConsequenceDefinitionIdFromLearningSignalId(evidence.sourceIdentity);
  if (consequenceDefinitionId === null) {
    return false;
  }
  const payload =
    learningContent.consequenceLearningSignals[consequenceDefinitionId];
  if (!payload) {
    return false;
  }
  return isThresholdSensitiveReasonCode(payload.reasonCode);
};

export interface DecisionAssessment {
  readonly version: typeof DECISION_ASSESSOR_VERSION;
  readonly qualityBand: string | null;
  readonly competencyContributions: Readonly<Record<string, number>>;
  readonly thresholdFailure: boolean;
  readonly learnerSafeSummary: string;
  readonly strengths: readonly string[];
  readonly developmentAreas: readonly string[];
}

export interface AssessResolvedDecisionInput {
  readonly decision: Decision;
  readonly outcome: DecisionOutcome;
  readonly evidenceForDecision: readonly LearningEvidenceRecord[];
  readonly learningContent: LearningSafeContent;
}

export const assessResolvedDecision = (
  input: AssessResolvedDecisionInput,
): DecisionAssessment => {
  const { outcome, evidenceForDecision, learningContent } = input;
  const competencyContributions: Record<string, number> = {};

  for (const evidence of evidenceForDecision) {
    if (evidence.contributionDelta === null) {
      continue;
    }
    for (const competencyId of evidence.competencyIds) {
      competencyContributions[competencyId] =
        (competencyContributions[competencyId] ?? 0) +
        evidence.contributionDelta;
    }
  }

  const competencyTitleById = new Map(
    learningContent.competencies.map((competency) => [
      competency.id,
      competency.title,
    ]),
  );

  const strengths = Object.entries(competencyContributions)
    .filter(([, delta]) => delta > 0)
    .map(
      ([competencyId]) => competencyTitleById.get(competencyId) ?? competencyId,
    )
    .sort((a, b) => a.localeCompare(b));

  const developmentAreas = Object.entries(competencyContributions)
    .filter(([, delta]) => delta < 0)
    .map(
      ([competencyId]) => competencyTitleById.get(competencyId) ?? competencyId,
    )
    .sort((a, b) => a.localeCompare(b));

  const thresholdFailure = evidenceForDecision.some((record) =>
    isThresholdFailureEvidence(record, learningContent),
  );

  const summaryParts: string[] = [];
  if (strengths.length > 0) {
    summaryParts.push(`Strengths: ${strengths.join(", ")}.`);
  }
  if (developmentAreas.length > 0) {
    summaryParts.push(`Development areas: ${developmentAreas.join(", ")}.`);
  }
  if (thresholdFailure) {
    summaryParts.push(
      "This decision raised governance or quality concerns that need attention.",
    );
  }
  if (summaryParts.length === 0) {
    summaryParts.push("Decision resolved with recorded learning evidence.");
  }

  return {
    version: DECISION_ASSESSOR_VERSION,
    qualityBand: outcome.qualityClassification,
    competencyContributions,
    thresholdFailure,
    learnerSafeSummary: summaryParts.join(" "),
    strengths,
    developmentAreas,
  };
};
