/**
 * Shared condition facts for learning selectors (achievements, coaching).
 *
 * Mirrors engine-evaluation `toConditionFacts` using projection read snapshots.
 */

import { buildDecisionEligibilityContextFromParts } from "../simulation/run/decision-eligibility";
import type { ConditionEvaluationFacts } from "../simulation/content/business-case/evaluate-condition";
import type { SimulationRunReadSnapshot } from "../projection/read-snapshot";
import type { ExperienceLevel } from "../simulation/content/business-case/enums";

export const buildLearningConditionFacts = (
  snapshot: SimulationRunReadSnapshot,
  experienceLevel: ExperienceLevel | null,
  options: {
    readonly initiallyUnlockedChapterIds?: ReadonlySet<string>;
    readonly narrativeFlags?: Readonly<Record<string, boolean>>;
  } = {},
): ConditionEvaluationFacts => {
  const context = buildDecisionEligibilityContextFromParts({
    runStatus: snapshot.status,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    currentChapterId: snapshot.currentChapterId,
    decisions: snapshot.decisions,
    documents: snapshot.documents,
    meetings: snapshot.meetings,
    learnerMessages: snapshot.learnerMessages,
    activities: snapshot.activities,
    projectMetrics: snapshot.projectMetrics,
    chapterProgress: snapshot.chapterProgress,
    experienceLevel,
    ...(options.initiallyUnlockedChapterIds
      ? { initiallyUnlockedChapterIds: options.initiallyUnlockedChapterIds }
      : {}),
    ...(options.narrativeFlags
      ? { narrativeFlags: options.narrativeFlags }
      : {}),
  });

  const submittedDecisionIds = new Set(
    context.decisions.map((decision) => decision.decisionDefinitionId),
  );
  const resolvedDecisionIds = new Set(
    context.decisions
      .filter((decision) => decision.status === "resolved")
      .map((decision) => decision.decisionDefinitionId),
  );
  const selectedOptionsByDecisionId = new Map<string, string>();
  for (const decision of context.decisions) {
    selectedOptionsByDecisionId.set(
      decision.decisionDefinitionId,
      decision.selectedOptionId,
    );
  }

  return {
    completedChapterIds: context.completedChapterIds,
    currentChapterId: context.currentChapterId,
    initiallyUnlockedChapterIds: context.initiallyUnlockedChapterIds,
    submittedDecisionIds,
    resolvedDecisionIds,
    selectedOptionsByDecisionId,
    completedActivityIds: context.completedActivityIds,
    activeActivityIds: context.activeActivityIds,
    completedMeetingIds: context.completedMeetingIds,
    availableDocumentIds: context.availableDocumentIds,
    deliveredMessageIds: context.deliveredMessageIds,
    metricValues: context.metricValues,
    narrativeFlags: context.narrativeFlags,
    experienceLevel: context.experienceLevel,
  };
};
