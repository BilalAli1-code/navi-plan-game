/**
 * Pure ConditionExpression evaluation against authoritative simulation facts.
 *
 * Deterministic. No wall clock, randomness, AI, network, or projection reads.
 */

import type { ConditionExpression } from "./conditions";

export interface ConditionEvaluationFacts {
  readonly completedChapterIds: ReadonlySet<string>;
  readonly currentChapterId: string | null;
  readonly initiallyUnlockedChapterIds: ReadonlySet<string>;
  readonly submittedDecisionIds: ReadonlySet<string>;
  readonly resolvedDecisionIds: ReadonlySet<string>;
  readonly selectedOptionsByDecisionId: ReadonlyMap<string, string>;
  readonly completedActivityIds: ReadonlySet<string>;
  readonly activeActivityIds: ReadonlySet<string>;
  readonly completedMeetingIds: ReadonlySet<string>;
  readonly availableDocumentIds: ReadonlySet<string>;
  readonly deliveredMessageIds: ReadonlySet<string>;
  readonly metricValues: ReadonlyMap<string, number>;
  readonly narrativeFlags: ReadonlyMap<string, boolean>;
  readonly experienceLevel: string | null;
}

const compareNumber = (
  left: number,
  operator: "eq" | "neq" | "gte" | "lte" | "gt" | "lt",
  right: number,
): boolean => {
  switch (operator) {
    case "eq":
      return left === right;
    case "neq":
      return left !== right;
    case "gte":
      return left >= right;
    case "lte":
      return left <= right;
    case "gt":
      return left > right;
    case "lt":
      return left < right;
  }
};

const chapterMatchesStatus = (
  facts: ConditionEvaluationFacts,
  chapterId: string,
  status: string,
): boolean => {
  if (status === "completed") {
    return facts.completedChapterIds.has(chapterId);
  }
  if (status === "unlocked" || status === "active" || status === "available") {
    if (facts.currentChapterId === chapterId) {
      return true;
    }
    if (facts.initiallyUnlockedChapterIds.has(chapterId)) {
      return (
        facts.currentChapterId === null ||
        facts.currentChapterId === chapterId ||
        facts.completedChapterIds.has(chapterId)
      );
    }
    return false;
  }
  return false;
};

const decisionMatchesStatus = (
  facts: ConditionEvaluationFacts,
  decisionId: string,
  status: string,
): boolean => {
  if (status === "resolved") {
    return facts.resolvedDecisionIds.has(decisionId);
  }
  if (status === "submitted") {
    return facts.submittedDecisionIds.has(decisionId);
  }
  if (status === "available" || status === "pending") {
    return !facts.submittedDecisionIds.has(decisionId);
  }
  return false;
};

const activityMatchesStatus = (
  facts: ConditionEvaluationFacts,
  activityId: string,
  status: string,
): boolean => {
  if (status === "completed") {
    return facts.completedActivityIds.has(activityId);
  }
  if (status === "active" || status === "available") {
    return facts.activeActivityIds.has(activityId);
  }
  return false;
};

const meetingMatchesStatus = (
  facts: ConditionEvaluationFacts,
  meetingId: string,
  status: string,
): boolean => {
  if (status === "completed") {
    return facts.completedMeetingIds.has(meetingId);
  }
  return false;
};

/**
 * Evaluate an authored condition against authoritative facts.
 * Unknown or unsupported statuses fail closed (return false).
 */
export const evaluateConditionExpression = (
  condition: ConditionExpression,
  facts: ConditionEvaluationFacts,
): boolean => {
  switch (condition.kind) {
    case "always":
      return true;
    case "all":
      return condition.conditions.every((entry) =>
        evaluateConditionExpression(entry, facts),
      );
    case "any":
      return condition.conditions.some((entry) =>
        evaluateConditionExpression(entry, facts),
      );
    case "not":
      return !evaluateConditionExpression(condition.condition, facts);
    case "chapter_status":
      return chapterMatchesStatus(facts, condition.chapterId, condition.status);
    case "activity_status":
      return activityMatchesStatus(
        facts,
        condition.activityId,
        condition.status,
      );
    case "decision_status":
      return decisionMatchesStatus(
        facts,
        condition.decisionId,
        condition.status,
      );
    case "decision_option_selected":
      return (
        facts.selectedOptionsByDecisionId.get(condition.decisionId) ===
        condition.optionId
      );
    case "meeting_status":
      return meetingMatchesStatus(facts, condition.meetingId, condition.status);
    case "document_available":
      return facts.availableDocumentIds.has(condition.documentId);
    case "message_delivered":
      return facts.deliveredMessageIds.has(condition.messageId);
    case "metric_compare": {
      const value = facts.metricValues.get(condition.metricKey);
      if (value === undefined) {
        return false;
      }
      return compareNumber(value, condition.operator, condition.value);
    }
    case "narrative_flag":
      return facts.narrativeFlags.get(condition.flag) === condition.value;
    case "experience_level":
      return facts.experienceLevel === condition.level;
    default: {
      const _exhaustive: never = condition;
      void _exhaustive;
      return false;
    }
  }
};
