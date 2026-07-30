import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActivityId,
  asActorId,
  asChapterId,
  asConsequenceDefinitionId,
  asContentPackageVersionId,
  asDecisionId,
  asDecisionOutcomeDefinitionId,
  asDecisionRecordId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createDecision,
  createDecisionOutcome,
  createInitialSimulationState,
  createNorthstarCanonicalContractSet,
  createNorthstarConnectedCarePackage,
  deriveConsequenceId,
  deriveConsequenceId,
  deriveDecisionOutcomeId,
  deriveLearningSignalId,
  extractLearningEvidence,
  mapBusinessCasePackageToLearningSafeContent,
  SUPPORTED_RESOLVER_VERSION,
  type SimulationRunReadSnapshot,
} from "../index";
import {
  buildAchievementsProjection,
  computeAchievementsSemanticHash,
} from "./achievements-builder";
import {
  ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION,
  ACHIEVEMENTS_PROJECTION_TYPE,
} from "./achievements-contracts";
import { parseAchievementsProjection } from "./achievements-payload";

const tenantId = asTenantId("tenant_achievements");
const simulationRunId = asSimulationRunId("run_achievements");
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

const decisionRecordId = asDecisionRecordId("decision_record_ach");
const decisionDefinitionId = asDecisionId("decision.define-objective");
const consequenceDefinitionId = asConsequenceDefinitionId(
  "consequence.objective-patient-access:effect:4",
);
const resolverVersion = SUPPORTED_RESOLVER_VERSION;

const learningSignalId = deriveLearningSignalId(
  deriveConsequenceId({
    simulationRunId,
    decisionRecordId,
    consequenceDefinitionId,
    resolverVersion,
  }),
);

const resolvedDecisionSnapshot = (): SimulationRunReadSnapshot => {
  const decision = createDecision({
    id: decisionRecordId,
    decisionDefinitionId,
    selectedOptionId: "option.objective-patient-access" as never,
    submittedBy: asActorId("learner_achievements"),
    submittedAt: now,
    sourceActionId: asActionRecordId("action_ach"),
    contextStateVersion: 1,
  });
  if (!decision.ok) {
    throw new Error("decision fixture failed");
  }
  const resolved = {
    ...decision.value,
    status: "resolved" as const,
    outcomeId: deriveDecisionOutcomeId({
      decisionRecordId,
      resolverVersion,
    }),
    resolvedAt: now,
  };
  const outcome = createDecisionOutcome({
    id: deriveDecisionOutcomeId({ decisionRecordId, resolverVersion }),
    decisionRecordId,
    outcomeDefinitionId: asDecisionOutcomeDefinitionId("outcome.fixture"),
    resolverVersion,
    resolvedAt: now,
    qualityClassification: null,
    consequenceIds: [
      deriveConsequenceId({
        simulationRunId,
        decisionRecordId,
        consequenceDefinitionId,
        resolverVersion,
      }),
    ],
    learningSignalIds: [learningSignalId],
    stakeholderSignalIds: [],
    analyticsSignalIds: [],
    explanationReference: null,
  });
  if (!outcome.ok) {
    throw new Error("outcome fixture failed");
  }
  return {
    tenantId,
    simulationRunId,
    learnerId: asLearnerId("learner_achievements"),
    contentPackageVersionId,
    status: "active",
    aggregateVersion: 3,
    lastProcessedSequence: 2,
    stateVersion: 2,
    stateSchemaVersion: 8,
    currentChapterId: asChapterId("chapter-01"),
    currentDayId: null,
    startedAt: now,
    pausedAt: null,
    completedAt: null,
    archivedAt: null,
    projectState: createInitialSimulationState().projectState,
    projectMetrics: createInitialSimulationState().projectMetrics,
    decisions: [resolved],
    decisionOutcomes: [outcome.value],
    learnerMessages: [],
    meetings: [],
    stakeholders: [],
    stakeholderConversations: [],
    documents: [],
    notifications: [],
    activities: [],
    crises: [],
    chapterProgress: [],
  };
};

describe("buildAchievementsProjection", () => {
  it("builds schema v1 achievements envelope with unavailable XP summary", () => {
    const result = buildAchievementsProjection({
      snapshot: {
        ...resolvedDecisionSnapshot(),
        decisions: [],
        decisionOutcomes: [],
      },
      learningContent,
      experienceLevel: "practitioner",
      generatedAt: now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(ACHIEVEMENTS_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      ACHIEVEMENTS_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.xpSummary).toEqual({
      availability: "unavailable",
      reason: "xp_amounts_not_authored",
      totalXp: 0,
    });
    expect(result.value.awards).toEqual([]);
  });

  it("awards achievements when evidence preconditions are met", () => {
    const snapshot: SimulationRunReadSnapshot = {
      ...resolvedDecisionSnapshot(),
      activities: [
        {
          activityId: asActivityId("activity.analyze-access-evidence"),
          creationSequence: 1,
          content: {
            title: "Analyze access evidence",
            summary: "Compare evidence.",
            body: null,
          },
          source: { kind: "simulation", sourceId: null, reason: null },
          status: "completed",
          createdAt: now,
          completedAt: now,
          completionSequence: 1,
          originatingCommandId: null,
        },
      ],
    };
    const evidence = extractLearningEvidence({
      snapshot,
      learningContent,
      experienceLevel: "practitioner",
    });
    expect(evidence.length).toBeGreaterThan(0);

    const result = buildAchievementsProjection({
      snapshot,
      learningContent,
      experienceLevel: "practitioner",
      generatedAt: now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(
      result.value.awards.some(
        (award) => award.achievementId === "achievement.evidence-first",
      ),
    ).toBe(true);
  });

  it("round-trips through parseAchievementsProjection", () => {
    const built = buildAchievementsProjection({
      snapshot: resolvedDecisionSnapshot(),
      learningContent,
      experienceLevel: "practitioner",
      generatedAt: now,
    });
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseAchievementsProjection(built.value);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.semanticHash).toBe(
      computeAchievementsSemanticHash(built.value),
    );
  });
});
