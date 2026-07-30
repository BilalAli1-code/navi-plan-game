import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  ActionRecordId,
  ConsequenceDefinitionId,
  ConsequenceId,
  DecisionRecordId,
  EventId,
  LearnerMessageDefinitionId,
  ResolverVersion,
  SimulationRunId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { MetricKey, StakeholderId } from "../../shared-kernel/ids";
import {
  isConsequenceTiming,
  isProjectStateStatus,
  isSupportedConsequenceType,
  type ConsequencePayload,
  type ConsequenceTarget,
  type ConsequenceTiming,
  type SupportedConsequenceType,
} from "../content/consequence-definition";
import { createLearnerMessageOccurrence } from "./learner-message";
import {
  asLearnerMessageDefinitionId,
  asLearnerMessageOccurrenceId,
} from "../../shared-kernel/ids";

export const consequenceStatuses = ["applied", "scheduled"] as const;
export type ConsequenceStatus = (typeof consequenceStatuses)[number];

export const isConsequenceStatus = (
  value: string,
): value is ConsequenceStatus =>
  (consequenceStatuses as readonly string[]).includes(value);

export interface Consequence {
  readonly id: ConsequenceId;
  readonly simulationRunId: SimulationRunId;
  readonly originActionId: ActionRecordId;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly originEventId: EventId | null;
  readonly consequenceDefinitionId: ConsequenceDefinitionId;
  readonly consequenceType: SupportedConsequenceType;
  readonly timing: ConsequenceTiming;
  readonly target: ConsequenceTarget;
  readonly payload: ConsequencePayload;
  readonly status: ConsequenceStatus;
  readonly appliedAt: IsoTimestamp | null;
  readonly scheduledAt: IsoTimestamp | null;
  readonly resolverVersion: ResolverVersion;
  /** Exactly-once logical application identity. */
  readonly applicationKey: string;
}

export interface CreateConsequenceInput {
  readonly id: ConsequenceId;
  readonly simulationRunId: SimulationRunId;
  readonly originActionId: ActionRecordId;
  readonly originDecisionRecordId: DecisionRecordId;
  readonly originEventId: EventId | null;
  readonly consequenceDefinitionId: ConsequenceDefinitionId;
  readonly consequenceType: SupportedConsequenceType;
  readonly timing: ConsequenceTiming;
  readonly target: ConsequenceTarget;
  readonly payload: ConsequencePayload;
  readonly status: ConsequenceStatus;
  readonly appliedAt: IsoTimestamp | null;
  readonly scheduledAt: IsoTimestamp | null;
  readonly resolverVersion: ResolverVersion;
  readonly applicationKey: string;
}

const requireNonEmpty = (
  value: string,
  field: string,
): Result<string, RuleViolationError> => {
  if (value.trim().length === 0) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        `Consequence.${field} must be a non-empty string.`,
        { field },
      ),
    );
  }
  return ok(value);
};

export const createConsequence = (
  input: CreateConsequenceInput,
): Result<Consequence, RuleViolationError> => {
  for (const [field, value] of [
    ["id", input.id],
    ["simulationRunId", input.simulationRunId],
    ["originActionId", input.originActionId],
    ["originDecisionRecordId", input.originDecisionRecordId],
    ["consequenceDefinitionId", input.consequenceDefinitionId],
    ["resolverVersion", input.resolverVersion],
    ["applicationKey", input.applicationKey],
  ] as const) {
    const checked = requireNonEmpty(value, field);
    if (!checked.ok) {
      return checked;
    }
  }
  if (!isSupportedConsequenceType(input.consequenceType)) {
    return err(
      ruleViolationError(
        "CONSEQUENCE_TYPE_UNSUPPORTED",
        `Consequence type '${input.consequenceType}' is unsupported.`,
        { consequenceType: input.consequenceType },
      ),
    );
  }
  if (!isConsequenceTiming(input.timing)) {
    return err(
      ruleViolationError(
        "CONSEQUENCE_DEFINITION_INVALID",
        `Invalid consequence timing '${input.timing}'.`,
      ),
    );
  }
  if (input.status === "applied" && input.appliedAt === null) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Applied Consequence requires appliedAt.",
      ),
    );
  }
  if (input.status === "scheduled" && input.scheduledAt === null) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Scheduled Consequence requires scheduledAt.",
      ),
    );
  }
  return ok({
    id: input.id,
    simulationRunId: input.simulationRunId,
    originActionId: input.originActionId,
    originDecisionRecordId: input.originDecisionRecordId,
    originEventId: input.originEventId,
    consequenceDefinitionId: input.consequenceDefinitionId,
    consequenceType: input.consequenceType,
    timing: input.timing,
    target: input.target,
    payload: Object.freeze({ ...input.payload }) as ConsequencePayload,
    status: input.status,
    appliedAt: input.appliedAt,
    scheduledAt: input.scheduledAt,
    resolverVersion: input.resolverVersion,
    applicationKey: input.applicationKey,
  });
};

