import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  ConsequenceDefinitionId,
  ConsequenceId,
  ContentPackageVersionId,
  DecisionRecordId,
  ResolverVersion,
  ScheduledEventId,
  SimulationRunId,
  TenantId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";

/**
 * Runtime-owned delayed schedule instruction (PS-ROADMAP-005 / BC-006 W3–W4).
 *
 * W3 creates pending schedules with provenance. W4 advances lifecycle:
 * pending|scheduled → eligible → applied, or terminal cancelled/expired/superseded.
 *
 * Legacy `pending` is a synonym of `scheduled` for schema-8 compatibility.
 */

export const scheduledEventStatuses = [
  "pending",
  "scheduled",
  "eligible",
  "applied",
  "cancelled",
  "expired",
  "superseded",
] as const;
export type ScheduledEventStatus = (typeof scheduledEventStatuses)[number];

export const isScheduledEventStatus = (
  value: string,
): value is ScheduledEventStatus =>
  (scheduledEventStatuses as readonly string[]).includes(value);

export const scheduleTriggerTypes = [
  "chapter_entry",
  "chapter_exit",
  "event",
  "metric_threshold",
  "completion",
  "manual",
] as const;
export type ScheduleTriggerType = (typeof scheduleTriggerTypes)[number];

export const isScheduleTriggerType = (
  value: string,
): value is ScheduleTriggerType =>
  (scheduleTriggerTypes as readonly string[]).includes(value);

/** Effect-ordering categories (spec § deterministic ordering). */
export const scheduleOrderCategories = [
  "safety_compliance",
  "chapter_blocking",
  "risk_issue",
  "metric",
  "stakeholder",
  "content_release",
  "learning",
  "ending",
] as const;
export type ScheduleOrderCategory = (typeof scheduleOrderCategories)[number];

export interface ScheduledEventInstruction {
  readonly id: ScheduledEventId;
  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly originConsequenceId: ConsequenceId;
  readonly consequenceDefinitionId: ConsequenceDefinitionId;
  readonly dueAt: IsoTimestamp;
  readonly delayMs: number;
  readonly reasonCode: string;
  readonly createdAt: IsoTimestamp;
  readonly status: ScheduledEventStatus;
  readonly resolverVersion: ResolverVersion;
  readonly sourceDecisionId: string | null;
  readonly sourceChapterId: string | null;
  readonly targetChapterId: string | null;
  readonly deferredEffectKind: string | null;
  readonly deferredEffectPayload: string | null;
  /** W4 trigger classification. Null defaults to chapter_exit of source. */
  readonly triggerType: ScheduleTriggerType | null;
  /** Lower number runs first within a category. */
  readonly priority: number;
  readonly orderCategory: ScheduleOrderCategory;
  readonly eligibleAtSequence: number | null;
  readonly appliedAtSequence: number | null;
  readonly terminalReason: string | null;
  readonly supersededById: string | null;
}

export interface CreateScheduledEventInstructionInput {
  readonly id: ScheduledEventId;
  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly originConsequenceId: ConsequenceId;
  readonly consequenceDefinitionId: ConsequenceDefinitionId;
  readonly dueAt: IsoTimestamp;
  readonly delayMs: number;
  readonly reasonCode: string;
  readonly createdAt: IsoTimestamp;
  readonly resolverVersion: ResolverVersion;
  readonly sourceDecisionId?: string | null;
  readonly sourceChapterId?: string | null;
  readonly targetChapterId?: string | null;
  readonly deferredEffectKind?: string | null;
  readonly deferredEffectPayload?: string | null;
  readonly triggerType?: ScheduleTriggerType | null;
  readonly priority?: number;
  readonly orderCategory?: ScheduleOrderCategory;
  readonly status?: ScheduledEventStatus;
  readonly eligibleAtSequence?: number | null;
  readonly appliedAtSequence?: number | null;
  readonly terminalReason?: string | null;
  readonly supersededById?: string | null;
}

export const isScheduleAwaitingEligibility = (
  status: ScheduledEventStatus,
): boolean => status === "pending" || status === "scheduled";

export const isScheduleTerminal = (status: ScheduledEventStatus): boolean =>
  status === "applied" ||
  status === "cancelled" ||
  status === "expired" ||
  status === "superseded";

export const orderCategoryForDeferredEffect = (
  deferredEffectKind: string | null,
): ScheduleOrderCategory => {
  switch (deferredEffectKind) {
    case "change_project_metric":
      return "metric";
    case "change_stakeholder_signal":
      return "stakeholder";
    case "emit_competency_signal":
    case "emit_assessment_signal":
      return "learning";
    case "unlock_chapter":
    case "make_decision_available":
      return "chapter_blocking";
    case "schedule_crisis":
      return "safety_compliance";
    case "make_message_available":
    case "make_meeting_available":
    case "make_document_available":
    case "make_notification_available":
    case "initialize_activity":
    case "schedule_message":
    case "schedule_meeting":
      return "content_release";
    case "set_case_flag":
    case "record_narrative_flag":
      return "risk_issue";
    default:
      return "content_release";
  }
};

