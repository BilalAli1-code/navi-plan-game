import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  LearnerMessageDefinitionId,
  LearnerMessageOccurrenceId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import { asIsoTimestamp, type IsoTimestamp } from "../../shared-kernel/time";
import {
  LEARNER_MESSAGE_BODY_MAX_LENGTH,
  LEARNER_MESSAGE_DEFINITION_VERSION_MAX_LENGTH,
  LEARNER_MESSAGE_SENDER_DISPLAY_NAME_MAX_LENGTH,
  LEARNER_MESSAGE_SENDER_ROLE_LABEL_MAX_LENGTH,
  LEARNER_MESSAGE_SUBJECT_MAX_LENGTH,
} from "../content/learner-message-definition";

/**
 * Authoritative system-delivered learner message occurrence (SimulationRun state).
 *
 * Append-only historical fact. Not an Inbox projection row.
 * Read / archive / reply are unsupported in this lifecycle.
 */

export const learnerMessageDeliveryStatuses = ["delivered"] as const;
export type LearnerMessageDeliveryStatus =
  (typeof learnerMessageDeliveryStatuses)[number];

export const isLearnerMessageDeliveryStatus = (
  value: string,
): value is LearnerMessageDeliveryStatus =>
  (learnerMessageDeliveryStatuses as readonly string[]).includes(value);

export interface LearnerMessageSenderSnapshot {
  readonly senderId: string | null;
  readonly displayName: string;
  readonly roleLabel: string | null;
}

export interface LearnerMessageOccurrence {
  readonly occurrenceId: LearnerMessageOccurrenceId;
  readonly definitionId: LearnerMessageDefinitionId;
  readonly definitionVersion: string;
  /** 1-based monotonic delivery order within the run. */
  readonly deliverySequence: number;
  readonly deliveredAt: IsoTimestamp | null;
  readonly sender: LearnerMessageSenderSnapshot;
  readonly subject: string;
  readonly body: string;
  readonly deliveryStatus: LearnerMessageDeliveryStatus;
}

export interface CreateLearnerMessageOccurrenceInput {
  readonly occurrenceId: LearnerMessageOccurrenceId;
  readonly definitionId: LearnerMessageDefinitionId;
  readonly definitionVersion: string;
  readonly deliverySequence: number;
  readonly deliveredAt: IsoTimestamp | null;
  readonly sender: LearnerMessageSenderSnapshot;
  readonly subject: string;
  readonly body: string;
}

const requireBoundedNonEmpty = (
  value: string,
  field: string,
  maxLength: number,
): Result<string, RuleViolationError> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_CONTENT_INVALID",
        `LearnerMessage.${field} must be a non-empty string.`,
        { field },
      ),
    );
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_CONTENT_INVALID",
        `LearnerMessage.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  // Reject angle-bracket markup to keep snapshots plain-text learner-safe.
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_CONTENT_INVALID",
        `LearnerMessage.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

const validateSender = (
  sender: LearnerMessageSenderSnapshot,
): Result<LearnerMessageSenderSnapshot, RuleViolationError> => {
  const displayName = requireBoundedNonEmpty(
    sender.displayName,
    "sender.displayName",
    LEARNER_MESSAGE_SENDER_DISPLAY_NAME_MAX_LENGTH,
  );
  if (!displayName.ok) {
    return displayName;
  }
  let roleLabel: string | null = null;
  if (sender.roleLabel !== null && sender.roleLabel !== undefined) {
    if (typeof sender.roleLabel !== "string") {
      return err(
        ruleViolationError(
          "LEARNER_MESSAGE_CONTENT_INVALID",
          "LearnerMessage.sender.roleLabel must be a string or null.",
        ),
      );
    }
    const role = requireBoundedNonEmpty(
      sender.roleLabel,
      "sender.roleLabel",
      LEARNER_MESSAGE_SENDER_ROLE_LABEL_MAX_LENGTH,
    );
    if (!role.ok) {
      return role;
    }
    roleLabel = role.value;
  }
  let senderId: string | null = null;
  if (sender.senderId !== null && sender.senderId !== undefined) {
    if (
      typeof sender.senderId !== "string" ||
      sender.senderId.trim().length === 0
    ) {
      return err(
        ruleViolationError(
          "LEARNER_MESSAGE_CONTENT_INVALID",
          "LearnerMessage.sender.senderId must be a non-empty string or null.",
        ),
      );
    }
    senderId = sender.senderId.trim();
  }
  return ok({
    senderId,
    displayName: displayName.value,
    roleLabel,
  });
};

/** Semantic equality for occurrence-level idempotency / conflict detection. */
export const learnerMessageSemanticEqual = (
  left: Pick<
    LearnerMessageOccurrence,
    | "definitionId"
    | "definitionVersion"
    | "sender"
    | "subject"
    | "body"
    | "deliveryStatus"
  >,
  right: Pick<
    LearnerMessageOccurrence,
    | "definitionId"
    | "definitionVersion"
    | "sender"
    | "subject"
    | "body"
    | "deliveryStatus"
  >,
): boolean =>
  left.definitionId === right.definitionId &&
  left.definitionVersion === right.definitionVersion &&
  left.sender.senderId === right.sender.senderId &&
  left.sender.displayName === right.sender.displayName &&
  left.sender.roleLabel === right.sender.roleLabel &&
  left.subject === right.subject &&
  left.body === right.body &&
  left.deliveryStatus === right.deliveryStatus;

