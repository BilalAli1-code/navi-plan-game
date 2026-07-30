import { describe, expect, it } from "vitest";
import {
  asContentPackageVersionId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createNorthstarCanonicalContractSet,
  createNorthstarConnectedCarePackage,
  mapBusinessCasePackageToLearningSafeContent,
  type SimulationRunReadSnapshot,
} from "../index";
import {
  buildMasteryProjection,
  computeMasterySemanticHash,
} from "./mastery-builder";
import {
  MASTERY_PROJECTION_SCHEMA_VERSION,
  MASTERY_PROJECTION_TYPE,
} from "./mastery-contracts";
import { parseMasteryProjection } from "./mastery-payload";

const tenantId = asTenantId("tenant_mastery");
const simulationRunId = asSimulationRunId("run_mastery");
const contentPackageVersionId = asContentPackageVersionId(
  "cpv:northstar-connected-care:1.0.0",
);
const now = asIsoTimestamp("2026-07-28T12:00:00.000Z");

const northstarPackage = createNorthstarConnectedCarePackage();
const canonical = createNorthstarCanonicalContractSet(northstarPackage);
const learningContent = mapBusinessCasePackageToLearningSafeContent(
  northstarPackage,
  contentPackageVersionId,
  "en-US",
  canonical.coachingInterventions,
);

const emptySnapshot = (): SimulationRunReadSnapshot => ({
  tenantId,
  simulationRunId,
  learnerId: asLearnerId("learner_mastery"),
  contentPackageVersionId,
  status: "active",
  aggregateVersion: 1,
  lastProcessedSequence: 0,
  stateVersion: 1,
  stateSchemaVersion: 8,
  currentChapterId: null,
  currentDayId: null,
  startedAt: now,
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  projectState: createInitialSimulationState().projectState,
  projectMetrics: createInitialSimulationState().projectMetrics,
  decisions: [],
  decisionOutcomes: [],
  learnerMessages: [],
  meetings: [],
  stakeholders: [],
  stakeholderConversations: [],
  documents: [],
  notifications: [],
  activities: [],
  crises: [],
  chapterProgress: [],
});

describe("buildMasteryProjection", () => {
  it("builds schema v1 mastery envelope with empty competencies and unavailable XP", () => {
    const result = buildMasteryProjection({
      snapshot: emptySnapshot(),
      learningContent,
      experienceLevel: "practitioner",
      generatedAt: now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(MASTERY_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      MASTERY_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.competencies).toEqual([]);
    expect(result.value.xpSummary).toEqual({
      availability: "unavailable",
      reason: "xp_amounts_not_authored",
      totalXp: 0,
    });
  });

  it("round-trips through parseMasteryProjection", () => {
    const built = buildMasteryProjection({
      snapshot: emptySnapshot(),
      learningContent,
      experienceLevel: "practitioner",
      generatedAt: now,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseMasteryProjection(built.value);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.semanticHash).toBe(
      computeMasterySemanticHash(built.value),
    );
  });
});
