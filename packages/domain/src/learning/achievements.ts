/**
 * BC-006 Workstream 6 — achievement evaluation via authored conditions.
 */

import { evaluateConditionExpression } from "../simulation/content/business-case/evaluate-condition";
import type { ExperienceLevel } from "../simulation/content/business-case/enums";
import type { SimulationRunReadSnapshot } from "../projection/read-snapshot";
import { buildLearningConditionFacts } from "./condition-facts";
import type { LearningSafeContent } from "./content";
import { extractLearningEvidence } from "./evidence";

export const ACHIEVEMENT_AWARD_RULE_VERSION = "achievement-award/v1";

export interface AchievementAward {
  readonly achievementId: string;
  readonly title: string;
  readonly description: string;
  readonly awardId: string;
  readonly qualifyingEvidenceIds: readonly string[];
  readonly ruleVersion: typeof ACHIEVEMENT_AWARD_RULE_VERSION;
}

export interface EvaluateAchievementsInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly learningContent: LearningSafeContent;
  readonly experienceLevel: ExperienceLevel | null;
}

export const evaluateAchievements = (
  input: EvaluateAchievementsInput,
): readonly AchievementAward[] => {
  const facts = buildLearningConditionFacts(
    input.snapshot,
    input.experienceLevel,
  );
  const evidence = extractLearningEvidence({
    snapshot: input.snapshot,
    learningContent: input.learningContent,
    experienceLevel: input.experienceLevel,
  });

  const evidenceIds = evidence.map((record) => record.evidenceId);
  const awards: AchievementAward[] = [];
  const awardedAchievementIds = new Set<string>();

  for (const achievement of input.learningContent.achievements) {
    if (awardedAchievementIds.has(achievement.id)) {
      continue;
    }
    if (!evaluateConditionExpression(achievement.awardedWhen, facts)) {
      continue;
    }
    awardedAchievementIds.add(achievement.id);
    awards.push({
      achievementId: achievement.id,
      title: achievement.title,
      description: achievement.description,
      awardId: `achievement_award:${input.snapshot.simulationRunId}:${achievement.id}:${ACHIEVEMENT_AWARD_RULE_VERSION}`,
      qualifyingEvidenceIds: [...evidenceIds],
      ruleVersion: ACHIEVEMENT_AWARD_RULE_VERSION,
    });
  }

  return awards.sort((left, right) =>
    left.achievementId.localeCompare(right.achievementId),
  );
};
