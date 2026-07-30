/**
 * BC-006 Workstream 6 — practice activity helpers.
 */

import type { SimulationRunReadSnapshot } from "../projection/read-snapshot";
import type { LearningSafeActivityMeta, LearningSafeContent } from "./content";

export const isPracticeActivityType = (activityType: string): boolean =>
  activityType === "practice";

export const filterPracticeActivities = (
  learningContent: LearningSafeContent,
): readonly LearningSafeActivityMeta[] =>
  learningContent.activities.filter((activity) =>
    isPracticeActivityType(activity.activityType),
  );

export interface PracticeActivityItem {
  readonly activityId: string;
  readonly chapterId: string;
  readonly title: string;
  readonly required: boolean;
  readonly status: "completed" | "incomplete";
}

const practiceItems = (
  snapshot: SimulationRunReadSnapshot,
  learningContent: LearningSafeContent,
  status: "completed" | "incomplete",
): readonly PracticeActivityItem[] => {
  const completedIds = new Set<string>(
    snapshot.activities
      .filter((activity) => activity.status === "completed")
      .map((activity) => activity.activityId),
  );

  return filterPracticeActivities(learningContent)
    .filter((activity) =>
      status === "completed"
        ? completedIds.has(activity.id)
        : !completedIds.has(activity.id),
    )
    .map((activity) => ({
      activityId: activity.id,
      chapterId: activity.chapterId,
      title: activity.title,
      required: activity.required,
      status,
    }))
    .sort((left, right) => left.activityId.localeCompare(right.activityId));
};

export const listCompletedPracticeItems = (
  snapshot: SimulationRunReadSnapshot,
  learningContent: LearningSafeContent,
): readonly PracticeActivityItem[] =>
  practiceItems(snapshot, learningContent, "completed");

export const listIncompletePracticeItems = (
  snapshot: SimulationRunReadSnapshot,
  learningContent: LearningSafeContent,
): readonly PracticeActivityItem[] =>
  practiceItems(snapshot, learningContent, "incomplete");
