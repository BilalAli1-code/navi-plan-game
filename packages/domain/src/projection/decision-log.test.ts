import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionOutcomeId,
  asDecisionRecordId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createDecision,
  createInitialSimulationState,
  createScaffoldDecisionDefinition,
  markDecisionResolved,
  type Decision,
  type DecisionDefinition,
  type SimulationRun,
  type SimulationState,
} from "../index";
import {
  emptyProjectionSafeCatalog,
  type ProjectionSafeContent,
} from "./content";
import { buildDecisionLogProjection } from "./decision-log-builder";
import {
  DECISION_LOG_PROJECTION_SCHEMA_VERSION,
  DECISION_LOG_PROJECTION_TYPE,
} from "./decision-log-contracts";
import { parseDecisionLogProjection } from "./decision-log-payload";
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
  summaries: Readonly<Record<string, string | null>> = {
    option_a: "Public summary A",
    option_b: "Public summary B",
  },
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
    publicResultSummaryByOptionId: summaries,
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

const submittedDecision = (input: {
  readonly id: string;
  readonly definitionId?: string;
  readonly optionId?: string;
  readonly submittedAt: string;
}): Decision => {
  const created = createDecision({
    id: asDecisionRecordId(input.id),
    decisionDefinitionId: asDecisionId(input.definitionId ?? "decision_1"),
    selectedOptionId: asDecisionOptionId(input.optionId ?? "option_a"),
    submittedBy: asActorId("actor_1"),
    submittedAt: asIsoTimestamp(input.submittedAt),
    sourceActionId: asActionRecordId(`action_${input.id}`),
    contextStateVersion: 0,
  });
  if (!created.ok) {
    throw new Error("createDecision failed");
  }
  return created.value;
};

const resolvedDecision = (input: {
  readonly id: string;
  readonly definitionId?: string;
  readonly optionId?: string;
  readonly submittedAt: string;
  readonly resolvedAt: string;
}): Decision => {
  const submitted = submittedDecision(input);
  const resolved = markDecisionResolved(submitted, {
    outcomeId: asDecisionOutcomeId(`outcome_${input.id}`),
    resolvedAt: asIsoTimestamp(input.resolvedAt),
  });
  if (!resolved.ok) {
    throw new Error("markDecisionResolved failed");
  }
  return resolved.value;
};

const stateWithDecisions = (
  decisions: readonly Decision[],
): SimulationState => ({
  ...createInitialSimulationState(),
  decisions: [...decisions],
});

const buildFor = (
  run: SimulationRun,
  content: ProjectionSafeContent = projectionContent(),
  generatedAt = now,
) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildDecisionLogProjection({
    snapshot: snapshot.value,
    projectionContent: content,
    generatedAt,
  });
};

