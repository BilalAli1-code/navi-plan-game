/**
 * Shared learner-safe learning projection fields (BC-006 Workstream 6).
 */

export type LearningProjectionXpAvailability = "unavailable";

export type LearningProjectionXpUnavailableReason = "xp_amounts_not_authored";

/** XP summary — amounts unavailable until content authors values. */
export interface LearningProjectionXpSummary {
  readonly availability: LearningProjectionXpAvailability;
  readonly reason: LearningProjectionXpUnavailableReason;
  readonly totalXp: 0;
}
