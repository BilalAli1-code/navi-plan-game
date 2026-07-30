import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionRecordId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  processSubmitDecision,
  submitDecision,
  type DecisionDefinition,
  type SimulationRun,
} from "../index";
import { buildSimulationProjection } from "./builder";
import {
  emptyProjectionSafeCatalog,
  type ProjectionSafeContent,
} from "./content";
import { computeProjectionSemanticHash } from "./hash";
import { parseSimulationProjection } from "./payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";
import { compareProjectionSourcePosition } from "./source-position";

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
  return buildSimulationProjection({
    snapshot: snapshot.value,
    eligibilityDefinitions: defs,
    projectionContent: projectionContent(defs),
    generatedAt,
  });
};

describe("buildSimulationProjection", () => {
  it("projects created/active/paused/completed/failed/archived run statuses", () => {
    for (const status of [
      "created",
      "active",
      "paused",
      "completed",
      "failed",
      "archived",
    ] as const) {
      const result = buildFor(activeRun({ status }));
      expect(result.ok).toBe(true);
      if (!result.ok) {
        continue;
      }
      expect(result.value.run.status).toBe(status);
      if (status !== "active") {
        expect(result.value.availableDecisions).toEqual([]);
      }
    }
  });

  it("exposes available decisions for an active run with no history", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.availableDecisions).toHaveLength(1);
    expect(result.value.availableDecisions[0]?.decisionDefinitionId).toBe(
      decisionDefinitionId,
    );
    expect(result.value.decisionHistory).toEqual([]);
    expect(result.value.project.status).toBe("initiated");
    expect(result.value.project.metrics.map((m) => m.metricKey)).toEqual(
      [...result.value.project.metrics.map((m) => m.metricKey)].sort(),
    );
  });

  it("moves available → submitted → resolved in history and updates metrics/state", () => {
    const submitted = submitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_a"),
      definition: definition(),
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
    });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) {
      return;
    }
    const submittedProjection = buildFor(submitted.value.run);
    expect(submittedProjection.ok).toBe(true);
    if (!submittedProjection.ok) {
      return;
    }
    expect(submittedProjection.value.availableDecisions).toEqual([]);
    expect(submittedProjection.value.decisionHistory).toHaveLength(1);
    expect(submittedProjection.value.decisionHistory[0]?.status).toBe(
      "submitted",
    );
    expect(
      submittedProjection.value.decisionHistory[0]?.qualityClassification,
    ).toBeNull();

    let eventCounter = 0;
    const resolved = processSubmitDecision(activeRun(), {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_a"),
      definition: definition(),
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_extra_${(eventCounter += 1)}`),
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) {
      return;
    }
    const resolvedProjection = buildFor(resolved.value.run);
    expect(resolvedProjection.ok).toBe(true);
    if (!resolvedProjection.ok) {
      return;
    }
    expect(resolvedProjection.value.availableDecisions).toEqual([]);
    expect(resolvedProjection.value.decisionHistory[0]?.status).toBe(
      "resolved",
    );
    expect(
      resolvedProjection.value.decisionHistory[0]?.selectedOptionLabel,
    ).toBe("Label option_a");
    expect(
      resolvedProjection.value.decisionHistory[0]?.publicResultSummary,
    ).toBe("Public summary A");
    expect(
      resolvedProjection.value.decisionHistory[0]?.qualityClassification,
    ).toBeNull();
    expect(resolvedProjection.value.project.status).toBe("planning");
    // Hidden consequence / schedule / signal payloads must not appear.
    const serialized = JSON.stringify(resolvedProjection.value);
    expect(serialized).not.toContain("FIXTURE_BUDGET_DELTA");
    expect(serialized).not.toContain("FIXTURE_DELAYED_REVIEW");
    expect(serialized).not.toContain("competency_delta");
    expect(serialized).not.toContain("sentiment_delta");
    expect(serialized).not.toContain("schedule_event");
    expect(serialized).not.toContain("applicationKey");
  });

  it("orders decisions/options/history deterministically", () => {
    const secondId = asDecisionId("decision_2");
    const defs = [
      definition({ id: secondId }),
      definition({ id: decisionDefinitionId }),
    ];
    // Fix options decisionDefinitionId for second definition
    const fixedDefs: DecisionDefinition[] = [
      {
        ...createScaffoldDecisionDefinition({
          id: decisionDefinitionId,
          contentPackageVersionId,
        }),
      },
      {
        ...createScaffoldDecisionDefinition({
          id: secondId,
          contentPackageVersionId,
        }),
      },
    ];
    const content = projectionContent(fixedDefs);
    const swapped: ProjectionSafeContent = {
      ...content,
      decisions: [
        { ...content.decisions[1]!, authoredOrder: 1 },
        { ...content.decisions[0]!, authoredOrder: 0 },
      ],
    };
    const snapshot = toSimulationRunReadSnapshot(activeRun());
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) {
      return;
    }
    const result = buildSimulationProjection({
      snapshot: snapshot.value,
      eligibilityDefinitions: fixedDefs,
      projectionContent: swapped,
      generatedAt: now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(
      result.value.availableDecisions.map((d) => d.decisionDefinitionId),
    ).toEqual([decisionDefinitionId, secondId]);
    expect(
      result.value.availableDecisions[0]?.options.map((o) => o.optionId),
    ).toEqual([asDecisionOptionId("option_a"), asDecisionOptionId("option_b")]);
    void defs;
  });

  it("excludes expired and prerequisite-blocked decisions from available", () => {
    const expired = definition({
      expiresAt: asIsoTimestamp("2026-07-25T11:00:00.000Z"),
    });
    const blockedId = asDecisionId("decision_blocked");
    const blocked = {
      ...createScaffoldDecisionDefinition({
        id: blockedId,
        contentPackageVersionId,
        prerequisiteDecisionIds: [decisionDefinitionId],
      }),
    };
    const result = buildFor(activeRun(), [expired, blocked]);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.availableDecisions).toEqual([]);
  });

  it("fails closed on content version mismatch", () => {
    const snapshot = toSimulationRunReadSnapshot(activeRun());
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) {
      return;
    }
    const result = buildSimulationProjection({
      snapshot: snapshot.value,
      eligibilityDefinitions: [definition()],
      projectionContent: {
        contentPackageVersionId: asContentPackageVersionId("cpv_other"),
        ...emptyProjectionSafeCatalog(),
        decisions: [],
      },
      generatedAt: now,
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("PROJECTION_CONTENT_VERSION_MISMATCH");
  });

  it("keeps semantic hash stable across generatedAt and sourceEventId changes", () => {
    const snapshot = toSimulationRunReadSnapshot(activeRun());
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) {
      return;
    }
    const first = buildSimulationProjection({
      snapshot: snapshot.value,
      eligibilityDefinitions: [definition()],
      projectionContent: projectionContent(),
      generatedAt: now,
      sourceEvent: {
        eventId: asEventId("evt_a"),
        eventType: "DecisionResolved",
      },
    });
    const second = buildSimulationProjection({
      snapshot: snapshot.value,
      eligibilityDefinitions: [definition()],
      projectionContent: projectionContent(),
      generatedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
      sourceEvent: {
        eventId: asEventId("evt_b"),
        eventType: "ProjectMetricChanged",
      },
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(first.value.generatedAt).not.toBe(second.value.generatedAt);
    expect(first.value.sourceEventId).not.toBe(second.value.sourceEventId);
    const recomputed = computeProjectionSemanticHash({
      ...first.value,
    });
    expect(recomputed).toBe(first.value.semanticHash);
    expect(first.value.semanticHash.startsWith("fnv1a64:v1:")).toBe(true);
  });

  it("round-trips through payload validation", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseSimulationProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.semanticHash).toBe(built.value.semanticHash);
  });

  it("rejects unsupported projection schema versions and malformed hashes", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseSimulationProjection({
      ...built.value,
      projectionSchemaVersion: 999,
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      return;
    }
    expect(parsed.error.code).toBe("PROJECTION_SCHEMA_UNSUPPORTED");

    const badHash = parseSimulationProjection({
      ...built.value,
      semanticHash: "not-a-valid-hash",
    });
    expect(badHash.ok).toBe(false);
    if (badHash.ok) {
      return;
    }
    expect(badHash.error.code).toBe("PROJECTION_PAYLOAD_INVALID");

    const badSource = parseSimulationProjection({
      ...built.value,
      sourceAggregateVersion: -1,
    });
    expect(badSource.ok).toBe(false);
    if (badSource.ok) {
      return;
    }
    expect(badSource.error.code).toBe("PROJECTION_SOURCE_INVALID");
  });
});

describe("compareProjectionSourcePosition", () => {
  it("compares aggregateVersion, then stateVersion, then actionSequence", () => {
    expect(
      compareProjectionSourcePosition(
        {
          sourceAggregateVersion: 1,
          sourceStateVersion: 5,
          sourceActionSequence: 9,
        },
        {
          sourceAggregateVersion: 2,
          sourceStateVersion: 0,
          sourceActionSequence: 0,
        },
      ),
    ).toBe("older");
    expect(
      compareProjectionSourcePosition(
        {
          sourceAggregateVersion: 2,
          sourceStateVersion: 1,
          sourceActionSequence: 0,
        },
        {
          sourceAggregateVersion: 2,
          sourceStateVersion: 2,
          sourceActionSequence: 0,
        },
      ),
    ).toBe("older");
    expect(
      compareProjectionSourcePosition(
        {
          sourceAggregateVersion: 2,
          sourceStateVersion: 2,
          sourceActionSequence: 1,
        },
        {
          sourceAggregateVersion: 2,
          sourceStateVersion: 2,
          sourceActionSequence: 3,
        },
      ),
    ).toBe("older");
    expect(
      compareProjectionSourcePosition(
        {
          sourceAggregateVersion: 2,
          sourceStateVersion: 2,
          sourceActionSequence: 3,
        },
        {
          sourceAggregateVersion: 2,
          sourceStateVersion: 2,
          sourceActionSequence: 3,
        },
      ),
    ).toBe("equal");
  });
});

describe("eligibility parity", () => {
  it("available projection decisions pass the same eligibility policy as SubmitDecision", () => {
    const run = activeRun();
    const def = definition();
    const projection = buildFor(run, [def]);
    expect(projection.ok).toBe(true);
    if (!projection.ok) {
      return;
    }
    expect(projection.value.availableDecisions).toHaveLength(1);
    let eventCounter = 0;
    const submit = processSubmitDecision(run, {
      decisionRecordId: asDecisionRecordId("decision_record_1"),
      decisionDefinitionId,
      selectedOptionId: asDecisionOptionId("option_a"),
      definition: def,
      sourceActionId: asActionRecordId("action_1"),
      submittedBy: asActorId("actor_1"),
      submittedAt: now,
      recordedAt: now,
      eventId: asEventId("evt_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      allocateEventId: () => asEventId(`evt_extra_${(eventCounter += 1)}`),
    });
    expect(submit.ok).toBe(true);
  });
});
