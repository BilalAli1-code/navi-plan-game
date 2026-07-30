import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { NotificationRuntime } from "../simulation/run/notification";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  NOTIFICATIONS_PROJECTION_SCHEMA_VERSION,
  NOTIFICATIONS_PROJECTION_TYPE,
  type NotificationsCapabilities,
  type NotificationsItem,
  type NotificationsProjection,
  type NotificationsSummary,
} from "./notifications-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildNotificationsProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const UNSUPPORTED_CAPABILITIES: NotificationsCapabilities = {
  markRead: "unsupported",
  dismiss: "unsupported",
  preferences: "unsupported",
};

const toNotificationsItem = (
  notification: NotificationRuntime,
): NotificationsItem => ({
  notificationId: notification.notificationId,
  creationSequence: notification.creationSequence,
  title: notification.content.title,
  summary: notification.content.summary,
  body: notification.content.body,
  source: {
    kind: notification.source.kind,
    sourceId: notification.source.sourceId,
    reason: notification.source.reason,
  },
  status: notification.status,
  createdAt: notification.createdAt,
});

const summarize = (
  notifications: readonly NotificationsItem[],
): NotificationsSummary => ({
  totalNotifications: notifications.length,
  isEmpty: notifications.length === 0,
});

/**
 * Pure Notifications projection builder (PS-ROADMAP-021).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, repository access,
 * aggregate mutation, severity inference, unread derivation, or event mirroring.
 *
 * Source of truth: authoritative SimulationRun snapshot `notifications`.
 * Ordering: creationSequence ascending; stable tie-break by NotificationId.
 */
export const buildNotificationsProjection = (
  input: BuildNotificationsProjectionInput,
): Result<NotificationsProjection, RuleViolationError> => {
  const { snapshot, generatedAt } = input;
  const runtimes = snapshot.notifications;

  const seenIds = new Set<string>();
  for (const notification of runtimes) {
    if (seenIds.has(notification.notificationId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Notifications source contains duplicate Notification IDs.",
          { notificationId: notification.notificationId },
        ),
      );
    }
    seenIds.add(notification.notificationId);
  }

  const ordered = [...runtimes].sort((a, b) => {
    if (a.creationSequence !== b.creationSequence) {
      return a.creationSequence - b.creationSequence;
    }
    return a.notificationId.localeCompare(b.notificationId);
  });

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!;
    const current = ordered[index]!;
    if (current.creationSequence <= previous.creationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Notification creationSequence values must be unique and strictly increasing.",
        ),
      );
    }
  }

  const notifications = ordered.map(toNotificationsItem);

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: NOTIFICATIONS_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: NOTIFICATIONS_PROJECTION_TYPE,
    projectionSchemaVersion: NOTIFICATIONS_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    notifications,
    summary: summarize(notifications),
    capabilities: UNSUPPORTED_CAPABILITIES,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeNotificationsSemanticHash(withoutHash),
  });
};

export type SemanticNotificationsInput = Omit<
  NotificationsProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticNotificationsPayload = (
  projection: SemanticNotificationsInput,
): Readonly<Record<string, unknown>> => ({
  projectionId: projection.projectionId,
  projectionType: projection.projectionType,
  projectionSchemaVersion: projection.projectionSchemaVersion,
  tenantId: projection.tenantId,
  simulationRunId: projection.simulationRunId,
  learnerId: projection.learnerId,
  contentPackageVersionId: projection.contentPackageVersionId,
  sourceAggregateVersion: projection.sourceAggregateVersion,
  sourceStateVersion: projection.sourceStateVersion,
  sourceActionSequence: projection.sourceActionSequence,
  notifications: projection.notifications,
  summary: projection.summary,
  capabilities: projection.capabilities,
});

export const computeNotificationsSemanticHash = (
  projection: SemanticNotificationsInput,
) =>
  computeSemanticHashFromStableValue(semanticNotificationsPayload(projection));
