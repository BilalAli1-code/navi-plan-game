import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  LearnerMessageDefinitionId,
  LearnerMessageOccurrenceId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import {
  INBOX_PROJECTION_SCHEMA_VERSION,
  INBOX_PROJECTION_TYPE,
  type InboxCapabilities,
  type InboxClassificationCounts,
  type InboxMessage,
  type InboxProjection,
} from "./inbox-contracts";
import type { ProjectionSafeInboxClassification } from "./content";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseCapabilities = (
  value: unknown,
): Result<InboxCapabilities, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    value.readState !== "unsupported" ||
    value.archive !== "unsupported" ||
    value.reply !== "unsupported" ||
    value.compose !== "unsupported"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox capabilities must mark read/archive/reply/compose as unsupported.",
      ),
    );
  }
  return ok({
    readState: "unsupported",
    archive: "unsupported",
    reply: "unsupported",
    compose: "unsupported",
  });
};

const inboxClassifications: readonly ProjectionSafeInboxClassification[] = [
  "informational",
  "action_required",
  "decision_bearing",
];

const linkedDecisionStatuses = [
  "none",
  "pending",
  "submitted",
  "resolved",
] as const;

const actionStates = ["informational", "action_required", "completed"] as const;

const parseClassificationCounts = (
  value: unknown,
  messages: readonly InboxMessage[],
): Result<InboxClassificationCounts, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox classificationCounts are invalid.",
      ),
    );
  }
  const counts = {
    informational: 0,
    action_required: 0,
    decision_bearing: 0,
  };
  for (const key of inboxClassifications) {
    const count = value[key];
    if (
      typeof count !== "number" ||
      !Number.isInteger(count) ||
      (count as number) < 0
    ) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Inbox classificationCounts are invalid.",
        ),
      );
    }
    counts[key] = count as number;
  }
  const expected = {
    informational: 0,
    action_required: 0,
    decision_bearing: 0,
  };
  for (const message of messages) {
    expected[message.classification] += 1;
  }
  if (
    counts.informational !== expected.informational ||
    counts.action_required !== expected.action_required ||
    counts.decision_bearing !== expected.decision_bearing
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox classificationCounts must match message classifications.",
      ),
    );
  }
  return ok(counts);
};

