import { describe, expect, it } from "vitest";
import {
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asIsoTimestamp,
  asLearnerId,
  asNotificationId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createNotificationLearnerSafeContent,
  createNotificationProvenance,
  createNotificationRuntime,
  type NotificationRuntime,
  type SimulationRun,
  type SimulationState,
} from "../index";
import {
  buildNotificationsProjection,
  computeNotificationsSemanticHash,
} from "./notifications-builder";
import {
  NOTIFICATIONS_PROJECTION_SCHEMA_VERSION,
  NOTIFICATIONS_PROJECTION_TYPE,
} from "./notifications-contracts";
import { parseNotificationsProjection } from "./notifications-payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_1"),
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
  startedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  updatedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  state: createInitialSimulationState(),
  ...overrides,
});

const runtime = (input: {
  readonly id: string;
  readonly sequence: number;
  readonly title?: string;
  readonly summary?: string;
}): NotificationRuntime => {
  const content = createNotificationLearnerSafeContent({
    title: input.title ?? `Notification ${input.id}`,
    summary: input.summary ?? "Attention summary",
    body: null,
  });
  if (!content.ok) {
    throw new Error("content failed");
  }
  const source = createNotificationProvenance({
    kind: "meeting",
    sourceId: "meeting_1",
    reason: "made_available",
  });
  if (!source.ok) {
    throw new Error("source failed");
  }
  const created = createNotificationRuntime({
    notificationId: asNotificationId(input.id),
    creationSequence: input.sequence,
    content: content.value,
    source: source.value,
    createdAt: now,
    originatingCommandId: asCommandId(`cmd_notif_${input.sequence}`),
  });
  if (!created.ok) {
    throw new Error("runtime failed");
  }
  return created.value;
};

const stateWith = (
  notifications: readonly NotificationRuntime[],
): SimulationState => ({
  ...createInitialSimulationState(),
  notifications: [...notifications],
});

const buildFor = (run: SimulationRun, generatedAt = now) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildNotificationsProjection({
    snapshot: snapshot.value,
    generatedAt,
  });
};

describe("Notifications projection", () => {
  it("builds an empty canonical payload", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    expect(built.value.projectionType).toBe(NOTIFICATIONS_PROJECTION_TYPE);
    expect(built.value.projectionSchemaVersion).toBe(
      NOTIFICATIONS_PROJECTION_SCHEMA_VERSION,
    );
    expect(built.value.notifications).toEqual([]);
    expect(built.value.summary).toEqual({
      totalNotifications: 0,
      isEmpty: true,
    });
    expect(built.value.capabilities).toEqual({
      markRead: "unsupported",
      dismiss: "unsupported",
      preferences: "unsupported",
    });
  });

  it("preserves authoritative ascending order and excludes hidden fields", () => {
    const built = buildFor(
      activeRun({
        state: stateWith([
          runtime({ id: "n_b", sequence: 2, title: "Second" }),
          runtime({ id: "n_a", sequence: 1, title: "First" }),
        ]),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    expect(
      built.value.notifications.map((item) => item.notificationId),
    ).toEqual(["n_a", "n_b"]);
    expect(built.value.notifications[0]).toMatchObject({
      title: "First",
      summary: "Attention summary",
      body: null,
      status: "active",
      source: {
        kind: "meeting",
        sourceId: "meeting_1",
        reason: "made_available",
      },
    });
    expect(built.value.notifications[0]).not.toHaveProperty(
      "originatingCommandId",
    );
    expect(built.value.notifications[0]).not.toHaveProperty("severity");
  });

  it("keeps semantic hash stable across generatedAt volatility", () => {
    const run = activeRun({
      state: stateWith([runtime({ id: "n_a", sequence: 1 })]),
    });
    const first = buildFor(run, asIsoTimestamp("2026-07-26T12:00:00.000Z"));
    const second = buildFor(run, asIsoTimestamp("2026-07-26T13:00:00.000Z"));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(computeNotificationsSemanticHash(first.value)).toBe(
      first.value.semanticHash,
    );
  });

  it("round-trips through parseNotificationsProjection", () => {
    const built = buildFor(
      activeRun({
        state: stateWith([runtime({ id: "n_a", sequence: 1 })]),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseNotificationsProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.notifications).toEqual(built.value.notifications);
  });
});
