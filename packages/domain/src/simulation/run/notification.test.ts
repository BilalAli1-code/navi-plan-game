import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asNotificationId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createNotificationLearnerSafeContent,
  parseSimulationState,
  processInitializeNotification,
  serializeSimulationState,
  type SimulationRun,
} from "../../index";

const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");
const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_notification");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_notification"),
  tenantId,
  learnerId: asLearnerId("learner_1"),
  businessCaseId: asBusinessCaseId("case_1"),
  contentPackageVersionId,
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 2,
  lastProcessedSequence: 0,
  currentChapterId: null,
  currentDayId: null,
  startedAt: now,
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  state: createInitialSimulationState(),
  ...overrides,
});

const initInput = (notificationId: string, commandSuffix = notificationId) => ({
  notificationId: asNotificationId(notificationId),
  title: `Notification ${notificationId}`,
  summary: "Learner-safe attention summary",
  body: "Optional detail body",
  sourceKind: "simulation" as const,
  sourceId: "sim_source_1",
  sourceReason: "scenario_trigger",
  commandId: asCommandId(`cmd_notif_${commandSuffix}`),
  occurredAt: now,
  recordedAt: now,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  eventId: asEventId(`evt_notif_${commandSuffix}`),
});

describe("Notification runtime domain", () => {
  it("rejects markup in learner-visible content", () => {
    const content = createNotificationLearnerSafeContent({
      title: "Alert",
      summary: "Do not render <script>",
    });
    expect(content.ok).toBe(false);
    if (content.ok) {
      return;
    }
    expect(content.error.code).toBe("NOTIFICATION_CONTENT_INVALID");
  });

  it("initializes an active Notification with provenance and ordering", () => {
    const first = processInitializeNotification(
      activeRun(),
      initInput("notif_a"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.identicalNoop).toBe(false);
    expect(first.value.events.map((event) => event.eventType)).toEqual([
      "NotificationInitialized",
    ]);
    expect(first.value.notification.creationSequence).toBe(1);
    expect(first.value.notification.status).toBe("active");
    expect(first.value.notification.source.kind).toBe("simulation");
    expect(first.value.run.state.schemaVersion).toBe(8);
    expect(first.value.run.state.notifications).toHaveLength(1);

    const second = processInitializeNotification(
      first.value.run,
      initInput("notif_b"),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value.notification.creationSequence).toBe(2);
    expect(
      second.value.run.state.notifications.map((item) => item.notificationId),
    ).toEqual(["notif_a", "notif_b"]);
  });

  it("treats identical initialization as a no-op without duplicating", () => {
    const first = processInitializeNotification(
      activeRun(),
      initInput("notif_a"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const retry = processInitializeNotification(
      first.value.run,
      initInput("notif_a", "retry"),
    );
    expect(retry.ok).toBe(true);
    if (!retry.ok) {
      return;
    }
    expect(retry.value.identicalNoop).toBe(true);
    expect(retry.value.events).toHaveLength(0);
    expect(retry.value.run.state.notifications).toHaveLength(1);
    expect(retry.value.run.aggregateVersion).toBe(
      first.value.run.aggregateVersion + 1,
    );
  });

  it("rejects conflicting initialization for the same NotificationId", () => {
    const first = processInitializeNotification(
      activeRun(),
      initInput("notif_a"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const conflict = processInitializeNotification(first.value.run, {
      ...initInput("notif_a", "conflict"),
      summary: "Different summary",
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok) {
      return;
    }
    expect(conflict.error.code).toBe("NOTIFICATION_IDENTITY_CONFLICT");
    expect(first.value.run.state.notifications).toHaveLength(1);
  });

  it("round-trips schema v8 and upcasts v6 states to empty Notification collections", () => {
    const initialized = processInitializeNotification(
      activeRun(),
      initInput("notif_a"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }
    const serialized = serializeSimulationState(initialized.value.run.state);
    expect(serialized.schemaVersion).toBe(8);
    expect(serialized.notifications).toEqual([
      {
        notificationId: "notif_a",
        creationSequence: 1,
        content: {
          title: "Notification notif_a",
          summary: "Learner-safe attention summary",
          body: "Optional detail body",
        },
        source: {
          kind: "simulation",
          sourceId: "sim_source_1",
          reason: "scenario_trigger",
        },
        status: "active",
        createdAt: now,
        originatingCommandId: "cmd_notif_notif_a",
      },
    ]);

    const parsed = parseSimulationState(serialized);
    expect(parsed?.schemaVersion).toBe(8);
    expect(parsed?.notifications[0]?.content.summary).toBe(
      "Learner-safe attention summary",
    );

    const upcast = parseSimulationState({
      ...serialized,
      schemaVersion: 6,
      notifications: undefined,
    });
    expect(upcast?.schemaVersion).toBe(8);
    expect(upcast?.notifications).toEqual([]);
  });
});