describe("buildDecisionLogProjection", () => {
  it("builds schema v1 decision_log envelope with empty available history", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(DECISION_LOG_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      DECISION_LOG_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.projectionId).toBe(
      "projection:decision_log:tenant_1:run_1",
    );
    expect(result.value.entries).toEqual([]);
    expect(result.value.summary).toEqual({ totalEntries: 0, isEmpty: true });
  });

  it("includes one submitted decision with stable identity and no outcome", () => {
    const decision = submittedDecision({
      id: "drec_1",
      submittedAt: "2026-07-25T10:00:00.000Z",
    });
    const result = buildFor(
      activeRun({ state: stateWithDecisions([decision]) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.entries).toHaveLength(1);
    expect(result.value.entries[0]).toMatchObject({
      entryId: "drec_1",
      decisionRecordId: "drec_1",
      decisionDefinitionId: "decision_1",
      sequence: 1,
      decidedAt: "2026-07-25T10:00:00.000Z",
      title: "Title decision_1",
      selectedOption: { optionId: "option_a", label: "Label option_a" },
      status: "submitted",
      revealedOutcome: null,
    });
    expect(result.value.summary).toEqual({ totalEntries: 1, isEmpty: false });
  });

  it("orders newest-first with chronological sequence and id tie-break", () => {
    const older = submittedDecision({
      id: "drec_a",
      submittedAt: "2026-07-25T09:00:00.000Z",
    });
    const newer = submittedDecision({
      id: "drec_b",
      submittedAt: "2026-07-25T11:00:00.000Z",
    });
    const sameTimeEarlierId = submittedDecision({
      id: "drec_c1",
      submittedAt: "2026-07-25T10:00:00.000Z",
    });
    const sameTimeLaterId = submittedDecision({
      id: "drec_c2",
      submittedAt: "2026-07-25T10:00:00.000Z",
    });
    const result = buildFor(
      activeRun({
        state: stateWithDecisions([
          newer,
          older,
          sameTimeLaterId,
          sameTimeEarlierId,
        ]),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.entries.map((entry) => entry.entryId)).toEqual([
      "drec_b",
      "drec_c2",
      "drec_c1",
      "drec_a",
    ]);
    expect(
      result.value.entries.map((entry) => ({
        id: entry.entryId,
        sequence: entry.sequence,
      })),
    ).toEqual([
      { id: "drec_b", sequence: 4 },
      { id: "drec_c2", sequence: 3 },
      { id: "drec_c1", sequence: 2 },
      { id: "drec_a", sequence: 1 },
    ]);
  });

  it("reproduces stable entry ids across rebuilds", () => {
    const decision = resolvedDecision({
      id: "drec_stable",
      submittedAt: "2026-07-25T10:00:00.000Z",
      resolvedAt: "2026-07-25T10:05:00.000Z",
    });
    const first = buildFor(
      activeRun({ state: stateWithDecisions([decision]) }),
      projectionContent(),
      now,
    );
    const second = buildFor(
      activeRun({ state: stateWithDecisions([decision]) }),
      projectionContent(),
      asIsoTimestamp("2026-07-25T14:00:00.000Z"),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.entries[0]?.entryId).toBe("drec_stable");
    expect(second.value.entries[0]?.entryId).toBe("drec_stable");
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
  });

  it("includes revealed outcome only when resolved with public summary", () => {
    const resolved = resolvedDecision({
      id: "drec_resolved",
      submittedAt: "2026-07-25T10:00:00.000Z",
      resolvedAt: "2026-07-25T10:05:00.000Z",
    });
    const withOutcome = buildFor(
      activeRun({ state: stateWithDecisions([resolved]) }),
    );
    expect(withOutcome.ok).toBe(true);
    if (!withOutcome.ok) {
      return;
    }
    expect(withOutcome.value.entries[0]?.revealedOutcome).toEqual({
      summary: "Public summary A",
    });

    const withoutPublic = buildFor(
      activeRun({ state: stateWithDecisions([resolved]) }),
      projectionContent([definition()], { option_a: null, option_b: null }),
    );
    expect(withoutPublic.ok).toBe(true);
    if (!withoutPublic.ok) {
      return;
    }
    expect(withoutPublic.value.entries[0]?.revealedOutcome).toBeNull();
  });

  it("excludes unrevealed outcome text for submitted decisions", () => {
    const submitted = submittedDecision({
      id: "drec_pending",
      submittedAt: "2026-07-25T10:00:00.000Z",
    });
    const result = buildFor(
      activeRun({ state: stateWithDecisions([submitted]) }),
      projectionContent([definition()], {
        option_a: "HIDDEN_UNTIL_RESOLVED",
        option_b: "other",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.entries[0]?.revealedOutcome).toBeNull();
    expect(JSON.stringify(result.value)).not.toContain("HIDDEN_UNTIL_RESOLVED");
  });

  it("does not invent decidedAt and uses authoritative submittedAt", () => {
    const decision = submittedDecision({
      id: "drec_time",
      submittedAt: "2026-07-25T08:30:00.000Z",
    });
    const result = buildFor(
      activeRun({ state: stateWithDecisions([decision]) }),
      projectionContent(),
      asIsoTimestamp("2026-07-25T20:00:00.000Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.entries[0]?.decidedAt).toBe("2026-07-25T08:30:00.000Z");
    expect(result.value.entries[0]?.decidedAt).not.toBe(
      result.value.generatedAt,
    );
  });

  it("does not leak facilitator or scoring fields into payload", () => {
    const decision = resolvedDecision({
      id: "drec_safe",
      submittedAt: "2026-07-25T10:00:00.000Z",
      resolvedAt: "2026-07-25T10:05:00.000Z",
    });
    const result = buildFor(
      activeRun({ state: stateWithDecisions([decision]) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const serialized = JSON.stringify(result.value);
    expect(serialized).not.toContain("qualityClassification");
    expect(serialized).not.toContain("decisionOutcomeId");
    expect(serialized).not.toContain("outcomeId");
    expect(serialized).not.toContain("facilitator");
    expect(serialized).not.toContain("resolverVersion");
  });

  it("changes semantic hash when learner-visible log content changes", () => {
    const firstDecision = submittedDecision({
      id: "drec_1",
      submittedAt: "2026-07-25T10:00:00.000Z",
    });
    const secondDecision = submittedDecision({
      id: "drec_2",
      submittedAt: "2026-07-25T11:00:00.000Z",
    });
    const one = buildFor(
      activeRun({ state: stateWithDecisions([firstDecision]) }),
    );
    const two = buildFor(
      activeRun({
        state: stateWithDecisions([firstDecision, secondDecision]),
        aggregateVersion: 3,
      }),
    );
    expect(one.ok && two.ok).toBe(true);
    if (!one.ok || !two.ok) {
      return;
    }
    expect(one.value.semanticHash).not.toBe(two.value.semanticHash);
  });

  it("parseDecisionLogProjection accepts valid payloads and rejects malformed", () => {
    const decision = resolvedDecision({
      id: "drec_parse",
      submittedAt: "2026-07-25T10:00:00.000Z",
      resolvedAt: "2026-07-25T10:05:00.000Z",
    });
    const built = buildFor(
      activeRun({ state: stateWithDecisions([decision]) }),
    );
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const accepted = parseDecisionLogProjection(built.value);
    expect(accepted.ok).toBe(true);

    const badEmptyFlag = parseDecisionLogProjection({
      ...built.value,
      summary: { totalEntries: 1, isEmpty: true },
    });
    expect(badEmptyFlag.ok).toBe(false);

    const badType = parseDecisionLogProjection({
      ...built.value,
      projectionType: "mission_control",
    });
    expect(badType.ok).toBe(false);

    const badSchema = parseDecisionLogProjection({
      ...built.value,
      projectionSchemaVersion: 99,
    });
    expect(badSchema.ok).toBe(false);
  });
});
