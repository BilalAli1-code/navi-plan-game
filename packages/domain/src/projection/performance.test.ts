import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionRecordId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  type DecisionDefinition,
  type SimulationRun,
} from "../index";
import {
  emptyProjectionSafeCatalog,
  type ProjectionSafeContent,
} from "./content";
import {
  buildPerformanceProjection,
  computePerformanceSemanticHash,
} from "./performance-builder";
import {
  PERFORMANCE_PROJECTION_SCHEMA_VERSION,
  PERFORMANCE_PROJECTION_TYPE,
} from "./performance-contracts";
import { parsePerformanceProjection } from "./performance-payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const decisionDefinitionId = asDecisionId("decision_1");
const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");

const definition = (
  overrides: Partial<DecisionDefinition> = {},
): DecisionDefinition => ({
  ...createScaffoldDecisionDefinition({
    id: decisionDefinitionId,
    contentPackageVersionId,
  }),
  ...overrides,
});

const projectionContent = (
  defs: readonly DecisionDefinition[] = [definition()],
): ProjectionSafeContent => ({
  contentPackageVersionId,
  ...emptyProjectionSafeCatalog(),
  decisions: defs.map((def, index) => ({
    id: def.id,
    contentPackageVersionId: def.contentPackageVersionId,
    authoredOrder: index,
    title: `Title ${def.id}`,
    prompt: `Prompt ${def.id}`,
    description: `Description ${def.id}`,
    availability: def.availability,
    expiresAt: def.expiresAt,
    options: def.options.map((option, optionIndex) => ({
      id: option.id,
      authoredOrder: optionIndex,
      label: `Label ${option.id}`,
    })),
    publicResultSummaryByOptionId: {
      option_a: "Public summary A",
      option_b: "Public summary B",
    },
  })),
});

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

const buildFor = (
  run: SimulationRun,
  defs: readonly DecisionDefinition[] = [definition()],
  generatedAt = now,
) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildPerformanceProjection({
    snapshot: snapshot.value,
    projectionContent: projectionContent(defs),
    generatedAt,
  });
};

describe("buildPerformanceProjection", () => {
  it("builds schema v1 performance envelope with zeroed evidence counts", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(PERFORMANCE_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      PERFORMANCE_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.projectionId).toBe(
      "projection:performance:tenant_1:run_1",
    );
    expect(result.value.decisionCounts).toEqual({ submitted: 0, resolved: 0 });
    expect(result.value.activityCounts).toEqual({ active: 0, completed: 0 });
    expect(result.value.meetingCounts).toEqual({
      upcoming: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
    });
    expect(result.value.documentCount).toBe(0);
    expect(result.value.crisisSummary).toEqual({
      activeCount: 0,
      resolvedCount: 0,
      activeCrisisIds: [],
    });
    expect(result.value.recentlyResolvedDecisions).toEqual([]);
    expect(result.value).not.toHaveProperty("xp");
    expect(result.value).not.toHaveProperty("mastery");
  });

  it("includes recently resolved decisions with public summaries only", () => {
    const withDecision = activeRun({
      aggregateVersion: 4,
      state: {
        ...createInitialSimulationState(),
        stateVersion: 3,
        decisions: [
          {
            id: asDecisionRecordId("decision_record_1"),
            decisionDefinitionId,
            selectedOptionId: asDecisionOptionId("option_a"),
            submittedBy: asActorId("learner_1"),
            submittedAt: asIsoTimestamp("2026-07-26T10:00:00.000Z"),
            sourceActionId: asActionRecordId("action_1"),
            contextStateVersion: 1,
            status: "resolved",
            outcomeId: null,
            resolvedAt: asIsoTimestamp("2026-07-26T11:00:00.000Z"),
          },
        ],
      },
    });
    const result = buildFor(withDecision);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.decisionCounts).toEqual({ submitted: 0, resolved: 1 });
    expect(result.value.recentlyResolvedDecisions).toEqual([
      {
        decisionRecordId: "decision_record_1",
        decisionDefinitionId: "decision_1",
        selectedOptionLabel: "Label option_a",
        publicResultSummary: "Public summary A",
        resolvedAt: "2026-07-26T11:00:00.000Z",
      },
    ]);
  });

  it("keeps semantic hash stable across generatedAt/sourceEventId changes", () => {
    const first = buildFor(activeRun(), [definition()], now);
    const second = buildFor(
      activeRun(),
      [definition()],
      asIsoTimestamp("2026-07-26T13:00:00.000Z"),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(
      computePerformanceSemanticHash({
        ...first.value,
        generatedAt: second.value.generatedAt,
      }),
    ).toBe(first.value.semanticHash);
  });
});

describe("parsePerformanceProjection", () => {
  it("round-trips a built projection and rejects hidden fields", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parsePerformanceProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);

    const hidden = parsePerformanceProjection({
      ...built.value,
      xp: 100,
    });
    expect(hidden.ok).toBe(false);
  });
});
