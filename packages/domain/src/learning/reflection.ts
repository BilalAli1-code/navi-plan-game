/**
 * BC-006 Workstream 6 — reflection activity helpers.
 */

import type { SimulationRunReadSnapshot } from "../projection/read-snapshot";
import type { LearningSafeActivityMeta, LearningSafeContent } from "./content";

export const isReflectionActivityType = (activityType: string): boolean =>
  activityType === "reflection";

export const filterReflectionActivities = (
  learningContent: LearningSafeContent,
): readonly LearningSafeActivityMeta[] =>
  learningContent.activities.filter((activity) =>
    isReflectionActivityType(activity.activityType),
  );

export interface ReflectionActivityItem {
  readonly activityId: string;
  readonly chapterId: string;
  readonly title: string;
  readonly required: boolean;
  readonly status: "completed" | "incomplete";
}

const reflectionItems = (
  snapshot: SimulationRunReadSnapshot,
  learningContent: LearningSafeContent,
  status: "completed" | "incomplete",
): readonly ReflectionActivityItem[] => {
  const completedIds = new Set<string>(
    snapshot.activities
      .filter((activity) => activity.status === "completed")
      .map((activity) => activity.activityId),
  );

  return filterReflectionActivities(learningContent)
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

export const listCompletedReflectionItems = (
  snapshot: SimulationRunReadSnapshot,
  learningContent: LearningSafeContent,
): readonly ReflectionActivityItem[] =>
  reflectionItems(snapshot, learningContent, "completed");

export const listIncompleteReflectionItems = (
  snapshot: SimulationRunReadSnapshot,
  learningContent: LearningSafeContent,
): readonly ReflectionActivityItem[] =>
  reflectionItems(snapshot, learningContent, "incomplete");
