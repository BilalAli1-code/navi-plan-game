/**
 * Allowlisted consequence-effect families (BC-003).
 *
 * Effects are declarative. Application maps them onto authoritative commands /
 * Domain events — never onto projections or arbitrary code.
 */

import type {
  ActivityId,
  ChapterId,
  DecisionId,
  DocumentId,
  MeetingDefinitionId,
  MetricKey,
  NotificationId,
  StakeholderId,
} from "../../../shared-kernel/ids";
import type {
  CompetencyId,
  ContentEventId,
  MessageDefinitionId,
  NarrativeFlag,
} from "./ids";

/** Authored content timing (distinct from runtime ConsequenceTiming string union). */
export type ContentConsequenceTiming =
  | { readonly kind: "immediate" }
  | {
      readonly kind: "delayed";
      readonly afterSimulationDays: number;
      readonly triggerEventId: ContentEventId | null;
    };

export type ConsequenceEffect =
  | {
      readonly kind: "change_project_metric";
      readonly metricKey: MetricKey;
      readonly delta: number;
    }
  | {
      readonly kind: "emit_assessment_signal";
      readonly competencyId: CompetencyId;
      readonly delta: number;
    }
  | {
      readonly kind: "emit_competency_signal";
      readonly competencyId: CompetencyId;
      readonly delta: number;
    }
  | {
      readonly kind: "change_stakeholder_signal";
      readonly stakeholderId: StakeholderId;
      readonly delta: number;
    }
  | {
      readonly kind: "make_message_available";
      readonly messageId: MessageDefinitionId;
    }
  | {
      readonly kind: "schedule_message";
      readonly messageId: MessageDefinitionId;
      readonly afterSimulationDays: number;
    }
  | {
      readonly kind: "make_meeting_available";
      readonly meetingId: MeetingDefinitionId;
    }
  | {
      readonly kind: "schedule_meeting";
      readonly meetingId: MeetingDefinitionId;
      readonly afterSimulationDays: number;
    }
  | {
      readonly kind: "make_document_available";
      readonly documentId: DocumentId;
    }
  | {
      readonly kind: "make_notification_available";
      readonly notificationId: NotificationId;
    }
  | {
      readonly kind: "initialize_activity";
      readonly activityId: ActivityId;
    }
  | {
      readonly kind: "complete_activity";
      readonly activityId: ActivityId;
    }
  | {
      readonly kind: "make_decision_available";
      readonly decisionId: DecisionId;
    }
  | {
      readonly kind: "set_case_flag";
      readonly flag: NarrativeFlag;
      readonly value: boolean;
    }
  | {
      readonly kind: "unlock_chapter";
      readonly chapterId: ChapterId;
    }
  | {
      readonly kind: "schedule_crisis";
      readonly crisisId: string;
      readonly afterSimulationDays: number;
    }
  | {
      readonly kind: "transition_project_state";
      readonly status: string;
    }
  | {
      readonly kind: "record_narrative_flag";
      readonly flag: NarrativeFlag;
      readonly value: boolean;
    };

export const CONSEQUENCE_EFFECT_KINDS = [
  "change_project_metric",
  "emit_assessment_signal",
  "emit_competency_signal",
  "change_stakeholder_signal",
  "make_message_available",
  "schedule_message",
  "make_meeting_available",
  "schedule_meeting",
  "make_document_available",
  "make_notification_available",
  "initialize_activity",
  "complete_activity",
  "make_decision_available",
  "set_case_flag",
  "unlock_chapter",
  "schedule_crisis",
  "transition_project_state",
  "record_narrative_flag",
] as const;

export type ConsequenceEffectKind = (typeof CONSEQUENCE_EFFECT_KINDS)[number];
