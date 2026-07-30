/**
 * BC-006 Workstream 6 — competency evidence aggregation (derived, not authoritative).
 */

import type { LearningSafeContent } from "./content";
import type { LearningEvidenceRecord } from "./evidence";

export type MasteryBandAvailability = "unavailable";

export type MasteryBandUnavailableReason = "mastery_thresholds_not_authored";

export interface CompetencyEvidenceAggregate {
  readonly competencyId: string;
  readonly title: string;
  readonly evidenceCount: number;
  readonly totalDelta: number;
  readonly evidenceIds: readonly string[];
  readonly bandAvailability: MasteryBandAvailability;
  readonly bandUnavailableReason: MasteryBandUnavailableReason;
  readonly band: null;
}

export const aggregateCompetencyEvidence = (
  evidence: readonly LearningEvidenceRecord[],
  learningContent: LearningSafeContent,
): readonly CompetencyEvidenceAggregate[] => {
  const byCompetency = new Map<
    string,
    { totalDelta: number; evidenceIds: string[] }
  >();

  for (const record of evidence) {
    if (record.contributionDelta === null) {
      continue;
    }
    for (const competencyId of record.competencyIds) {
      const current = byCompetency.get(competencyId) ?? {
        totalDelta: 0,
        evidenceIds: [],
      };
      current.totalDelta += record.contributionDelta;
      if (!current.evidenceIds.includes(record.evidenceId)) {
        current.evidenceIds.push(record.evidenceId);
      }
      byCompetency.set(competencyId, current);
    }
  }

  const titleById = new Map(
    learningContent.competencies.map((competency) => [
      competency.id,
      competency.title,
    ]),
  );

  return [...byCompetency.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([competencyId, aggregate]) => ({
      competencyId,
      title: titleById.get(competencyId) ?? competencyId,
      evidenceCount: aggregate.evidenceIds.length,
      totalDelta: aggregate.totalDelta,
      evidenceIds: [...aggregate.evidenceIds].sort((a, b) =>
        a.localeCompare(b),
      ),
      bandAvailability: "unavailable" as const,
      bandUnavailableReason: "mastery_thresholds_not_authored" as const,
      band: null,
    }));
};