const rehydrateTarget = (
  value: unknown,
): Result<ConsequenceTarget, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Consequence.target must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  switch (record.kind) {
    case "project_metric":
      if (typeof record.metricKey !== "string") {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "project_metric target requires metricKey.",
          ),
        );
      }
      return ok({
        kind: "project_metric",
        metricKey: record.metricKey as MetricKey,
      });
    case "project_state":
      return ok({ kind: "project_state" });
    case "scheduled_event":
      return ok({ kind: "scheduled_event" });
    case "learning_context":
      return ok({ kind: "learning_context" });
    case "stakeholder_context":
      if (typeof record.stakeholderId !== "string") {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "stakeholder_context target requires stakeholderId.",
          ),
        );
      }
      return ok({
        kind: "stakeholder_context",
        stakeholderId: record.stakeholderId as StakeholderId,
      });
    case "analytics_context":
      return ok({ kind: "analytics_context" });
    case "learner_message":
      return ok({ kind: "learner_message" });
    default:
      return err(
        ruleViolationError(
          "PERSISTED_CONSEQUENCE_INVALID",
          `Unknown consequence target kind '${String(record.kind)}'.`,
        ),
      );
  }
};

const rehydratePayload = (
  type: SupportedConsequenceType,
  value: unknown,
): Result<ConsequencePayload, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Consequence.payload must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  switch (type) {
    case "project_metric_delta":
      if (
        typeof record.metricKey !== "string" ||
        typeof record.delta !== "number" ||
        typeof record.reasonCode !== "string"
      ) {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "Invalid project_metric_delta payload.",
          ),
        );
      }
      return ok({
        metricKey: record.metricKey as MetricKey,
        delta: record.delta,
        reasonCode: record.reasonCode,
      });
    case "project_state_transition":
      if (
        typeof record.nextStatus !== "string" ||
        !isProjectStateStatus(record.nextStatus) ||
        typeof record.reasonCode !== "string"
      ) {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "Invalid project_state_transition payload.",
          ),
        );
      }
      return ok({
        nextStatus: record.nextStatus,
        reasonCode: record.reasonCode,
      });
    case "schedule_event":
      if (
        typeof record.delayMs !== "number" ||
        !Number.isInteger(record.delayMs) ||
        record.delayMs < 0 ||
        typeof record.reasonCode !== "string"
      ) {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "Invalid schedule_event payload.",
          ),
        );
      }
      return ok({
        delayMs: record.delayMs,
        reasonCode: record.reasonCode,
      });
    case "learning_signal":
      if (
        typeof record.signalType !== "string" ||
        typeof record.competencyKey !== "string" ||
        typeof record.delta !== "number" ||
        typeof record.reasonCode !== "string"
      ) {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "Invalid learning_signal payload.",
          ),
        );
      }
      return ok({
        signalType: record.signalType,
        competencyKey: record.competencyKey,
        delta: record.delta,
        reasonCode: record.reasonCode,
      });
    case "stakeholder_signal":
      if (
        typeof record.signalType !== "string" ||
        typeof record.stakeholderId !== "string" ||
        typeof record.sentimentDelta !== "number" ||
        typeof record.reasonCode !== "string"
      ) {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "Invalid stakeholder_signal payload.",
          ),
        );
      }
      return ok({
        signalType: record.signalType,
        stakeholderId: record.stakeholderId as StakeholderId,
        sentimentDelta: record.sentimentDelta,
        reasonCode: record.reasonCode,
      });
    case "analytics_signal":
      if (
        typeof record.signalType !== "string" ||
        typeof record.dimension !== "string" ||
        typeof record.value !== "number" ||
        typeof record.reasonCode !== "string"
      ) {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "Invalid analytics_signal payload.",
          ),
        );
      }
      return ok({
        signalType: record.signalType,
        dimension: record.dimension,
        value: record.value,
        reasonCode: record.reasonCode,
      });
    case "deliver_learner_message": {
      if (
        typeof record.messageDefinitionId !== "string" ||
        typeof record.definitionVersion !== "string" ||
        typeof record.subject !== "string" ||
        typeof record.body !== "string" ||
        typeof record.sender !== "object" ||
        record.sender === null ||
        Array.isArray(record.sender)
      ) {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            "Invalid deliver_learner_message payload.",
          ),
        );
      }
      const senderRecord = record.sender as Record<string, unknown>;
      const validated = createLearnerMessageOccurrence({
        occurrenceId: asLearnerMessageOccurrenceId(
          "learner_message:payload_validation",
        ),
        definitionId: asLearnerMessageDefinitionId(record.messageDefinitionId),
        definitionVersion: record.definitionVersion,
        deliverySequence: 1,
        deliveredAt: null,
        sender: {
          senderId:
            senderRecord.senderId === null ||
            senderRecord.senderId === undefined
              ? null
              : typeof senderRecord.senderId === "string"
                ? senderRecord.senderId
                : "",
          displayName:
            typeof senderRecord.displayName === "string"
              ? senderRecord.displayName
              : "",
          roleLabel:
            senderRecord.roleLabel === null ||
            senderRecord.roleLabel === undefined
              ? null
              : typeof senderRecord.roleLabel === "string"
                ? senderRecord.roleLabel
                : "",
        },
        subject: record.subject,
        body: record.body,
      });
      if (!validated.ok) {
        return err(
          ruleViolationError(
            "PERSISTED_CONSEQUENCE_INVALID",
            validated.error.message,
            validated.error.details,
          ),
        );
      }
      return ok({
        messageDefinitionId: validated.value
          .definitionId as LearnerMessageDefinitionId,
        definitionVersion: validated.value.definitionVersion,
        sender: {
          senderId: validated.value.sender.senderId,
          displayName: validated.value.sender.displayName,
          roleLabel: validated.value.sender.roleLabel,
        },
        subject: validated.value.subject,
        body: validated.value.body,
      });
    }
    default:
      return err(
        ruleViolationError(
          "CONSEQUENCE_TYPE_UNSUPPORTED",
          `Unsupported consequence type '${type}'.`,
        ),
      );
  }
};