export const createLearnerMessageOccurrence = (
  input: CreateLearnerMessageOccurrenceInput,
): Result<LearnerMessageOccurrence, RuleViolationError> => {
  if (input.occurrenceId.trim().length === 0) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_OCCURRENCE_INVALID",
        "LearnerMessage.occurrenceId must be non-empty.",
      ),
    );
  }
  if (input.definitionId.trim().length === 0) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_CONTENT_INVALID",
        "LearnerMessage.definitionId must be non-empty.",
      ),
    );
  }
  const definitionVersion = requireBoundedNonEmpty(
    input.definitionVersion,
    "definitionVersion",
    LEARNER_MESSAGE_DEFINITION_VERSION_MAX_LENGTH,
  );
  if (!definitionVersion.ok) {
    return definitionVersion;
  }
  if (!Number.isInteger(input.deliverySequence) || input.deliverySequence < 1) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_SEQUENCE_INVALID",
        "LearnerMessage.deliverySequence must be a positive integer.",
        { deliverySequence: input.deliverySequence },
      ),
    );
  }
  if (input.deliveredAt !== null) {
    const parsed = Date.parse(input.deliveredAt);
    if (Number.isNaN(parsed)) {
      return err(
        ruleViolationError(
          "LEARNER_MESSAGE_OCCURRENCE_INVALID",
          "LearnerMessage.deliveredAt must be a valid ISO timestamp or null.",
        ),
      );
    }
  }
  const sender = validateSender(input.sender);
  if (!sender.ok) {
    return sender;
  }
  const subject = requireBoundedNonEmpty(
    input.subject,
    "subject",
    LEARNER_MESSAGE_SUBJECT_MAX_LENGTH,
  );
  if (!subject.ok) {
    return subject;
  }
  const body = requireBoundedNonEmpty(
    input.body,
    "body",
    LEARNER_MESSAGE_BODY_MAX_LENGTH,
  );
  if (!body.ok) {
    return body;
  }

  return ok({
    occurrenceId: input.occurrenceId,
    definitionId: input.definitionId,
    definitionVersion: definitionVersion.value,
    deliverySequence: input.deliverySequence,
    deliveredAt: input.deliveredAt,
    sender: sender.value,
    subject: subject.value,
    body: body.value,
    deliveryStatus: "delivered",
  });
};

export const serializeLearnerMessageOccurrence = (
  occurrence: LearnerMessageOccurrence,
): Readonly<Record<string, unknown>> => ({
  occurrenceId: occurrence.occurrenceId,
  definitionId: occurrence.definitionId,
  definitionVersion: occurrence.definitionVersion,
  deliverySequence: occurrence.deliverySequence,
  deliveredAt: occurrence.deliveredAt,
  sender: {
    senderId: occurrence.sender.senderId,
    displayName: occurrence.sender.displayName,
    roleLabel: occurrence.sender.roleLabel,
  },
  subject: occurrence.subject,
  body: occurrence.body,
  deliveryStatus: occurrence.deliveryStatus,
});

export const rehydrateLearnerMessageOccurrence = (
  value: unknown,
): Result<LearnerMessageOccurrence, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_OCCURRENCE_INVALID",
        "Persisted LearnerMessageOccurrence must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (typeof record.occurrenceId !== "string") {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_OCCURRENCE_INVALID",
        "LearnerMessage.occurrenceId is required.",
      ),
    );
  }
  if (typeof record.definitionId !== "string") {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_CONTENT_INVALID",
        "LearnerMessage.definitionId is required.",
      ),
    );
  }
  if (typeof record.definitionVersion !== "string") {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_CONTENT_INVALID",
        "LearnerMessage.definitionVersion is required.",
      ),
    );
  }
  if (typeof record.deliverySequence !== "number") {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_SEQUENCE_INVALID",
        "LearnerMessage.deliverySequence is required.",
      ),
    );
  }
  if (record.deliveredAt !== null && typeof record.deliveredAt !== "string") {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_OCCURRENCE_INVALID",
        "LearnerMessage.deliveredAt must be a string or null.",
      ),
    );
  }
  if (
    typeof record.sender !== "object" ||
    record.sender === null ||
    Array.isArray(record.sender)
  ) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_CONTENT_INVALID",
        "LearnerMessage.sender is required.",
      ),
    );
  }
  const senderRecord = record.sender as Record<string, unknown>;
  if (typeof record.subject !== "string" || typeof record.body !== "string") {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_CONTENT_INVALID",
        "LearnerMessage.subject and body are required strings.",
      ),
    );
  }
  if (
    typeof record.deliveryStatus !== "string" ||
    !isLearnerMessageDeliveryStatus(record.deliveryStatus)
  ) {
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_OCCURRENCE_INVALID",
        "LearnerMessage.deliveryStatus must be 'delivered'.",
      ),
    );
  }

  return createLearnerMessageOccurrence({
    occurrenceId: record.occurrenceId as LearnerMessageOccurrenceId,
    definitionId: record.definitionId as LearnerMessageDefinitionId,
    definitionVersion: record.definitionVersion,
    deliverySequence: record.deliverySequence,
    deliveredAt:
      record.deliveredAt === null ? null : asIsoTimestamp(record.deliveredAt),
    sender: {
      senderId:
        senderRecord.senderId === null || senderRecord.senderId === undefined
          ? null
          : typeof senderRecord.senderId === "string"
            ? senderRecord.senderId
            : null,
      displayName:
        typeof senderRecord.displayName === "string"
          ? senderRecord.displayName
          : "",
      roleLabel:
        senderRecord.roleLabel === null || senderRecord.roleLabel === undefined
          ? null
          : typeof senderRecord.roleLabel === "string"
            ? senderRecord.roleLabel
            : null,
    },
    subject: record.subject,
    body: record.body,
  });
};
