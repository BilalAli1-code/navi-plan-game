/**
 * BC-006 Workstream 6 — learner-safe learning content contracts.
 *
 * Separate from ProjectionSafeContent (Workstream 5) to avoid breaking W5.
 * Experience-level presentation is selected at the call site via locale / variant
 * resolution; this module stores authored metadata only.
 */

import type { ContentPackageVersionId } from "../shared-kernel/ids";
import type { CoachingInterventionDefinition } from "../simulation/content/business-case/canonical-contracts";
import type { ConditionExpression } from "../simulation/content/business-case/conditions";
import type { CoachingInterventionType } from "../simulation/content/business-case/canonical-contracts";
import type { ExperienceLevel } from "../simulation/content/business-case/enums";
import type { ConsequenceEffect } from "../simulation/content/business-case/effects";
import type { BusinessCaseContentPackage } from "../simulation/content/business-case/package";
import {
  resolveLocalizedText,
  type LocalizedText,
} from "../simulation/content/business-case/localized";

export interface LearningSafeCompetency {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly weight: number;
}

export interface LearningSafeAchievement {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly awardedWhen: ConditionExpression;
}

export interface LearningSafeCoachingIntervention {
  readonly id: string;
  readonly chapterId: string | null;
  readonly interventionType: CoachingInterventionType;
  readonly audience: readonly ExperienceLevel[];
  readonly title: string;
  readonly guidance: string;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedActivityIds: readonly string[];
  readonly triggerWhen: ConditionExpression;
}

export interface LearningSafeActivityMeta {
  readonly id: string;
  readonly chapterId: string;
  readonly activityType: string;
  readonly required: boolean;
  readonly title: string;
  readonly relatedDecisionIds: readonly string[];
}

export interface ConsequenceLearningSignalPayload {
  readonly competencyKey: string;
  readonly delta: number;
  readonly signalType: string;
  readonly reasonCode: string;
}

export interface LearningSafeChapter {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly requiredDecisionIds: readonly string[];
  readonly requiredActivityIds: readonly string[];
}

export interface LearningSafeContent {
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly competencies: readonly LearningSafeCompetency[];
  readonly achievements: readonly LearningSafeAchievement[];
  readonly coachingInterventions: readonly LearningSafeCoachingIntervention[];
  readonly activities: readonly LearningSafeActivityMeta[];
  readonly consequenceLearningSignals: Readonly<
    Record<string, ConsequenceLearningSignalPayload>
  >;
  readonly chapters: readonly LearningSafeChapter[];
}

const resolveText = (
  text: LocalizedText,
  locale: string,
  fallbackLocale: string,
): string =>
  resolveLocalizedText(text, locale, fallbackLocale) ??
  Object.values(text.values).find((v) => v.trim().length > 0) ??
  "";

const isLearningSignalEffect = (
  effect: ConsequenceEffect,
): effect is Extract<
  ConsequenceEffect,
  { readonly kind: "emit_competency_signal" | "emit_assessment_signal" }
> =>
  effect.kind === "emit_competency_signal" ||
  effect.kind === "emit_assessment_signal";

const buildConsequenceLearningSignals = (
  pkg: BusinessCaseContentPackage,
): Readonly<Record<string, ConsequenceLearningSignalPayload>> => {
  const signals: Record<string, ConsequenceLearningSignalPayload> = {};
  for (const consequence of pkg.consequences) {
    for (const [index, effect] of consequence.effects.entries()) {
      if (!isLearningSignalEffect(effect)) {
        continue;
      }
      const runtimeDefinitionId = `${consequence.id}:effect:${index}`;
      signals[runtimeDefinitionId] = {
        competencyKey: effect.competencyId,
        delta: effect.delta,
        signalType: "competency_delta",
        reasonCode: "CONTENT_COMPETENCY_SIGNAL",
      };
    }
  }
  return signals;
};

const mapCoachingInterventions = (
  interventions: readonly CoachingInterventionDefinition[],
  locale: string,
  fallbackLocale: string,
): readonly LearningSafeCoachingIntervention[] =>
  interventions.map((intervention) => ({
    id: intervention.id,
    chapterId: intervention.chapterId,
    interventionType: intervention.interventionType,
    audience: [...intervention.audience],
    title: resolveText(intervention.title, locale, fallbackLocale),
    guidance: resolveText(intervention.guidance, locale, fallbackLocale),
    relatedDecisionIds: [...intervention.relatedDecisionIds],
    relatedActivityIds: [...intervention.relatedActivityIds],
    triggerWhen: intervention.triggerWhen,
  }));

export const mapBusinessCasePackageToLearningSafeContent = (
  pkg: BusinessCaseContentPackage,
  contentPackageVersionId: ContentPackageVersionId,
  locale: string = pkg.manifest.defaultLocale,
  coachingInterventions: readonly CoachingInterventionDefinition[] = [],
): LearningSafeContent => {
  const fallbackLocale = pkg.manifest.defaultLocale;

  const competencies: LearningSafeCompetency[] =
    pkg.assessment.competencies.map((competency) => ({
      id: competency.id,
      title: resolveText(competency.title, locale, fallbackLocale),
      description: resolveText(competency.description, locale, fallbackLocale),
      weight: pkg.assessment.weights[competency.id] ?? 0,
    }));

  const achievements: LearningSafeAchievement[] = pkg.achievements.map(
    (achievement) => ({
      id: achievement.id,
      title: resolveText(achievement.title, locale, fallbackLocale),
      description: resolveText(achievement.description, locale, fallbackLocale),
      awardedWhen: achievement.awardedWhen,
    }),
  );

  const activities: LearningSafeActivityMeta[] = pkg.activities.map(
    (activity) => ({
      id: activity.id,
      chapterId: activity.chapterId,
      activityType: activity.activityType,
      required: activity.required,
      title: resolveText(activity.title, locale, fallbackLocale),
      relatedDecisionIds: [...activity.relatedDecisionIds],
    }),
  );

  const chapters: LearningSafeChapter[] = [...pkg.chapters]
    .sort((a, b) =>
      a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id),
    )
    .map((chapter) => ({
      id: chapter.id,
      order: chapter.order,
      title: resolveText(chapter.title, locale, fallbackLocale),
      requiredDecisionIds: [...chapter.requiredDecisionIds],
      requiredActivityIds: [...chapter.requiredActivityIds],
    }));

  return {
    contentPackageVersionId,
    competencies,
    achievements,
    coachingInterventions: mapCoachingInterventions(
      coachingInterventions,
      locale,
      fallbackLocale,
    ),
    activities,
    consequenceLearningSignals: buildConsequenceLearningSignals(pkg),
    chapters,
  };
};

/** Empty learning-safe content for scaffold/test fixtures. */
export const emptyLearningSafeContent = (
  contentPackageVersionId: ContentPackageVersionId,
): LearningSafeContent => ({
  contentPackageVersionId,
  competencies: [],
  achievements: [],
  coachingInterventions: [],
  activities: [],
  consequenceLearningSignals: {},
  chapters: [],
});
