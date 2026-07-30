import type {
  RuleViolationCode,
  RuleViolationError,
} from "../../shared-kernel/errors";
import { ruleViolationError } from "../../shared-kernel/errors";
import type { ActivityId, CommandId } from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import { asIsoTimestamp, type IsoTimestamp } from "../../shared-kernel/time";

/**
 * Authoritative Activity runtime state owned by SimulationRun (PS-ROADMAP-022).
 *
 * An Activity is a learner work item that remains actionable until completed.
 * It is not a Notification, Inbox message, Meeting, Document, Decision, Domain
 * event, or generic history/audit record.
 *
 * Completed History is a read model of completed Activities — not a second
 * authoritative store. Lifecycle v1: active | completed (no reopen/cancel).
 */

export const ACTIVITY_TITLE_MAX_LENGTH = 200;
export const ACTIVITY_SUMMARY_MAX_LENGTH = 2000;
export const ACTIVITY_BODY_MAX_LENGTH = 10_000;
export const ACTIVITY_SOURCE_ID_MAX_LENGTH = 200;
export const ACTIVITY_SOURCE_REASON_MAX_LENGTH = 200;

export const activitySourceKinds = [
  "simulation",
  "meeting",
  "stakeholder",
  "document",
  "decision",
  "inbox",
  "authored_consequence",
] as const;
export type ActivitySourceKind = (typeof activitySourceKinds)[number];

export const isActivitySourceKind = (
  value: string,
): value is ActivitySourceKind =>
  (activitySourceKinds as readonly string[]).includes(value);

export const activityLifecycleStates = ["active", "completed"] as const;
export type ActivityLifecycleState = (typeof activityLifecycleStates)[number];

export const isActivityLifecycleState = (
  value: string,
): value is ActivityLifecycleState =>
  (activityLifecycleStates as readonly string[]).includes(value);

/** Immutable learner-safe provenance pinned at initialization. */
export interface ActivityProvenance {
  readonly kind: ActivitySourceKind;
  readonly sourceId: string | null;
  readonly reason: string | null;
}

/** Learner-safe content snapshot pinned at initialization. */
export interface ActivityLearnerSafeContent {
  readonly title: string;
  readonly summary: string;
  readonly body: string | null;
}

/**
 * One runtime Activity per ActivityId per SimulationRun.
 *
 * Identity: ActivityId (stable across completion).
 * Creation order: creationSequence (1-based).
 * Completion order: completionSequence (1-based when completed).
 */