export const createScheduledEventInstruction = (
  input: CreateScheduledEventInstructionInput,
): Result<ScheduledEventInstruction, RuleViolationError> => {
  if (
    !Number.isInteger(input.delayMs) ||
    input.delayMs < 0 ||
    input.reasonCode.trim().length === 0
  ) {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        "Scheduled event requires non-negative integer delayMs and reasonCode.",
        { delayMs: input.delayMs, reasonCode: input.reasonCode },
      ),
    );
  }
  const status = input.status ?? "pending";
  if (!isScheduledEventStatus(status)) {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        `Unknown scheduled event status '${String(status)}'.`,
      ),
    );
  }
  const priority = input.priority ?? 100;
  if (!Number.isInteger(priority)) {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        "Scheduled event priority must be an integer.",
      ),
    );
  }
  const orderCategory =
    input.orderCategory ??
    orderCategoryForDeferredEffect(input.deferredEffectKind ?? null);
  return ok({
    id: input.id,
    tenantId: input.tenantId,
    simulationRunId: input.simulationRunId,
    contentPackageVersionId: input.contentPackageVersionId,
    originDecisionRecordId: input.originDecisionRecordId,
    originConsequenceId: input.originConsequenceId,
    consequenceDefinitionId: input.consequenceDefinitionId,
    dueAt: input.dueAt,
    delayMs: input.delayMs,
    reasonCode: input.reasonCode,
    createdAt: input.createdAt,
    status,
    resolverVersion: input.resolverVersion,
    sourceDecisionId: input.sourceDecisionId ?? null,
    sourceChapterId: input.sourceChapterId ?? null,
    targetChapterId: input.targetChapterId ?? null,
    deferredEffectKind: input.deferredEffectKind ?? null,
    deferredEffectPayload: input.deferredEffectPayload ?? null,
    triggerType: input.triggerType ?? null,
    priority,
    orderCategory,
    eligibleAtSequence: input.eligibleAtSequence ?? null,
    appliedAtSequence: input.appliedAtSequence ?? null,
    terminalReason: input.terminalReason ?? null,
    supersededById: input.supersededById ?? null,
  });
};

export const serializeScheduledEventInstruction = (
  instruction: ScheduledEventInstruction,
): Readonly<Record<string, unknown>> => ({
  id: instruction.id,
  tenantId: instruction.tenantId,
  simulationRunId: instruction.simulationRunId,
  contentPackageVersionId: instruction.contentPackageVersionId,
  originDecisionRecordId: instruction.originDecisionRecordId,
  originConsequenceId: instruction.originConsequenceId,
  consequenceDefinitionId: instruction.consequenceDefinitionId,
  dueAt: instruction.dueAt,
  delayMs: instruction.delayMs,
  reasonCode: instruction.reasonCode,
  createdAt: instruction.createdAt,
  status: instruction.status,
  resolverVersion: instruction.resolverVersion,
  sourceDecisionId: instruction.sourceDecisionId,
  sourceChapterId: instruction.sourceChapterId,
  targetChapterId: instruction.targetChapterId,
  deferredEffectKind: instruction.deferredEffectKind,
  deferredEffectPayload: instruction.deferredEffectPayload,
  triggerType: instruction.triggerType,
  priority: instruction.priority,
  orderCategory: instruction.orderCategory,
  eligibleAtSequence: instruction.eligibleAtSequence,
  appliedAtSequence: instruction.appliedAtSequence,
  terminalReason: instruction.terminalReason,
  supersededById: instruction.supersededById,
});

