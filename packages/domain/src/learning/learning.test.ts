/**
 * BC-006 Workstream 6 — learning domain core tests.
 */

import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asActivityId,
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
  deriveDecisionOutcomeId,
  deriveLearningSignalId,
  mapBusinessCasePackageToLearningSafeContent,
  SUPPORTED_RESOLVER_VERSION,
  type SimulationRunReadSnapshot,
} from "../index";
import { evaluateAchievements } from "./achievements";
import { selectCoachingInterventions } from "./coaching";
import { aggregateCompetencyEvidence } from "./competency-aggregation";
import { assessResolvedDecision } from "./decision-assessor";
import { extractLearningEvidence } from "./evidence";
import { evaluateMastery } from "./mastery";
import { evaluateXpAwards } from "./xp";

const tenantId = asTenantId("tenant_learning");
const simulationRunId = asSimulationRunId("run_learning");
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

const decisionRecordId = asDecisionRecordId("decision_record_1");
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

const baseSnapshot = (
  overrides: Partial<SimulationRunReadSnapshot> = {},
): SimulationRunReadSnapshot => ({
  tenantId,
  simulationRunId,
  learnerId: asLearnerId("learner_learning"),
  contentPackageVersionId,
  status: "active",
  aggregateVersion: 1,
  lastProcessedSequence: 1,
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
  ...overrides,
});