export interface ActivityRuntime {
  readonly activityId: ActivityId;
  readonly creationSequence: number;
  readonly content: ActivityLearnerSafeContent;
  readonly source: ActivityProvenance;
  readonly status: ActivityLifecycleState;
  readonly createdAt: IsoTimestamp;
  readonly completedAt: IsoTimestamp | null;
  readonly completionSequence: number | null;
  readonly originatingCommandId: CommandId;
  readonly completingCommandId: CommandId | null;
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
        `Activity.${field} must be a non-empty string.`,
        { field },
      ),
    );
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        code,
        `Activity.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        code,
        `Activity.${field} must not contain markup characters.`,
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
        `Activity.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        code,
        `Activity.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

export const createActivityProvenance = (input: {
  readonly kind: ActivitySourceKind;
  readonly sourceId?: string | null;
  readonly reason?: string | null;
}): Result<ActivityProvenance, RuleViolationError> => {
  if (!isActivitySourceKind(input.kind)) {
    return err(
      ruleViolationError(
        "ACTIVITY_PROVENANCE_INVALID",
        `Unsupported Activity source kind '${String(input.kind)}'.`,
      ),
    );
  }
  const sourceId = requireOptionalBounded(
    input.sourceId,
    "source.sourceId",
    ACTIVITY_SOURCE_ID_MAX_LENGTH,
    "ACTIVITY_PROVENANCE_INVALID",
  );
  if (!sourceId.ok) {
    return sourceId;
  }
  const reason = requireOptionalBounded(
    input.reason,
    "source.reason",
    ACTIVITY_SOURCE_REASON_MAX_LENGTH,
    "ACTIVITY_PROVENANCE_INVALID",
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

export const createActivityLearnerSafeContent = (input: {
  readonly title: string;
  readonly summary: string;
  readonly body?: string | null;
}): Result<ActivityLearnerSafeContent, RuleViolationError> => {
  const title = requireBoundedNonEmpty(
    input.title,
    "title",
    ACTIVITY_TITLE_MAX_LENGTH,
    "ACTIVITY_CONTENT_INVALID",
  );
  if (!title.ok) {
    return title;
  }
  const summary = requireBoundedNonEmpty(
    input.summary,
    "summary",
    ACTIVITY_SUMMARY_MAX_LENGTH,
    "ACTIVITY_CONTENT_INVALID",
  );
  if (!summary.ok) {
    return summary;
  }
  const body = requireOptionalBounded(
    input.body,
    "body",
    ACTIVITY_BODY_MAX_LENGTH,
    "ACTIVITY_CONTENT_INVALID",
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

export const createActivityRuntime = (input: {
  readonly activityId: ActivityId;
  readonly creationSequence: number;
  readonly content: ActivityLearnerSafeContent;
  readonly source: ActivityProvenance;
  readonly createdAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}): Result<ActivityRuntime, RuleViolationError> => {
  if (!input.activityId || String(input.activityId).trim().length === 0) {
    return err(
      ruleViolationError(
        "ACTIVITY_IDENTITY_INVALID",
        "Activity.activityId must be a non-empty identifier.",
      ),
    );
  }
  if (!Number.isInteger(input.creationSequence) || input.creationSequence < 1) {
    return err(
      ruleViolationError(
        "ACTIVITY_SEQUENCE_INVALID",
        "Activity.creationSequence must be a positive integer.",
        { creationSequence: input.creationSequence },
      ),
    );
  }
  return ok({
    activityId: input.activityId,
    creationSequence: input.creationSequence,
    content: input.content,
    source: input.source,
    status: "active",
    createdAt: input.createdAt,
    completedAt: null,
    completionSequence: null,
    originatingCommandId: input.originatingCommandId,
    completingCommandId: null,
  });
};

export const completeActivityRuntime = (input: {
  readonly activity: ActivityRuntime;
  readonly completedAt: IsoTimestamp;
  readonly completionSequence: number;
  readonly completingCommandId: CommandId;
}): Result<ActivityRuntime, RuleViolationError> => {
  if (input.activity.status === "completed") {
    return err(
      ruleViolationError(
        "ACTIVITY_ALREADY_COMPLETED",
        `Activity '${input.activity.activityId}' is already completed.`,
        { activityId: input.activity.activityId },
      ),
    );
  }
  if (
    !Number.isInteger(input.completionSequence) ||
    input.completionSequence < 1
  ) {
    return err(
      ruleViolationError(
        "ACTIVITY_COMPLETION_SEQUENCE_INVALID",
        "Activity.completionSequence must be a positive integer.",
        { completionSequence: input.completionSequence },
      ),
    );
  }
  if (Date.parse(input.completedAt) < Date.parse(input.activity.createdAt)) {
    return err(
      ruleViolationError(
        "ACTIVITY_COMPLETION_TIME_INVALID",
        "Activity.completedAt must not precede createdAt.",
      ),
    );
  }
  return ok({
    ...input.activity,
    status: "completed",
    completedAt: input.completedAt,
    completionSequence: input.completionSequence,
    completingCommandId: input.completingCommandId,
  });
};

export const activityRuntimeSemanticEqual = (
  left: ActivityRuntime,
  right: ActivityRuntime,
): boolean =>
  left.activityId === right.activityId &&
  left.content.title === right.content.title &&
  left.content.summary === right.content.summary &&
  left.content.body === right.content.body &&
  left.source.kind === right.source.kind &&
  left.source.sourceId === right.source.sourceId &&
  left.source.reason === right.source.reason &&
  left.status === right.status &&
  left.completedAt === right.completedAt &&
  left.completionSequence === right.completionSequence;

export const serializeActivityRuntime = (
  activity: ActivityRuntime,
): Readonly<Record<string, unknown>> => ({
  activityId: activity.activityId,
  creationSequence: activity.creationSequence,
  content: {
    title: activity.content.title,
    summary: activity.content.summary,
    body: activity.content.body,
  },
  source: {
    kind: activity.source.kind,
    sourceId: activity.source.sourceId,
    reason: activity.source.reason,
  },
  status: activity.status,
  createdAt: activity.createdAt,
  completedAt: activity.completedAt,
  completionSequence: activity.completionSequence,
  originatingCommandId: activity.originatingCommandId,
  completingCommandId: activity.completingCommandId,
});

export const parseActivityRuntime = (
  value: unknown,
): Result<ActivityRuntime, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "ACTIVITY_OCCURRENCE_INVALID",
        "Activity runtime must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.activityId !== "string" ||
    record.activityId.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "ACTIVITY_IDENTITY_INVALID",
        "Activity.activityId must be a non-empty string.",
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
        "ACTIVITY_SEQUENCE_INVALID",
        "Activity.creationSequence must be a positive integer.",
      ),
    );
  }
  if (
    typeof record.status !== "string" ||
    !isActivityLifecycleState(record.status)
  ) {
    return err(
      ruleViolationError(
        "ACTIVITY_OCCURRENCE_INVALID",
        `Unsupported Activity status '${String(record.status)}'.`,
      ),
    );
  }
  if (typeof record.createdAt !== "string") {
    return err(
      ruleViolationError(
        "ACTIVITY_OCCURRENCE_INVALID",
        "Activity.createdAt must be an ISO timestamp string.",
      ),
    );
  }
  if (
    typeof record.originatingCommandId !== "string" ||
    record.originatingCommandId.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "ACTIVITY_OCCURRENCE_INVALID",
        "Activity.originatingCommandId must be a non-empty string.",
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
        "ACTIVITY_CONTENT_INVALID",
        "Activity.content must be an object.",
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
        "ACTIVITY_PROVENANCE_INVALID",
        "Activity.source must be an object.",
      ),
    );
  }

  const contentRecord = record.content as Record<string, unknown>;
  const sourceRecord = record.source as Record<string, unknown>;
  if (
    typeof sourceRecord.kind !== "string" ||
    !isActivitySourceKind(sourceRecord.kind)
  ) {
    return err(
      ruleViolationError(
        "ACTIVITY_PROVENANCE_INVALID",
        `Unsupported Activity source kind '${String(sourceRecord.kind)}'.`,
      ),
    );
  }

  const content = createActivityLearnerSafeContent({
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
  const source = createActivityProvenance({
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

  if (record.status === "active") {
    if (record.completedAt !== null || record.completionSequence !== null) {
      return err(
        ruleViolationError(
          "ACTIVITY_OCCURRENCE_INVALID",
          "Active Activity must not carry completion metadata.",
        ),
      );
    }
    if (record.completingCommandId !== null) {
      return err(
        ruleViolationError(
          "ACTIVITY_OCCURRENCE_INVALID",
          "Active Activity must not carry completingCommandId.",
        ),
      );
    }
    return createActivityRuntime({
      activityId: record.activityId as ActivityId,
      creationSequence: record.creationSequence,
      content: content.value,
      source: source.value,
      createdAt: asIsoTimestamp(record.createdAt),
      originatingCommandId: record.originatingCommandId as CommandId,
    });
  }

  if (typeof record.completedAt !== "string") {
    return err(
      ruleViolationError(
        "ACTIVITY_COMPLETION_TIME_INVALID",
        "Completed Activity.completedAt must be an ISO timestamp string.",
      ),
    );
  }
  if (
    typeof record.completionSequence !== "number" ||
    !Number.isInteger(record.completionSequence) ||
    record.completionSequence < 1
  ) {
    return err(
      ruleViolationError(
        "ACTIVITY_COMPLETION_SEQUENCE_INVALID",
        "Completed Activity.completionSequence must be a positive integer.",
      ),
    );
  }
  if (
    typeof record.completingCommandId !== "string" ||
    record.completingCommandId.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "ACTIVITY_OCCURRENCE_INVALID",
        "Completed Activity.completingCommandId must be a non-empty string.",
      ),
    );
  }

  const active = createActivityRuntime({
    activityId: record.activityId as ActivityId,
    creationSequence: record.creationSequence,
    content: content.value,
    source: source.value,
    createdAt: asIsoTimestamp(record.createdAt),
    originatingCommandId: record.originatingCommandId as CommandId,
  });
  if (!active.ok) {
    return active;
  }
  return completeActivityRuntime({
    activity: active.value,
    completedAt: asIsoTimestamp(record.completedAt),
    completionSequence: record.completionSequence,
    completingCommandId: record.completingCommandId as CommandId,
  });
};