export const rehydrateScheduledEventInstruction = (
  value: unknown,
): Result<ScheduledEventInstruction, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        "Scheduled event must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.tenantId !== "string" ||
    typeof record.simulationRunId !== "string" ||
    typeof record.contentPackageVersionId !== "string" ||
    typeof record.originDecisionRecordId !== "string" ||
    typeof record.originConsequenceId !== "string" ||
    typeof record.consequenceDefinitionId !== "string" ||
    typeof record.dueAt !== "string" ||
    typeof record.createdAt !== "string" ||
    typeof record.reasonCode !== "string" ||
    typeof record.resolverVersion !== "string" ||
    typeof record.delayMs !== "number" ||
    typeof record.status !== "string" ||
    !isScheduledEventStatus(record.status)
  ) {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        "Scheduled event fields are incomplete or invalid.",
      ),
    );
  }
  const optionalString = (field: string): string | null => {
    const valueAtField = record[field];
    if (valueAtField === undefined || valueAtField === null) {
      return null;
    }
    return typeof valueAtField === "string" ? valueAtField : null;
  };
  const optionalNumber = (field: string): number | null => {
    const valueAtField = record[field];
    if (valueAtField === undefined || valueAtField === null) {
      return null;
    }
    return typeof valueAtField === "number" ? valueAtField : null;
  };
  const triggerRaw = optionalString("triggerType");
  const triggerType =
    triggerRaw !== null && isScheduleTriggerType(triggerRaw)
      ? triggerRaw
      : null;
  const orderRaw = optionalString("orderCategory");
  const orderCategory =
    orderRaw !== null &&
    (scheduleOrderCategories as readonly string[]).includes(orderRaw)
      ? (orderRaw as ScheduleOrderCategory)
      : orderCategoryForDeferredEffect(optionalString("deferredEffectKind"));
  return createScheduledEventInstruction({
    id: record.id as ScheduledEventId,
    tenantId: record.tenantId as TenantId,
    simulationRunId: record.simulationRunId as SimulationRunId,
    contentPackageVersionId:
      record.contentPackageVersionId as ContentPackageVersionId,
    originDecisionRecordId: record.originDecisionRecordId as DecisionRecordId,
    originConsequenceId: record.originConsequenceId as ConsequenceId,
    consequenceDefinitionId:
      record.consequenceDefinitionId as ConsequenceDefinitionId,
    dueAt: record.dueAt as IsoTimestamp,
    delayMs: record.delayMs,
    reasonCode: record.reasonCode,
    createdAt: record.createdAt as IsoTimestamp,
    resolverVersion: record.resolverVersion as ResolverVersion,
    sourceDecisionId: optionalString("sourceDecisionId"),
    sourceChapterId: optionalString("sourceChapterId"),
    targetChapterId: optionalString("targetChapterId"),
    deferredEffectKind: optionalString("deferredEffectKind"),
    deferredEffectPayload: optionalString("deferredEffectPayload"),
    triggerType,
    priority:
      typeof record.priority === "number" && Number.isInteger(record.priority)
        ? record.priority
        : 100,
    orderCategory,
    status: record.status,
    eligibleAtSequence: optionalNumber("eligibleAtSequence"),
    appliedAtSequence: optionalNumber("appliedAtSequence"),
    terminalReason: optionalString("terminalReason"),
    supersededById: optionalString("supersededById"),
  });
};

const categoryRank = (category: ScheduleOrderCategory): number =>
  scheduleOrderCategories.indexOf(category);

/** Deterministic eligible-schedule ordering for W4. */
export const compareSchedulesForApplication = (
  left: ScheduledEventInstruction,
  right: ScheduledEventInstruction,
): number => {
  const byCategory =
    categoryRank(left.orderCategory) - categoryRank(right.orderCategory);
  if (byCategory !== 0) {
    return byCategory;
  }
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }
  return String(left.id).localeCompare(String(right.id));
};

export const markScheduleEligible = (
  schedule: ScheduledEventInstruction,
  sequence: number,
): Result<ScheduledEventInstruction, RuleViolationError> => {
  if (!isScheduleAwaitingEligibility(schedule.status)) {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        `Schedule '${schedule.id}' cannot become eligible from status '${schedule.status}'.`,
      ),
    );
  }
  return ok({
    ...schedule,
    status: "eligible",
    eligibleAtSequence: sequence,
  });
};

export const markScheduleApplied = (
  schedule: ScheduledEventInstruction,
  sequence: number,
): Result<ScheduledEventInstruction, RuleViolationError> => {
  if (schedule.status === "applied") {
    return ok(schedule);
  }
  if (
    schedule.status !== "eligible" &&
    !isScheduleAwaitingEligibility(schedule.status)
  ) {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        `Schedule '${schedule.id}' cannot be applied from status '${schedule.status}'.`,
      ),
    );
  }
  return ok({
    ...schedule,
    status: "applied",
    eligibleAtSequence: schedule.eligibleAtSequence ?? sequence,
    appliedAtSequence: sequence,
  });
};

export const markScheduleCancelled = (
  schedule: ScheduledEventInstruction,
  reason: string,
): Result<ScheduledEventInstruction, RuleViolationError> => {
  if (schedule.status === "applied") {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        `Applied schedule '${schedule.id}' cannot be cancelled.`,
      ),
    );
  }
  if (isScheduleTerminal(schedule.status)) {
    return ok(schedule);
  }
  return ok({
    ...schedule,
    status: "cancelled",
    terminalReason: reason,
  });
};

export const markScheduleExpired = (
  schedule: ScheduledEventInstruction,
  reason: string,
): Result<ScheduledEventInstruction, RuleViolationError> => {
  if (schedule.status === "applied") {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        `Applied schedule '${schedule.id}' cannot expire.`,
      ),
    );
  }
  if (isScheduleTerminal(schedule.status)) {
    return ok(schedule);
  }
  return ok({
    ...schedule,
    status: "expired",
    terminalReason: reason,
  });
};

export const markScheduleSuperseded = (
  schedule: ScheduledEventInstruction,
  replacementId: string,
  reason: string,
): Result<ScheduledEventInstruction, RuleViolationError> => {
  if (schedule.status === "applied") {
    return err(
      ruleViolationError(
        "SCHEDULED_EVENT_INSTRUCTION_INVALID",
        `Applied schedule '${schedule.id}' cannot be superseded.`,
      ),
    );
  }
  if (isScheduleTerminal(schedule.status)) {
    return ok(schedule);
  }
  return ok({
    ...schedule,
    status: "superseded",
    supersededById: replacementId,
    terminalReason: reason,
  });
};
