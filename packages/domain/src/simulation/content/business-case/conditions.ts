/**
 * Declarative allowlisted condition AST (BC-003).
 *
 * Pure and deterministic. No eval, SQL, or external calls.
 */

import type {
  ActivityId,
  ChapterId,
  DecisionId,
  DecisionOptionId,
  DocumentId,
  MeetingDefinitionId,
  MetricKey,
} from "../../../shared-kernel/ids";
import type { ExperienceLevel } from "./enums";
import type { MessageDefinitionId, NarrativeFlag } from "./ids";

export type ComparisonOperator = "eq" | "neq" | "gte" | "lte" | "gt" | "lt";

export type ConditionExpression =
  | { readonly kind: "always" }
  | {
      readonly kind: "all";
      readonly conditions: readonly ConditionExpression[];
    }
  | {
      readonly kind: "any";
      readonly conditions: readonly ConditionExpression[];
    }
  | { readonly kind: "not"; readonly condition: ConditionExpression }
  | {
      readonly kind: "chapter_status";
      readonly chapterId: ChapterId;
      readonly status: string;
    }
  | {
      readonly kind: "activity_status";
      readonly activityId: ActivityId;
      readonly status: string;
    }
  | {
      readonly kind: "decision_status";
      readonly decisionId: DecisionId;
      readonly status: string;
    }
  | {
      readonly kind: "decision_option_selected";
      readonly decisionId: DecisionId;
      readonly optionId: DecisionOptionId;
    }
  | {
      readonly kind: "meeting_status";
      readonly meetingId: MeetingDefinitionId;
      readonly status: string;
    }
  | { readonly kind: "document_available"; readonly documentId: DocumentId }
  | {
      readonly kind: "message_delivered";
      readonly messageId: MessageDefinitionId;
    }
  | {
      readonly kind: "metric_compare";
      readonly metricKey: MetricKey;
      readonly operator: ComparisonOperator;
      readonly value: number;
    }
  | {
      readonly kind: "narrative_flag";
      readonly flag: NarrativeFlag;
      readonly value: boolean;
    }
  | { readonly kind: "experience_level"; readonly level: ExperienceLevel };

export const CONDITION_KINDS = [
  "always",
  "all",
  "any",
  "not",
  "chapter_status",
  "activity_status",
  "decision_status",
  "decision_option_selected",
  "meeting_status",
  "document_available",
  "message_delivered",
  "metric_compare",
  "narrative_flag",
  "experience_level",
] as const;

export type ConditionKind = (typeof CONDITION_KINDS)[number];

export const always: ConditionExpression = { kind: "always" };
