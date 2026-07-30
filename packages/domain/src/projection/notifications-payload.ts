import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  NotificationId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import {
  isNotificationLifecycleState,
  isNotificationSourceKind,
} from "../simulation/run/notification";
import {
  NOTIFICATIONS_PROJECTION_SCHEMA_VERSION,
  NOTIFICATIONS_PROJECTION_TYPE,
  type NotificationsCapabilities,
  type NotificationsItem,
  type NotificationsProjection,
  type NotificationsSummary,
  type NotificationSourceProjection,
} from "./notifications-contracts";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseCapabilities = (
  value: unknown,
): Result<NotificationsCapabilities, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    value.markRead !== "unsupported" ||
    value.dismiss !== "unsupported" ||
    value.preferences !== "unsupported"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Notifications capabilities must mark markRead/dismiss/preferences as unsupported.",
      ),
    );
  }
  return ok({
    markRead: "unsupported",
    dismiss: "unsupported",
    preferences: "unsupported",
  });
};

const parseSource = (
  value: unknown,
): Result<NotificationSourceProjection, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.kind !== "string" ||
    !isNotificationSourceKind(value.kind) ||
    (value.sourceId !== null && typeof value.sourceId !== "string") ||
    (value.reason !== null && typeof value.reason !== "string")
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Notification source is invalid.",
      ),
    );
  }
  return ok({
    kind: value.kind,
    sourceId: value.sourceId as string | null,
    reason: value.reason as string | null,
  });
};

const parseNotificationItem = (
  value: unknown,
): Result<NotificationsItem, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.notificationId !== "string" ||
    value.notificationId.trim().length === 0 ||
    typeof value.creationSequence !== "number" ||
    !Number.isInteger(value.creationSequence) ||
    value.creationSequence < 1 ||
    typeof value.title !== "string" ||
    value.title.trim().length === 0 ||
    typeof value.summary !== "string" ||
    value.summary.trim().length === 0 ||
    (value.body !== null && typeof value.body !== "string") ||
    typeof value.status !== "string" ||
    !isNotificationLifecycleState(value.status) ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Notifications item is invalid.",
      ),
    );
  }

  for (const forbidden of [
    "originatingCommandId",
    "causationId",
    "correlationId",
    "aggregateVersion",
    "severity",
    "priority",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Notifications item must not include hidden or unsupported field '${forbidden}'.`,
        ),
      );
    }
  }

  const source = parseSource(value.source);
  if (!source.ok) {
    return source;
  }

  return ok({
    notificationId: value.notificationId as NotificationId,
    creationSequence: value.creationSequence,
    title: value.title,
    summary: value.summary,
    body: value.body as string | null,
    source: source.value,
    status: value.status,
    createdAt: value.createdAt as IsoTimestamp,
  });
};

const parseSummary = (
  value: unknown,
  notificationsLength: number,
): Result<NotificationsSummary, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.totalNotifications !== "number" ||
    !Number.isInteger(value.totalNotifications) ||
    value.totalNotifications < 0 ||
    typeof value.isEmpty !== "boolean"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Notifications summary is invalid.",
      ),
    );
  }
  if (value.totalNotifications !== notificationsLength) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Notifications summary.totalNotifications must equal notifications length.",
      ),
    );
  }
  if (value.isEmpty !== (notificationsLength === 0)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Notifications summary.isEmpty must match empty notifications.",
      ),
    );
  }
  return ok({
    totalNotifications: value.totalNotifications,
    isEmpty: value.isEmpty,
  });
};

/**
 * Validate persisted Notifications JSON before returning it as a typed contract.
 */
export const parseNotificationsProjection = (
  value: unknown,
): Result<NotificationsProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== NOTIFICATIONS_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (
    value.projectionSchemaVersion !== NOTIFICATIONS_PROJECTION_SCHEMA_VERSION
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Notifications schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !Array.isArray(value.notifications)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Notifications payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Notifications semanticHash is invalid.",
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

  const notifications: NotificationsItem[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.notifications) {
    const parsed = parseNotificationItem(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenIds.has(parsed.value.notificationId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Notifications items must have unique notificationId values.",
        ),
      );
    }
    seenIds.add(parsed.value.notificationId);
    notifications.push(parsed.value);
  }

  for (let index = 1; index < notifications.length; index += 1) {
    const previous = notifications[index - 1]!;
    const current = notifications[index]!;
    if (current.creationSequence < previous.creationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Notifications must be ordered ascending by creationSequence.",
        ),
      );
    }
  }

  const summary = parseSummary(value.summary, notifications.length);
  if (!summary.ok) {
    return summary;
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: NOTIFICATIONS_PROJECTION_TYPE,
    projectionSchemaVersion: NOTIFICATIONS_PROJECTION_SCHEMA_VERSION,
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
    notifications,
    summary: summary.value,
    capabilities: capabilities.value,
  });
};

export const serializeNotificationsProjection = (
  projection: NotificationsProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
