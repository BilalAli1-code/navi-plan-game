import type {
  ConsequenceDefinitionId,
  LearnerMessageDefinitionId,
  MetricKey,
  StakeholderId,
} from "../../shared-kernel/ids";
import type { LearnerMessageSenderDefinition } from "./learner-message-definition";

/**
 * Content-authored consequence contracts (PS-ROADMAP-005).
 *
 * Immutable inputs only — no executable callbacks. Unsupported types fail closed
 * at resolution time before authoritative mutation.
 */

export const consequenceTimings = ["immediate", "delayed"] as const;
export type ConsequenceTiming = (typeof consequenceTimings)[number];

export const isConsequenceTiming = (
  value: string,
): value is ConsequenceTiming =>
  (consequenceTimings as readonly string[]).includes(value);

/**
 * Supported consequence type names for the current authoritative state surface.
 * Unknown values are rejected as CONSEQUENCE_TYPE_UNSUPPORTED.
 */
export const supportedConsequenceTypes = [
  "project_metric_delta",
  "project_state_transition",
  "schedule_event",
  "learning_signal",
  "stakeholder_signal",
  "analytics_signal",
  "deliver_learner_message",
] as const;

export type SupportedConsequenceType =
  (typeof supportedConsequenceTypes)[number];

export const isSupportedConsequenceType = (
  value: string,
): value is SupportedConsequenceType =>
  (supportedConsequenceTypes as readonly string[]).includes(value);

/** Generic project-delivery phases (not business-case-specific). */
export const projectStateStatuses = [
  "initiated",
  "planning",
  "executing",
  "closing",
  "closed",
] as const;

export type ProjectStateStatus = (typeof projectStateStatuses)[number];

export const isProjectStateStatus = (
  value: string,
): value is ProjectStateStatus =>
  (projectStateStatuses as readonly string[]).includes(value);

export interface ProjectMetricDeltaPayload {
  readonly metricKey: MetricKey;
  readonly delta: number;
  readonly reasonCode: string;
}

export interface ProjectStateTransitionPayload {
  readonly nextStatus: ProjectStateStatus;
  readonly reasonCode: string;
}

export interface ScheduleEventPayload {
  /** Relative delay in whole milliseconds from resolution time. */
  readonly delayMs: number;
  readonly reasonCode: string;
  /**
   * BC-006 W3 provenance retained for Workstream 4 delayed release.
   * Optional for scaffold/legacy definitions.
   */
  readonly sourceDecisionId?: string | null;
  readonly sourceChapterId?: string | null;
  readonly targetChapterId?: string | null;
  readonly deferredEffectKind?: string | null;
  /** Deterministic JSON snapshot of the deferred authored effect payload. */
  readonly deferredEffectPayload?: string | null;
  /** W4 trigger classification (chapter_entry/exit/...). */
  readonly triggerType?: string | null;
  readonly priority?: number;
}

export interface LearningSignalPayload {
  readonly signalType: string;
  readonly competencyKey: string;
  readonly delta: number;
  readonly reasonCode: string;
}

export interface StakeholderSignalPayload {
  readonly signalType: string;
  readonly stakeholderId: StakeholderId;
  readonly sentimentDelta: number;
  readonly reasonCode: string;
}

export interface AnalyticsSignalPayload {
  readonly signalType: string;
  readonly dimension: string;
  readonly value: number;
  readonly reasonCode: string;
}

/**
 * System-delivered learner Inbox message content (learner-safe snapshot).
 * Distinct from Stakeholder Chat / SendStakeholderMessage and from the
 * DeliverLearnerMessage simulation command payload.
 */
export interface DeliverLearnerMessageConsequencePayload {
  readonly messageDefinitionId: LearnerMessageDefinitionId;
  readonly definitionVersion: string;
  readonly sender: LearnerMessageSenderDefinition;
  readonly subject: string;
  readonly body: string;
}

export type ConsequencePayload =
  | ProjectMetricDeltaPayload
  | ProjectStateTransitionPayload
  | ScheduleEventPayload
  | LearningSignalPayload
  | StakeholderSignalPayload
  | AnalyticsSignalPayload
  | DeliverLearnerMessageConsequencePayload;

export type ConsequenceTarget =
  | { readonly kind: "project_metric"; readonly metricKey: MetricKey }
  | { readonly kind: "project_state" }
  | { readonly kind: "scheduled_event" }
  | { readonly kind: "learning_context" }
  | {
      readonly kind: "stakeholder_context";
      readonly stakeholderId: StakeholderId;
    }
  | { readonly kind: "analytics_context" }
  | { readonly kind: "learner_message" };

export interface ProjectMetricDeltaConsequenceDefinition {
  readonly id: ConsequenceDefinitionId;
  readonly type: "project_metric_delta";
  readonly timing: "immediate";
  readonly target: {
    readonly kind: "project_metric";
    readonly metricKey: MetricKey;
  };
  readonly payload: ProjectMetricDeltaPayload;
}

export interface ProjectStateTransitionConsequenceDefinition {
  readonly id: ConsequenceDefinitionId;
  readonly type: "project_state_transition";
  readonly timing: "immediate";
  readonly target: { readonly kind: "project_state" };
  readonly payload: ProjectStateTransitionPayload;
}

export interface ScheduleEventConsequenceDefinition {
  readonly id: ConsequenceDefinitionId;
  readonly type: "schedule_event";
  readonly timing: "delayed";
  readonly target: { readonly kind: "scheduled_event" };
  readonly payload: ScheduleEventPayload;
}

export interface LearningSignalConsequenceDefinition {
  readonly id: ConsequenceDefinitionId;
  readonly type: "learning_signal";
  readonly timing: "immediate";
  readonly target: { readonly kind: "learning_context" };
  readonly payload: LearningSignalPayload;
}

export interface StakeholderSignalConsequenceDefinition {
  readonly id: ConsequenceDefinitionId;
  readonly type: "stakeholder_signal";
  readonly timing: "immediate";
  readonly target: {
    readonly kind: "stakeholder_context";
    readonly stakeholderId: StakeholderId;
  };
  readonly payload: StakeholderSignalPayload;
}

export interface AnalyticsSignalConsequenceDefinition {
  readonly id: ConsequenceDefinitionId;
  readonly type: "analytics_signal";
  readonly timing: "immediate";
  readonly target: { readonly kind: "analytics_context" };
  readonly payload: AnalyticsSignalPayload;
}

export interface DeliverLearnerMessageConsequenceDefinition {
  readonly id: ConsequenceDefinitionId;
  readonly type: "deliver_learner_message";
  readonly timing: "immediate";
  readonly target: { readonly kind: "learner_message" };
  readonly payload: DeliverLearnerMessageConsequencePayload;
}

export type ConsequenceDefinition =
  | ProjectMetricDeltaConsequenceDefinition
  | ProjectStateTransitionConsequenceDefinition
  | ScheduleEventConsequenceDefinition
  | LearningSignalConsequenceDefinition
  | StakeholderSignalConsequenceDefinition
  | AnalyticsSignalConsequenceDefinition
  | DeliverLearnerMessageConsequenceDefinition;
