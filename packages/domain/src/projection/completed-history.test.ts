import { describe, expect, it } from "vitest";
import {
  asActivityId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  completeActivityRuntime,
  createActivityLearnerSafeContent,
  createActivityProvenance,
  createActivityRuntime,
  createInitialSimulationState,
  type ActivityRuntime,
  type SimulationRun,
  type SimulationState,
} from "../index";
import {
  buildCompletedHistoryProjection,
  computeCompletedHistorySemanticHash,
} from "./completed-history-builder";
import {
  COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION,
  COMPLETED_HISTORY_PROJECTION_TYPE,
} from "./completed-history-contracts";
import { parseCompletedHistoryProjection } from "./completed-history-payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");
const later = asIsoTimestamp("2026-07-26T13:00:00.000Z");

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

const makeActive = (input: {
  readonly id: string;
  readonly sequence: number;
  readonly title?: string;
}): ActivityRuntime => {
  const content = createActivityLearnerSafeContent({
    title: input.title ?? `Activity ${input.id}`,
    summary: "Activity summary",
    body: null,
  });
  if (!content.ok) {
    throw new Error("content failed");
  }
  const source = createActivityProvenance({
    kind: "simulation",
    sourceId: null,
    reason: null,
  });
  if (!source.ok) {
    throw new Error("source failed");
  }
  const created = createActivityRuntime({
    activityId: asActivityId(input.id),
    creationSequence: input.sequence,
    content: content.value,
    source: source.value,
    createdAt: now,
    originatingCommandId: asCommandId(`cmd_act_${input.sequence}`),
  });
  if (!created.ok) {
    throw new Error("runtime failed");
  }
  return created.value;
};

const makeCompleted = (
  active: ActivityRuntime,
  completionSequence: number,
): ActivityRuntime => {
  const completed = completeActivityRuntime({
    activity: active,
    completedAt: later,
    completionSequence,
    completingCommandId: asCommandId(`cmd_complete_${completionSequence}`),
  });
  if (!completed.ok) {
    throw new Error("complete failed");
  }
  return completed.value;
};

const stateWith = (
  activities: readonly ActivityRuntime[],
): SimulationState => ({
  ...createInitialSimulationState(),
  activities: [...activities],
});

const buildFor = (run: SimulationRun, generatedAt = now) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildCompletedHistoryProjection({
    snapshot: snapshot.value,
    generatedAt,
  });
};

describe("Completed History projection", () => {
  it("builds an empty canonical payload", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    expect(built.value.projectionType).toBe(COMPLETED_HISTORY_PROJECTION_TYPE);
    expect(built.value.projectionSchemaVersion).toBe(
      COMPLETED_HISTORY_PROJECTION_SCHEMA_VERSION,
    );
    expect(built.value.completedItems).toEqual([]);
    expect(built.value.summary).toEqual({
      totalCompleted: 0,
      isEmpty: true,
    });
    expect(built.value.capabilities).toEqual({
      reopen: "unsupported",
      clear: "unsupported",
      export: "unsupported",
    });
  });

  it("filters to completed activities only, orders descending by completionSequence", () => {
    const act1Active = makeActive({ id: "act_1", sequence: 1 });
    const act2Active = makeActive({ id: "act_2", sequence: 2 });
    const act3Active = makeActive({
      id: "act_3",
      sequence: 3,
      title: "Still active",
    });
    const act1Completed = makeCompleted(act1Active, 1);
    const act2Completed = makeCompleted(act2Active, 2);
    const built = buildFor(
      activeRun({
        state: stateWith([act1Completed, act2Completed, act3Active]),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    // Only completed; ordered descending by completionSequence
    expect(built.value.completedItems.map((item) => item.activityId)).toEqual([
      "act_2",
      "act_1",
    ]);
    expect(built.value.completedItems[0]).toMatchObject({
      completionSequence: 2,
      status: "completed",
    });
    expect(built.value.completedItems[0]).not.toHaveProperty(
      "completingCommandId",
    );
    expect(built.value.completedItems[0]).not.toHaveProperty(
      "originatingCommandId",
    );
  });

  it("keeps semantic hash stable across generatedAt volatility", () => {
    const act = makeActive({ id: "act_a", sequence: 1 });
    const completed = makeCompleted(act, 1);
    const run = activeRun({
      state: stateWith([completed]),
    });
    const first = buildFor(run, asIsoTimestamp("2026-07-26T12:00:00.000Z"));
    const second = buildFor(run, asIsoTimestamp("2026-07-26T13:00:00.000Z"));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(computeCompletedHistorySemanticHash(first.value)).toBe(
      first.value.semanticHash,
    );
  });

  it("round-trips through parseCompletedHistoryProjection", () => {
    const act = makeActive({ id: "act_a", sequence: 1 });
    const completed = makeCompleted(act, 1);
    const built = buildFor(
      activeRun({
        state: stateWith([completed]),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseCompletedHistoryProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.completedItems).toEqual(built.value.completedItems);
    expect(parsed.value.summary.totalCompleted).toBe(1);
  });
});