const parseMessage = (
  value: unknown,
): Result<InboxMessage, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.messageId !== "string" ||
    value.messageId.trim().length === 0 ||
    typeof value.definitionId !== "string" ||
    value.definitionId.trim().length === 0 ||
    typeof value.definitionVersion !== "string" ||
    value.definitionVersion.trim().length === 0 ||
    typeof value.sequence !== "number" ||
    !Number.isInteger(value.sequence) ||
    value.sequence < 1 ||
    (value.deliveredAt !== null && typeof value.deliveredAt !== "string") ||
    !isPlainObject(value.sender) ||
    typeof value.sender.displayName !== "string" ||
    value.sender.displayName.trim().length === 0 ||
    typeof value.subject !== "string" ||
    value.subject.trim().length === 0 ||
    typeof value.preview !== "string" ||
    value.preview.trim().length === 0 ||
    typeof value.body !== "string" ||
    value.body.trim().length === 0 ||
    typeof value.classification !== "string" ||
    !inboxClassifications.includes(
      value.classification as ProjectionSafeInboxClassification,
    ) ||
    (value.relatedDecisionId !== null &&
      typeof value.relatedDecisionId !== "string") ||
    (value.relatedMeetingId !== null &&
      typeof value.relatedMeetingId !== "string") ||
    !Array.isArray(value.relatedDocumentIds) ||
    typeof value.linkedDecisionStatus !== "string" ||
    !linkedDecisionStatuses.includes(
      value.linkedDecisionStatus as (typeof linkedDecisionStatuses)[number],
    ) ||
    typeof value.actionState !== "string" ||
    !actionStates.includes(value.actionState as (typeof actionStates)[number])
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox message is invalid.",
      ),
    );
  }
  if (value.deliveredAt !== null) {
    const parsed = Date.parse(value.deliveredAt);
    if (Number.isNaN(parsed)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Inbox message deliveredAt must be a valid ISO timestamp or null.",
        ),
      );
    }
  }
  if (
    value.sender.senderId !== null &&
    value.sender.senderId !== undefined &&
    typeof value.sender.senderId !== "string"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox message sender.senderId must be a string or null.",
      ),
    );
  }
  if (
    value.sender.roleLabel !== null &&
    value.sender.roleLabel !== undefined &&
    typeof value.sender.roleLabel !== "string"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox message sender.roleLabel must be a string or null.",
      ),
    );
  }
  for (const documentId of value.relatedDocumentIds) {
    if (typeof documentId !== "string" || documentId.trim().length === 0) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Inbox message relatedDocumentIds must be non-empty strings.",
        ),
      );
    }
  }
  // Reject fabricated lifecycle fields if present on stored rows.
  for (const forbidden of [
    "read",
    "unread",
    "archived",
    "replied",
    "status",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Inbox message must not include unsupported field '${forbidden}'.`,
        ),
      );
    }
  }

  return ok({
    messageId: value.messageId as LearnerMessageOccurrenceId,
    definitionId: value.definitionId as LearnerMessageDefinitionId,
    definitionVersion: value.definitionVersion,
    sequence: value.sequence,
    deliveredAt: value.deliveredAt as IsoTimestamp | null,
    sender: {
      senderId:
        value.sender.senderId === null || value.sender.senderId === undefined
          ? null
          : (value.sender.senderId as string),
      displayName: value.sender.displayName,
      roleLabel:
        value.sender.roleLabel === null || value.sender.roleLabel === undefined
          ? null
          : (value.sender.roleLabel as string),
    },
    subject: value.subject,
    preview: value.preview,
    body: value.body,
    classification: value.classification as ProjectionSafeInboxClassification,
    relatedDecisionId:
      value.relatedDecisionId === null || value.relatedDecisionId === undefined
        ? null
        : String(value.relatedDecisionId),
    relatedMeetingId:
      value.relatedMeetingId === null || value.relatedMeetingId === undefined
        ? null
        : String(value.relatedMeetingId),
    relatedDocumentIds: value.relatedDocumentIds.map((id) => String(id)),
    linkedDecisionStatus: value.linkedDecisionStatus as
      "none" | "pending" | "submitted" | "resolved",
    actionState: value.actionState as
      "informational" | "action_required" | "completed",
  });
};

/**
 * Validate persisted Inbox JSON before returning it as a typed contract.
 */
export const parseInboxProjection = (
  value: unknown,
): Result<InboxProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== INBOX_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (value.projectionSchemaVersion !== INBOX_PROJECTION_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Inbox schema version '${String(value.projectionSchemaVersion)}'.`,
      ),
    );
  }
  if (
    typeof value.projectionId !== "string" ||
    typeof value.tenantId !== "string" ||
    typeof value.simulationRunId !== "string" ||
    typeof value.learnerId !== "string" ||
    typeof value.contentPackageVersionId !== "string" ||
    typeof value.sourceAggregateVersion !== "number" ||
    typeof value.sourceStateVersion !== "number" ||
    typeof value.sourceActionSequence !== "number" ||
    typeof value.generatedAt !== "string" ||
    typeof value.semanticHash !== "string" ||
    !Array.isArray(value.messages) ||
    !isPlainObject(value.summary)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox semanticHash is invalid.",
      ),
    );
  }

  const position = assertProjectionSourcePosition({
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
  });
  if (!position.ok) {
    return position;
  }

  const capabilities = parseCapabilities(value.capabilities);
  if (!capabilities.ok) {
    return capabilities;
  }

  const messages: InboxMessage[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.messages) {
    const parsed = parseMessage(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenIds.has(parsed.value.messageId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Inbox messages must have unique messageId values.",
        ),
      );
    }
    seenIds.add(parsed.value.messageId);
    messages.push(parsed.value);
  }

  // Presentation order must remain newest-first as produced by the builder.
  for (let index = 1; index < messages.length; index += 1) {
    const previous = messages[index - 1]!;
    const current = messages[index]!;
    if (current.sequence > previous.sequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Inbox messages must be ordered newest-first by sequence.",
        ),
      );
    }
  }

  if (
    typeof value.summary.totalMessages !== "number" ||
    !Number.isInteger(value.summary.totalMessages) ||
    value.summary.totalMessages < 0 ||
    typeof value.summary.isEmpty !== "boolean"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox summary is invalid.",
      ),
    );
  }
  if (value.summary.totalMessages !== messages.length) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox summary.totalMessages must equal messages length.",
      ),
    );
  }
  if (value.summary.isEmpty !== (messages.length === 0)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Inbox summary.isEmpty must match empty messages.",
      ),
    );
  }

  const classificationCounts = parseClassificationCounts(
    value.summary.classificationCounts,
    messages,
  );
  if (!classificationCounts.ok) {
    return classificationCounts;
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: INBOX_PROJECTION_TYPE,
    projectionSchemaVersion: INBOX_PROJECTION_SCHEMA_VERSION,
    tenantId: value.tenantId as TenantId,
    simulationRunId: value.simulationRunId as SimulationRunId,
    learnerId: value.learnerId as LearnerId,
    contentPackageVersionId:
      value.contentPackageVersionId as ContentPackageVersionId,
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
    sourceEventId:
      value.sourceEventId === null || value.sourceEventId === undefined
        ? null
        : (value.sourceEventId as EventId),
    generatedAt: value.generatedAt as IsoTimestamp,
    semanticHash: asProjectionHash(value.semanticHash),
    messages,
    summary: {
      totalMessages: value.summary.totalMessages,
      isEmpty: value.summary.isEmpty,
      classificationCounts: classificationCounts.value,
    },
    capabilities: capabilities.value,
  });
};

export const serializeInboxProjection = (
  projection: InboxProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
