/**
 * BC-006 Workstream 6 — XP awards (unavailable until content authors amounts).
 *
 * XP amounts are not present in current business-case content. This module
 * defines the future award record shape and returns an explicit unavailable
 * result rather than inventing point values.
 */

import type { ExperienceLevel } from "../simulation/content/business-case/enums";
import type { SimulationRunReadSnapshot } from "../projection/read-snapshot";
import type { LearningSafeContent } from "./content";

export interface XpAwardRecord {
  readonly awardId: string;
  readonly xpAmount: number;
  readonly reasonCode: string;
  readonly sourceEvidenceIds: readonly string[];
  readonly ruleVersion: string;
}

export type XpAwardAvailability = "unavailable";

export type XpAwardUnavailableReason = "xp_amounts_not_authored";

export interface XpAwardEvaluation {
  readonly availability: XpAwardAvailability;
  readonly reason: XpAwardUnavailableReason;
  readonly awards: readonly XpAwardRecord[];
  readonly totalXp: 0;
}

export interface EvaluateXpAwardsInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly learningContent: LearningSafeContent;
  readonly experienceLevel: ExperienceLevel | null;
}

export const evaluateXpAwards = (
  input: EvaluateXpAwardsInput,
): XpAwardEvaluation => {
  void input.snapshot;
  void input.learningContent;
  void input.experienceLevel;
  return {
    availability: "unavailable",
    reason: "xp_amounts_not_authored",
    awards: [],
    totalXp: 0,
  };
};
