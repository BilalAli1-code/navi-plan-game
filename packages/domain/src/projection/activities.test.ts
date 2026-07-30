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
  createActivityLearnerSafeContent,
  createActivityProvenance,
  createActivityRuntime,
  createInitialSimulationState,
  type ActivityRuntime,
  type SimulationRun,
  type SimulationState,
} from "../index";
import {
  buildActivitiesProjection,
  computeActivitiesSemanticHash,
} from "./activities-builder";
import {
  ACTIVITIES_PROJECTION_SCHEMA_VERSION,
  ACTIVITIES_PROJECTION_TYPE,
} from "./activities-contracts";
import { parseActivitiesProjection } from "./activities-payload";
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
}): ActivityRuntime => {
  const content = createActivityLearnerSafeContent({
    title: input.title ?? `Activity ${input.id}`,
    summary: input.summary ?? "Activity summary",
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
  return buildActivitiesProjection({
    snapshot: snapshot.value,
    generatedAt,
  });
};

describe("Activities projection", () => {
  it("builds an empty canonical payload", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    expect(built.value.projectionType).toBe(ACTIVITIES_PROJECTION_TYPE);
    expect(built.value.projectionSchemaVersion).toBe(
      ACTIVITIES_PROJECTION_SCHEMA_VERSION,
    );
    expect(built.value.activities).toEqual([]);
    expect(built.value.summary).toEqual({
      totalActivities: 0,
      isEmpty: true,
    });
    expect(built.value.capabilities).toEqual({
      complete: "unsupported",
      reopen: "unsupported",
      assign: "unsupported",
    });
  });

  it("filters to active activities only and orders ascending by creationSequence", () => {
    const act1 = runtime({ id: "act_b", sequence: 2, title: "Second" });
    const act2 = runtime({ id: "act_a", sequence: 1, title: "First" });
    const built = buildFor(
      activeRun({
        state: stateWith([act1, act2]),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    expect(built.value.activities.map((item) => item.activityId)).toEqual([
      "act_a",
      "act_b",
    ]);
    expect(built.value.activities[0]).toMatchObject({
      title: "First",
      status: "active",
    });
    expect(built.value.activities[0]).not.toHaveProperty(
      "originatingCommandId",
    );
    expect(built.value.activities[0]).not.toHaveProperty("completingCommandId");
  });

  it("keeps semantic hash stable across generatedAt volatility", () => {
    const run = activeRun({
      state: stateWith([runtime({ id: "act_a", sequence: 1 })]),
    });
    const first = buildFor(run, asIsoTimestamp("2026-07-26T12:00:00.000Z"));
    const second = buildFor(run, asIsoTimestamp("2026-07-26T13:00:00.000Z"));
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(computeActivitiesSemanticHash(first.value)).toBe(
      first.value.semanticHash,
    );
  });

  it("round-trips through parseActivitiesProjection", () => {
    const built = buildFor(
      activeRun({
        state: stateWith([runtime({ id: "act_a", sequence: 1 })]),
      }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseActivitiesProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.activities).toEqual(built.value.activities);
  });
});