const resolvedDecisionSnapshot = (): SimulationRunReadSnapshot => {
  const decision = createDecision({
    id: decisionRecordId,
    decisionDefinitionId,
    selectedOptionId: "option.objective-patient-access" as never,
    submittedBy: asActorId("learner_learning"),
    submittedAt: now,
    sourceActionId: asActionRecordId("action_1"),
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
  return baseSnapshot({
    decisions: [resolved],
    decisionOutcomes: [outcome.value],
  });
};

describe("extractLearningEvidence", () => {
  it("extracts learning signal evidence idempotently", () => {
    const snapshot = resolvedDecisionSnapshot();
    const first = extractLearningEvidence({
      snapshot,
      learningContent,
      experienceLevel: "practitioner",
    });
    const second = extractLearningEvidence({
      snapshot,
      learningContent,
      experienceLevel: "practitioner",
    });
    expect(first).toEqual(second);
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({
      evidenceId: learningSignalId,
      sourceType: "decision_learning_signal",
      competencyIds: ["competency.value-delivery"],
      contributionDelta: 6,
    });
  });

  it("does not produce competency evidence from unread informational messages", () => {
    const snapshot = baseSnapshot({
      learnerMessages: [
        {
          occurrenceId: "learner_message:init:message.sponsor-welcome",
          definitionId: "message.sponsor-welcome",
          definitionVersion: "1",
          deliverySequence: 1,
          deliveryStatus: "delivered",
          deliveredAt: now,
          sender: {
            senderId: "stakeholder.sponsor",
            displayName: "Sponsor",
            roleLabel: "Executive Sponsor",
          },
          subject: "Welcome",
          body: "Informational only.",
        } as never,
      ],
    });
    const evidence = extractLearningEvidence({
      snapshot,
      learningContent,
      experienceLevel: "explorer",
    });
    expect(evidence).toHaveLength(0);
  });

  it("prevents duplicate evidence records", () => {
    const snapshot = resolvedDecisionSnapshot();
    const evidence = extractLearningEvidence({
      snapshot,
      learningContent,
      experienceLevel: "practitioner",
    });
    const evidenceIds = evidence.map((record) => record.evidenceId);
    expect(new Set(evidenceIds).size).toBe(evidenceIds.length);
  });

  it("records completed practice and reflection activity evidence", () => {
    const practiceId = asActivityId("activity.attend-kickoff");
    const reflectionId = asActivityId("activity.chapter-one-reflection");
    const snapshot = baseSnapshot({
      activities: [
        {
          activityId: practiceId,
          creationSequence: 1,
          content: {
            title: "Attend Connected Care Program Kickoff",
            summary: "Kickoff",
            body: null,
          },
          source: { kind: "simulation", sourceId: null, reason: null },
          status: "completed",
          createdAt: now,
          completedAt: now,
          completionSequence: 1,
          originatingCommandId: null,
        },
        {
          activityId: reflectionId,
          creationSequence: 2,
          content: {
            title: "Chapter One reflection",
            summary: "Reflect",
            body: null,
          },
          source: { kind: "simulation", sourceId: null, reason: null },
          status: "completed",
          createdAt: now,
          completedAt: now,
          completionSequence: 2,
          originatingCommandId: null,
        },
      ],
    });
    const evidence = extractLearningEvidence({
      snapshot,
      learningContent,
      experienceLevel: "explorer",
    });
    expect(
      evidence.some(
        (record) =>
          record.sourceType === "completed_practice_activity" &&
          record.sourceIdentity === practiceId,
      ),
    ).toBe(true);
    expect(
      evidence.some(
        (record) =>
          record.sourceType === "completed_reflection_activity" &&
          record.sourceIdentity === reflectionId,
      ),
    ).toBe(true);
  });
});

describe("evaluateAchievements", () => {
  it("awards achievements when authored conditions match", () => {
    const snapshot = baseSnapshot({
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
    });
    const awards = evaluateAchievements({
      snapshot,
      learningContent,
      experienceLevel: "practitioner",
    });
    expect(
      awards.some(
        (award) => award.achievementId === "achievement.evidence-first",
      ),
    ).toBe(true);
  });

  it("does not award achievements when conditions are unmet", () => {
    const awards = evaluateAchievements({
      snapshot: baseSnapshot(),
      learningContent,
      experienceLevel: "practitioner",
    });
    expect(
      awards.some(
        (award) => award.achievementId === "achievement.value-guardian",
      ),
    ).toBe(false);
  });
});

describe("evaluateXpAwards", () => {
  it("returns unavailable until XP amounts are authored", () => {
    const result = evaluateXpAwards({
      snapshot: resolvedDecisionSnapshot(),
      learningContent,
      experienceLevel: "practitioner",
    });
    expect(result).toEqual({
      availability: "unavailable",
      reason: "xp_amounts_not_authored",
      awards: [],
      totalXp: 0,
    });
  });
});

describe("mastery aggregation", () => {
  it("aggregates deltas while mastery bands remain unavailable", () => {
    const evidence = extractLearningEvidence({
      snapshot: resolvedDecisionSnapshot(),
      learningContent,
      experienceLevel: "practitioner",
    });
    const aggregates = evaluateMastery(evidence, learningContent);
    expect(aggregates).toHaveLength(1);
    expect(aggregates[0]).toMatchObject({
      competencyId: "competency.value-delivery",
      totalDelta: 6,
      evidenceCount: 1,
      bandAvailability: "unavailable",
      bandUnavailableReason: "mastery_thresholds_not_authored",
      band: null,
    });
    expect(aggregateCompetencyEvidence(evidence, learningContent)).toEqual(
      aggregates,
    );
  });
});

describe("selectCoachingInterventions", () => {
  it("returns explorer-only hints for explorer audience", () => {
    const snapshot = baseSnapshot({
      currentChapterId: asChapterId("chapter-01"),
    });
    const explorer = selectCoachingInterventions({
      snapshot,
      learningContent,
      experienceLevel: "explorer",
    });
    expect(explorer.some((item) => item.interventionType === "hint")).toBe(
      true,
    );
  });

  it("filters hints away from leader audience when not in audience", () => {
    const snapshot = baseSnapshot({
      currentChapterId: asChapterId("chapter-01"),
    });
    const leader = selectCoachingInterventions({
      snapshot,
      learningContent,
      experienceLevel: "leader",
    });
    expect(leader.some((item) => item.interventionType === "hint")).toBe(false);
    expect(leader.some((item) => item.interventionType === "orientation")).toBe(
      true,
    );
  });
});

describe("assessResolvedDecision", () => {
  it("does not invent quality bands when classification is null", () => {
    const snapshot = resolvedDecisionSnapshot();
    const evidence = extractLearningEvidence({
      snapshot,
      learningContent,
      experienceLevel: "practitioner",
    });
    const decision = snapshot.decisions[0]!;
    const outcome = snapshot.decisionOutcomes[0]!;
    const assessment = assessResolvedDecision({
      decision,
      outcome,
      evidenceForDecision: evidence,
      learningContent,
    });
    expect(assessment.qualityBand).toBeNull();
    expect(assessment.version).toBe("decision-assessor/v1");
    expect(
      assessment.competencyContributions["competency.value-delivery"],
    ).toBe(6);
  });
});
