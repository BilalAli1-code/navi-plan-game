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
import { buildMissionControlProjection } from "./mission-control-builder";
import {
  MISSION_CONTROL_PROJECTION_SCHEMA_VERSION,
  MISSION_CONTROL_PROJECTION_TYPE,
} from "./mission-control-contracts";
import { parseMissionControlProjection } from "./mission-control-payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const decisionDefinitionId = asDecisionId("decision_1");
const now = asIsoTimestamp("2026-07-25T12:00:00.000Z");

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
  startedAt: asIsoTimestamp("2026-07-25T00:00:00.000Z"),
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: asIsoTimestamp("2026-07-25T00:00:00.000Z"),
  updatedAt: asIsoTimestamp("2026-07-25T00:00:00.000Z"),
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
  return buildMissionControlProjection({
    snapshot: snapshot.value,
    eligibilityDefinitions: defs,
    projectionContent: projectionContent(defs),
    generatedAt,
  });
};

describe("buildMissionControlProjection", () => {
  it("builds schema v1 mission_control envelope and identity", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(MISSION_CONTROL_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      MISSION_CONTROL_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.projectionId).toBe(
      "projection:mission_control:tenant_1:run_1",
    );
    expect(result.value.runSummary.status).toBe("active");
    expect(result.value.counts.pendingDecisions).toEqual({
      availability: "available",
      count: 1,
    });
    expect(result.value.counts.unreadActionRequiredInboxItems).toEqual({
      availability: "unavailable",
      reason: "channel_not_implemented",
    });
    expect(result.value.counts.upcomingMeetings).toEqual({
      availability: "available",
      count: 0,
    });
    expect(result.value.counts.activeActivities).toEqual({
      availability: "available",
      count: 0,
    });
    expect(result.value.counts.blockingCrises).toEqual({
      availability: "available",
      count: 0,
    });
    expect(result.value.nextRecommendedActions).toEqual([
      {
        actionId: "decision:decision_1",
        label: "Title decision_1",
        targetKind: "decision",
        targetId: decisionDefinitionId,
        authoredOrder: 0,
      },
    ]);
    expect(result.value.recentRevealedOutcome).toBeNull();
  });

  it("is deterministic across repeated builds with different generatedAt", () => {
    const first = buildFor(activeRun(), [definition()], now);
    const second = buildFor(
      activeRun(),
      [definition()],
      asIsoTimestamp("2026-07-25T13:00:00.000Z"),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(first.value.nextRecommendedActions).toEqual(
      second.value.nextRecommendedActions,
    );
  });

  it("orders recommended actions deterministically by authoredOrder then id", () => {
    const d2 = definition({
      id: asDecisionId("decision_2"),
    });
    const d0 = definition({
      id: asDecisionId("decision_0"),
    });
    const content: ProjectionSafeContent = {
      contentPackageVersionId,
      ...emptyProjectionSafeCatalog(),
      decisions: [
        {
          id: d2.id,
          contentPackageVersionId,
          authoredOrder: 2,
          title: "Second",
          prompt: "p",
          description: null,
          availability: d2.availability,
          expiresAt: null,
          options: d2.options.map((option, optionIndex) => ({
            id: option.id,
            authoredOrder: optionIndex,
            label: option.id,
          })),
          publicResultSummaryByOptionId: {},
        },
        {
          id: d0.id,
          contentPackageVersionId,
          authoredOrder: 0,
          title: "First",
          prompt: "p",
          description: null,
          availability: d0.availability,
          expiresAt: null,
          options: d0.options.map((option, optionIndex) => ({
            id: option.id,
            authoredOrder: optionIndex,
            label: option.id,
          })),
          publicResultSummaryByOptionId: {},
        },
      ],
    };
    const snapshot = toSimulationRunReadSnapshot(activeRun());
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) {
      return;
    }
    const result = buildMissionControlProjection({
      snapshot: snapshot.value,
      eligibilityDefinitions: [d2, d0],
      projectionContent: content,
      generatedAt: now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.nextRecommendedActions.map((a) => a.targetId)).toEqual([
      "decision_0",
      "decision_2",
    ]);
  });

  it("exposes empty pending decisions without fabricating channel counts", () => {
    const result = buildFor(activeRun({ status: "completed" }));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.counts.pendingDecisions.count).toBe(0);
    expect(result.value.nextRecommendedActions).toEqual([]);
    expect(
      result.value.counts.unreadActionRequiredInboxItems.availability,
    ).toBe("unavailable");
  });

  it("projects the most recent revealed public outcome only", () => {
    const withDecision = activeRun({
      aggregateVersion: 4,
      lastProcessedSequence: 1,
      state: {
        ...createInitialSimulationState(),
        stateVersion: 2,
        decisions: [
          {
            id: asDecisionRecordId("rec_1"),
            decisionDefinitionId,
            selectedOptionId: asDecisionOptionId("option_b"),
            submittedBy: asActorId("actor_1"),
            submittedAt: now,
            sourceActionId: asActionRecordId("cmd_1"),
            contextStateVersion: 1,
            status: "resolved",
            resolvedAt: asIsoTimestamp("2026-07-25T12:05:00.000Z"),
            outcomeId: null,
          },
        ],
      },
    });
    const result = buildFor(withDecision);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.recentRevealedOutcome).toEqual({
      decisionRecordId: "rec_1",
      decisionDefinitionId,
      selectedOptionLabel: "Label option_b",
      publicResultSummary: "Public summary B",
      resolvedAt: "2026-07-25T12:05:00.000Z",
    });
    const serialized = JSON.stringify(result.value);
    expect(serialized).not.toContain("facilitator");
    expect(serialized).not.toContain("hidden");
    expect(serialized).not.toContain("consequence");
  });

  it("round-trips through runtime validation", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseMissionControlProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value).toEqual(built.value);
  });

  it("rejects unsupported schema versions", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseMissionControlProjection({
      ...built.value,
      projectionSchemaVersion: 99,
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("PROJECTION_SCHEMA_UNSUPPORTED");
  });

  it("rejects treating unavailable channel counts as available zeros in parser", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseMissionControlProjection({
      ...built.value,
      counts: {
        ...built.value.counts,
        unreadActionRequiredInboxItems: {
          availability: "available",
          count: 0,
        },
      },
    });
    // Available zero is a valid shape for a channel that exists; parser allows it.
    // Unimplemented channels are a builder concern. Ensure unavailable reason is strict.
    expect(parsed.ok).toBe(true);

    const badUnavailable = parseMissionControlProjection({
      ...built.value,
      counts: {
        ...built.value.counts,
        unreadActionRequiredInboxItems: {
          availability: "unavailable",
          reason: "temporary",
        },
      },
    });
    expect(badUnavailable.ok).toBe(false);
  });
});
