/**
 * BC-006 Workstream 6 — deterministic coaching intervention selection.
 *
 * Selectors are pure and deterministic. AI must never mutate authority;
 * use `buildDeterministicCoachingFallback` for learner-safe plain text.
 */

import { evaluateConditionExpression } from "../simulation/content/business-case/evaluate-condition";
import type { CoachingInterventionType } from "../simulation/content/business-case/canonical-contracts";
import type { ExperienceLevel } from "../simulation/content/business-case/enums";
import type { SimulationRunReadSnapshot } from "../projection/read-snapshot";
import { buildLearningConditionFacts } from "./condition-facts";
import type { LearningSafeContent } from "./content";

export type CoachingTimingHint =
  | "at_chapter_start"
  | "before_decision"
  | "after_decision"
  | "when_struggling"
  | "at_chapter_end";

export interface CoachingInstruction {
  readonly id: string;
  readonly interventionType: CoachingInterventionType;
  readonly chapterId: string | null;
  readonly title: string;
  readonly guidance: string;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedActivityIds: readonly string[];
  readonly timingHint: CoachingTimingHint;
}

const INTERVENTION_TYPE_ORDER: readonly CoachingInterventionType[] = [
  "orientation",
  "hint",
  "reflection_prompt",
  "remediation",
  "debrief",
];

const timingHintForType = (
  interventionType: CoachingInterventionType,
): CoachingTimingHint => {
  switch (interventionType) {
    case "orientation":
      return "at_chapter_start";
    case "hint":
      return "before_decision";
    case "reflection_prompt":
      return "after_decision";
    case "remediation":
      return "when_struggling";
    case "debrief":
      return "at_chapter_end";
  }
};

export interface SelectCoachingInterventionsInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly learningContent: LearningSafeContent;
  readonly experienceLevel: ExperienceLevel | null;
  readonly acknowledgedInterventionIds?: readonly string[];
}

export const selectCoachingInterventions = (
  input: SelectCoachingInterventionsInput,
): readonly CoachingInstruction[] => {
  const facts = buildLearningConditionFacts(
    input.snapshot,
    input.experienceLevel,
  );
  const acknowledged = new Set(input.acknowledgedInterventionIds ?? []);
  const chapterOrderById = new Map(
    input.learningContent.chapters.map((chapter) => [
      chapter.id,
      chapter.order,
    ]),
  );

  const eligible = input.learningContent.coachingInterventions.filter(
    (intervention) => {
      if (acknowledged.has(intervention.id)) {
        return false;
      }
      if (
        input.experienceLevel !== null &&
        !intervention.audience.includes(input.experienceLevel)
      ) {
        return false;
      }
      return evaluateConditionExpression(intervention.triggerWhen, facts);
    },
  );

  return eligible
    .map((intervention) => ({
      id: intervention.id,
      interventionType: intervention.interventionType,
      chapterId: intervention.chapterId,
      title: intervention.title,
      guidance: intervention.guidance,
      relatedDecisionIds: [...intervention.relatedDecisionIds],
      relatedActivityIds: [...intervention.relatedActivityIds],
      timingHint: timingHintForType(intervention.interventionType),
      chapterOrder:
        intervention.chapterId === null
          ? Number.MAX_SAFE_INTEGER
          : (chapterOrderById.get(intervention.chapterId) ??
            Number.MAX_SAFE_INTEGER),
      typeOrder: INTERVENTION_TYPE_ORDER.indexOf(intervention.interventionType),
    }))
    .sort((left, right) => {
      if (left.chapterOrder !== right.chapterOrder) {
        return left.chapterOrder - right.chapterOrder;
      }
      if (left.typeOrder !== right.typeOrder) {
        return left.typeOrder - right.typeOrder;
      }
      return left.id.localeCompare(right.id);
    })
    .map(
      ({
        chapterOrder: _chapterOrder,
        typeOrder: _typeOrder,
        ...instruction
      }) => instruction,
    );
};

/** Plain learner-safe coaching text without AI generation. */
export const buildDeterministicCoachingFallback = (
  instruction: CoachingInstruction,
): string => `${instruction.title}\n\n${instruction.guidance}`;
