import type {
  RuleViolationCode,
  RuleViolationError,
} from "../../shared-kernel/errors";
import { ruleViolationError } from "../../shared-kernel/errors";
import type { CommandId, NotificationId } from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import { asIsoTimestamp, type IsoTimestamp } from "../../shared-kernel/time";

/**
 * Authoritative Notification runtime state owned by SimulationRun (PS-ROADMAP-021).
 *
 * A Notification is a discrete learner-facing attention item. It is not an Inbox
 * message, Mission Control metric, Activity, Completed History record, toast, or
 * delivery-channel notification.
 *
 * v1 is append-only and active-only. Severity, dismissal, read/unread,
 * preferences, and external delivery are out of scope.
 */

export const NOTIFICATION_TITLE_MAX_LENGTH = 200;
export const NOTIFICATION_SUMMARY_MAX_LENGTH = 2000;
export const NOTIFICATION_BODY_MAX_LENGTH = 10_000;
export const NOTIFICATION_SOURCE_ID_MAX_LENGTH = 200;
export const NOTIFICATION_SOURCE_REASON_MAX_LENGTH = 200;

export const notificationSourceKinds = [
  "simulation",
  "meeting",
  "stakeholder",
  "document",
  "decision",
  "inbox",
  "authored_consequence",
] as const;
export type NotificationSourceKind = (typeof notificationSourceKinds)[number];

export const isNotificationSourceKind = (
  value: string,
): value is NotificationSourceKind =>
  (notificationSourceKinds as readonly string[]).includes(value);

export const notificationLifecycleStates = ["active"] as const;
export type NotificationLifecycleState =
  (typeof notificationLifecycleStates)[number];

export const isNotificationLifecycleState = (
  value: string,
): value is NotificationLifecycleState =>
  (notificationLifecycleStates as readonly string[]).includes(value);

/** Immutable learner-safe provenance pinned at initialization. */
export interface NotificationProvenance {
  readonly kind: NotificationSourceKind;
  /** Stable authoritative source id when applicable; otherwise null. */
  readonly sourceId: string | null;
  /** Learner-safe reason/event kind; never command/event/outbox metadata. */
  readonly reason: string | null;
}

/** Learner-safe content snapshot pinned at initialization. */
export interface NotificationLearnerSafeContent {
  readonly title: string;
  readonly summary: string;
  readonly body: string | null;
}

/**
 * One runtime Notification per NotificationId per SimulationRun.
 *
 * Identity: NotificationId. Ordering: monotonic creationSequence (1-based).
 * Lifecycle v1: active-only (append-only; no dismiss/read).
 */