export const rehydrateConsequence = (
  value: unknown,
): Result<Consequence, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Persisted Consequence must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Consequence.id is required.",
      ),
    );
  }
  if (typeof record.consequenceType !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Consequence.consequenceType is required.",
      ),
    );
  }
  if (!isSupportedConsequenceType(record.consequenceType)) {
    return err(
      ruleViolationError(
        "CONSEQUENCE_TYPE_UNSUPPORTED",
        `Persisted consequence type '${record.consequenceType}' is unsupported.`,
        { consequenceType: record.consequenceType },
      ),
    );
  }
  if (
    typeof record.timing !== "string" ||
    !isConsequenceTiming(record.timing)
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Consequence.timing is invalid.",
      ),
    );
  }
  if (
    typeof record.status !== "string" ||
    !isConsequenceStatus(record.status)
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Consequence.status is invalid.",
      ),
    );
  }
  const target = rehydrateTarget(record.target);
  if (!target.ok) {
    return target;
  }
  const payload = rehydratePayload(record.consequenceType, record.payload);
  if (!payload.ok) {
    return payload;
  }
  if (
    typeof record.simulationRunId !== "string" ||
    typeof record.originActionId !== "string" ||
    typeof record.originDecisionRecordId !== "string" ||
    typeof record.consequenceDefinitionId !== "string" ||
    typeof record.resolverVersion !== "string" ||
    typeof record.applicationKey !== "string"
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Consequence identity fields are incomplete.",
      ),
    );
  }
  const originEventId =
    record.originEventId === null || record.originEventId === undefined
      ? null
      : typeof record.originEventId === "string"
        ? (record.originEventId as EventId)
        : null;
  if (
    record.originEventId !== null &&
    record.originEventId !== undefined &&
    typeof record.originEventId !== "string"
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "Consequence.originEventId must be a string or null.",
      ),
    );
  }

  return createConsequence({
    id: record.id as ConsequenceId,
    simulationRunId: record.simulationRunId as SimulationRunId,
    originActionId: record.originActionId as ActionRecordId,
    originDecisionRecordId: record.originDecisionRecordId as DecisionRecordId,
    originEventId,
    consequenceDefinitionId:
      record.consequenceDefinitionId as ConsequenceDefinitionId,
    consequenceType: record.consequenceType,
    timing: record.timing,
    target: target.value,
    payload: payload.value,
    status: record.status,
    appliedAt:
      record.appliedAt === null || record.appliedAt === undefined
        ? null
        : (record.appliedAt as IsoTimestamp),
    scheduledAt:
      record.scheduledAt === null || record.scheduledAt === undefined
        ? null
        : (record.scheduledAt as IsoTimestamp),
    resolverVersion: record.resolverVersion as ResolverVersion,
    applicationKey: record.applicationKey,
  });
};

export const serializeConsequence = (
  consequence: Consequence,
): Readonly<Record<string, unknown>> => ({
  id: consequence.id,
  simulationRunId: consequence.simulationRunId,
  originActionId: consequence.originActionId,
  originDecisionRecordId: consequence.originDecisionRecordId,
  originEventId: consequence.originEventId,
  consequenceDefinitionId: consequence.consequenceDefinitionId,
  consequenceType: consequence.consequenceType,
  timing: consequence.timing,
  target: { ...consequence.target },
  payload: { ...consequence.payload },
  status: consequence.status,
  appliedAt: consequence.appliedAt,
  scheduledAt: consequence.scheduledAt,
  resolverVersion: consequence.resolverVersion,
  applicationKey: consequence.applicationKey,
});
