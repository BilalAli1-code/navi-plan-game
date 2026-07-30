import { describe, expect, it } from "vitest";
import {
  asActivityId,
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createActivityLearnerSafeContent,
  createInitialSimulationState,
  parseSimulationState,
  processCompleteActivity,
  processInitializeActivity,
  serializeSimulationState,
  type SimulationRun,
} from "../../index";

const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");
const later = asIsoTimestamp("2026-07-26T13:00:00.000Z");
const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_activity");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_activity"),
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

const initInput = (activityId: string, commandSuffix = activityId) => ({
  activityId: asActivityId(activityId),
  title: `Activity ${activityId}`,
  summary: "Learner-safe activity summary",
  body: "Optional activity detail",
  sourceKind: "simulation" as const,
  sourceId: "sim_source_1",
  sourceReason: "scenario_trigger",
  commandId: asCommandId(`cmd_act_${commandSuffix}`),
  occurredAt: now,
  recordedAt: now,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  eventId: asEventId(`evt_act_${commandSuffix}`),
});

const completeInput = (activityId: string, commandSuffix = activityId) => ({
  activityId: asActivityId(activityId),
  commandId: asCommandId(`cmd_complete_${commandSuffix}`),
  occurredAt: later,
  recordedAt: later,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_2"),
  causationId: null,
  eventId: asEventId(`evt_complete_${commandSuffix}`),
});

describe("Activity runtime domain", () => {
  it("rejects markup in learner-visible content", () => {
    const content = createActivityLearnerSafeContent({
      title: "Alert",
      summary: "Do not render <script>",
    });
    expect(content.ok).toBe(false);
    if (content.ok) {
      return;
    }
    expect(content.error.code).toBe("ACTIVITY_CONTENT_INVALID");
  });

  it("initializes an active Activity with provenance and ordering", () => {
    const first = processInitializeActivity(activeRun(), initInput("act_a"));
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.identicalNoop).toBe(false);
    expect(first.value.events.map((event) => event.eventType)).toEqual([
      "ActivityInitialized",
    ]);
    expect(first.value.activity.creationSequence).toBe(1);
    expect(first.value.activity.status).toBe("active");
    expect(first.value.activity.source.kind).toBe("simulation");
    expect(first.value.run.state.schemaVersion).toBe(8);
    expect(first.value.run.state.activities).toHaveLength(1);

    const second = processInitializeActivity(
      first.value.run,
      initInput("act_b"),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value.activity.creationSequence).toBe(2);
    expect(second.value.run.state.activities).toHaveLength(2);
  });

  it("completes an Activity emitting ActivityCompleted event", () => {
    const initialized = processInitializeActivity(
      activeRun(),
      initInput("act_c"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }

    const completed = processCompleteActivity(
      initialized.value.run,
      completeInput("act_c"),
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }
    expect(completed.value.identicalNoop).toBe(false);
    expect(completed.value.events.map((event) => event.eventType)).toEqual([
      "ActivityCompleted",
    ]);
    expect(completed.value.activity.status).toBe("completed");
    expect(completed.value.activity.completionSequence).toBe(1);
    expect(completed.value.activity.completedAt).toBe(later);
    expect(completed.value.run.state.activities).toHaveLength(1);
    expect(completed.value.run.state.activities[0]?.status).toBe("completed");
  });

  it("returns identicalNoop when completing an already-completed Activity", () => {
    const initialized = processInitializeActivity(
      activeRun(),
      initInput("act_d"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }

    const firstComplete = processCompleteActivity(
      initialized.value.run,
      completeInput("act_d"),
    );
    expect(firstComplete.ok).toBe(true);
    if (!firstComplete.ok) {
      return;
    }
    expect(firstComplete.value.identicalNoop).toBe(false);

    const secondComplete = processCompleteActivity(
      firstComplete.value.run,
      completeInput("act_d", "act_d_2"),
    );
    expect(secondComplete.ok).toBe(true);
    if (!secondComplete.ok) {
      return;
    }
    expect(secondComplete.value.identicalNoop).toBe(true);
    expect(secondComplete.value.events).toEqual([]);
    expect(secondComplete.value.activity.status).toBe("completed");
  });

  it("returns ACTIVITY_NOT_FOUND when completing a non-existent activity", () => {
    const result = processCompleteActivity(
      activeRun(),
      completeInput("act_missing"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("ACTIVITY_NOT_FOUND");
  });

  it("returns ACTIVITY_IDENTITY_CONFLICT when initializing with conflicting content", () => {
    const first = processInitializeActivity(activeRun(), initInput("act_e"));
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }

    const conflict = processInitializeActivity(first.value.run, {
      ...initInput("act_e", "act_e_2"),
      title: "Different title causes conflict",
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok) {
      return;
    }
    expect(conflict.error.code).toBe("ACTIVITY_IDENTITY_CONFLICT");
    expect(first.value.run.state.activities).toHaveLength(1);
  });

  it("round-trips schema v8 and upcasts v7 states to empty Activity collections", () => {
    const initialized = processInitializeActivity(
      activeRun(),
      initInput("act_f"),
    );
    expect(initialized.ok).toBe(true);
    if (!initialized.ok) {
      return;
    }
    const serialized = serializeSimulationState(initialized.value.run.state);
    expect(serialized.schemaVersion).toBe(8);
    expect(Array.isArray(serialized.activities)).toBe(true);

    const parsed = parseSimulationState(serialized);
    expect(parsed?.schemaVersion).toBe(8);
    expect(parsed?.activities[0]?.content.title).toBe("Activity act_f");

    // Upcast from v7 (no activities field) should produce empty activities array
    const upcast = parseSimulationState({
      ...serialized,
      schemaVersion: 7,
      activities: undefined,
    });
    expect(upcast?.schemaVersion).toBe(8);
    expect(upcast?.activities).toEqual([]);
  });
});
