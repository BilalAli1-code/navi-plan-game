import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  NotificationId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type {
  NotificationLifecycleState,
  NotificationSourceKind,
} from "../simulation/run/notification";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Notifications projection (PS-ROADMAP-021).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Authoritative source: SimulationState.notifications (schema v7 / PS-021).
 *
 * Distinct from Inbox (communication), Mission Control (summary), and the
 * reserved Activities / Completed History projections (PS-022).
 */

export const NOTIFICATIONS_PROJECTION_TYPE =
  "notifications" as const satisfies WorkplaceProjectionType;
export const NOTIFICATIONS_PROJECTION_SCHEMA_VERSION = 1 as const;

export type NotificationsUnsupportedCapability = "unsupported";

export interface NotificationsCapabilities {
  readonly markRead: NotificationsUnsupportedCapability;
  readonly dismiss: NotificationsUnsupportedCapability;
  readonly preferences: NotificationsUnsupportedCapability;
}

export interface NotificationSourceProjection {
  readonly kind: NotificationSourceKind;
  readonly sourceId: string | null;
  readonly reason: string | null;
}

/**
 * One public Notifications item per authoritative NotificationRuntime.
 *
 * Identity: NotificationId. Ordering: creationSequence ascending (oldest first).
 * Lifecycle v1: active-only. No severity field.
 */
export interface NotificationsItem {
  readonly notificationId: NotificationId;
  readonly creationSequence: number;
  readonly title: string;
  readonly summary: string;
  readonly body: string | null;
  readonly source: NotificationSourceProjection;
  readonly status: NotificationLifecycleState;
  readonly createdAt: IsoTimestamp;
}

export interface NotificationsSummary {
  readonly totalNotifications: number;
  readonly isEmpty: boolean;
}

export interface NotificationsProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof NOTIFICATIONS_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof NOTIFICATIONS_PROJECTION_SCHEMA_VERSION;

  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly learnerId: LearnerId;
  readonly contentPackageVersionId: ContentPackageVersionId;

  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  readonly sourceActionSequence: number;
  readonly sourceEventId: EventId | null;

  readonly generatedAt: IsoTimestamp;
  readonly semanticHash: ProjectionHash;

  /** Authoritative creationSequence ascending (oldest first). */
  readonly notifications: readonly NotificationsItem[];
  readonly summary: NotificationsSummary;
  readonly capabilities: NotificationsCapabilities;
}

export type { NotificationLifecycleState, NotificationSourceKind };