export interface NotificationRuntime {
  readonly notificationId: NotificationId;
  /** 1-based monotonic creation order within the run. */
  readonly creationSequence: number;
  readonly content: NotificationLearnerSafeContent;
  readonly source: NotificationProvenance;
  readonly status: NotificationLifecycleState;
  readonly createdAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

const requireBoundedNonEmpty = (
  value: string,
  field: string,
  maxLength: number,
  code: RuleViolationCode,
): Result<string, RuleViolationError> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err(
      ruleViolationError(
        code,
        `Notification.${field} must be a non-empty string.`,
        { field },
      ),
    );
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        code,
        `Notification.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        code,
        `Notification.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

const requireOptionalBounded = (
  value: string | null | undefined,
  field: string,
  maxLength: number,
  code: RuleViolationCode,
): Result<string | null, RuleViolationError> => {
  if (value === null || value === undefined) {
    return ok(null);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return ok(null);
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        code,
        `Notification.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        code,
        `Notification.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

export const createNotificationProvenance = (input: {
  readonly kind: NotificationSourceKind;
  readonly sourceId?: string | null;
  readonly reason?: string | null;
}): Result<NotificationProvenance, RuleViolationError> => {
  if (!isNotificationSourceKind(input.kind)) {
    return err(
      ruleViolationError(
        "NOTIFICATION_PROVENANCE_INVALID",
        `Unsupported Notification source kind '${String(input.kind)}'.`,
      ),
    );
  }
  const sourceId = requireOptionalBounded(
    input.sourceId,
    "source.sourceId",
    NOTIFICATION_SOURCE_ID_MAX_LENGTH,
    "NOTIFICATION_PROVENANCE_INVALID",
  );
  if (!sourceId.ok) {
    return sourceId;
  }
  const reason = requireOptionalBounded(
    input.reason,
    "source.reason",
    NOTIFICATION_SOURCE_REASON_MAX_LENGTH,
    "NOTIFICATION_PROVENANCE_INVALID",
  );
  if (!reason.ok) {
    return reason;
  }
  return ok({
    kind: input.kind,
    sourceId: sourceId.value,
    reason: reason.value,
  });
};

export const createNotificationLearnerSafeContent = (input: {
  readonly title: string;
  readonly summary: string;
  readonly body?: string | null;
}): Result<NotificationLearnerSafeContent, RuleViolationError> => {
  const title = requireBoundedNonEmpty(
    input.title,
    "title",
    NOTIFICATION_TITLE_MAX_LENGTH,
    "NOTIFICATION_CONTENT_INVALID",
  );
  if (!title.ok) {
    return title;
  }
  const summary = requireBoundedNonEmpty(
    input.summary,
    "summary",
    NOTIFICATION_SUMMARY_MAX_LENGTH,
    "NOTIFICATION_CONTENT_INVALID",
  );
  if (!summary.ok) {
    return summary;
  }
  const body = requireOptionalBounded(
    input.body,
    "body",
    NOTIFICATION_BODY_MAX_LENGTH,
    "NOTIFICATION_CONTENT_INVALID",
  );
  if (!body.ok) {
    return body;
  }
  return ok({
    title: title.value,
    summary: summary.value,
    body: body.value,
  });
};

export const createNotificationRuntime = (input: {
  readonly notificationId: NotificationId;
  readonly creationSequence: number;
  readonly content: NotificationLearnerSafeContent;
  readonly source: NotificationProvenance;
  readonly createdAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}): Result<NotificationRuntime, RuleViolationError> => {
  if (
    !input.notificationId ||
    String(input.notificationId).trim().length === 0
  ) {
    return err(
      ruleViolationError(
        "NOTIFICATION_IDENTITY_INVALID",
        "Notification.notificationId must be a non-empty identifier.",
      ),
    );
  }
  if (!Number.isInteger(input.creationSequence) || input.creationSequence < 1) {
    return err(
      ruleViolationError(
        "NOTIFICATION_SEQUENCE_INVALID",
        "Notification.creationSequence must be a positive integer.",
        { creationSequence: input.creationSequence },
      ),
    );
  }
  return ok({
    notificationId: input.notificationId,
    creationSequence: input.creationSequence,
    content: input.content,
    source: input.source,
    status: "active",
    createdAt: input.createdAt,
    originatingCommandId: input.originatingCommandId,
  });
};

export const notificationRuntimeSemanticEqual = (
  left: NotificationRuntime,
  right: NotificationRuntime,
): boolean =>
  left.notificationId === right.notificationId &&
  left.content.title === right.content.title &&
  left.content.summary === right.content.summary &&
  left.content.body === right.content.body &&
  left.source.kind === right.source.kind &&
  left.source.sourceId === right.source.sourceId &&
  left.source.reason === right.source.reason &&
  left.status === right.status;

export const serializeNotificationRuntime = (
  notification: NotificationRuntime,
): Readonly<Record<string, unknown>> => ({
  notificationId: notification.notificationId,
  creationSequence: notification.creationSequence,
  content: {
    title: notification.content.title,
    summary: notification.content.summary,
    body: notification.content.body,
  },
  source: {
    kind: notification.source.kind,
    sourceId: notification.source.sourceId,
    reason: notification.source.reason,
  },
  status: notification.status,
  createdAt: notification.createdAt,
  originatingCommandId: notification.originatingCommandId,
});

export const parseNotificationRuntime = (
  value: unknown,
): Result<NotificationRuntime, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "NOTIFICATION_OCCURRENCE_INVALID",
        "Notification runtime must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.notificationId !== "string" ||
    record.notificationId.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "NOTIFICATION_IDENTITY_INVALID",
        "Notification.notificationId must be a non-empty string.",
      ),
    );
  }
  if (
    typeof record.creationSequence !== "number" ||
    !Number.isInteger(record.creationSequence) ||
    record.creationSequence < 1
  ) {
    return err(
      ruleViolationError(
        "NOTIFICATION_SEQUENCE_INVALID",
        "Notification.creationSequence must be a positive integer.",
      ),
    );
  }
  if (
    typeof record.status !== "string" ||
    !isNotificationLifecycleState(record.status)
  ) {
    return err(
      ruleViolationError(
        "NOTIFICATION_OCCURRENCE_INVALID",
        `Unsupported Notification status '${String(record.status)}'.`,
      ),
    );
  }
  if (typeof record.createdAt !== "string") {
    return err(
      ruleViolationError(
        "NOTIFICATION_OCCURRENCE_INVALID",
        "Notification.createdAt must be an ISO timestamp string.",
      ),
    );
  }
  if (
    typeof record.originatingCommandId !== "string" ||
    record.originatingCommandId.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "NOTIFICATION_OCCURRENCE_INVALID",
        "Notification.originatingCommandId must be a non-empty string.",
      ),
    );
  }
  if (
    typeof record.content !== "object" ||
    record.content === null ||
    Array.isArray(record.content)
  ) {
    return err(
      ruleViolationError(
        "NOTIFICATION_CONTENT_INVALID",
        "Notification.content must be an object.",
      ),
    );
  }
  if (
    typeof record.source !== "object" ||
    record.source === null ||
    Array.isArray(record.source)
  ) {
    return err(
      ruleViolationError(
        "NOTIFICATION_PROVENANCE_INVALID",
        "Notification.source must be an object.",
      ),
    );
  }
  const contentRecord = record.content as Record<string, unknown>;
  const sourceRecord = record.source as Record<string, unknown>;
  if (
    typeof sourceRecord.kind !== "string" ||
    !isNotificationSourceKind(sourceRecord.kind)
  ) {
    return err(
      ruleViolationError(
        "NOTIFICATION_PROVENANCE_INVALID",
        `Unsupported Notification source kind '${String(sourceRecord.kind)}'.`,
      ),
    );
  }
  const content = createNotificationLearnerSafeContent({
    title: String(contentRecord.title ?? ""),
    summary: String(contentRecord.summary ?? ""),
    body:
      contentRecord.body === null || contentRecord.body === undefined
        ? null
        : String(contentRecord.body),
  });
  if (!content.ok) {
    return content;
  }
  const source = createNotificationProvenance({
    kind: sourceRecord.kind,
    sourceId:
      sourceRecord.sourceId === null || sourceRecord.sourceId === undefined
        ? null
        : String(sourceRecord.sourceId),
    reason:
      sourceRecord.reason === null || sourceRecord.reason === undefined
        ? null
        : String(sourceRecord.reason),
  });
  if (!source.ok) {
    return source;
  }
  return createNotificationRuntime({
    notificationId: record.notificationId as NotificationId,
    creationSequence: record.creationSequence,
    content: content.value,
    source: source.value,
    createdAt: asIsoTimestamp(record.createdAt),
    originatingCommandId: record.originatingCommandId as CommandId,
  });
};
