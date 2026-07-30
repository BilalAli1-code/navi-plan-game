import { describe, expect, it } from "vitest";
import {
  asChapterId,
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
  buildCoachingProjection,
  computeCoachingSemanticHash,
} from "./coaching-builder";
import {
  COACHING_PROJECTION_SCHEMA_VERSION,
  COACHING_PROJECTION_TYPE,
} from "./coaching-contracts";
import { parseCoachingProjection } from "./coaching-payload";

const tenantId = asTenantId("tenant_coaching");
const simulationRunId = asSimulationRunId("run_coaching");
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

const chapterSnapshot = (): SimulationRunReadSnapshot => ({
  tenantId,
  simulationRunId,
  learnerId: asLearnerId("learner_coaching"),
  contentPackageVersionId,
  status: "active",
  aggregateVersion: 1,
  lastProcessedSequence: 0,
  stateVersion: 1,
  stateSchemaVersion: 8,
  currentChapterId: asChapterId("chapter-01"),
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

describe("buildCoachingProjection", () => {
  it("builds schema v1 coaching envelope with deterministic fallback text", () => {
    const result = buildCoachingProjection({
      snapshot: chapterSnapshot(),
      learningContent,
      experienceLevel: "explorer",
      generatedAt: now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(COACHING_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      COACHING_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.interventions.length).toBeGreaterThan(0);
    for (const intervention of result.value.interventions) {
      expect(intervention.fallbackText).toBe(
        `${intervention.title}\n\n${intervention.guidance}`,
      );
    }
  });

  it("round-trips through parseCoachingProjection", () => {
    const built = buildCoachingProjection({
      snapshot: chapterSnapshot(),
      learningContent,
      experienceLevel: "practitioner",
      generatedAt: now,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseCoachingProjection(built.value);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.semanticHash).toBe(
      computeCoachingSemanticHash(built.value),
    );
  });
});
