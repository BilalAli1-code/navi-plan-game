import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asBusinessCaseId,
  asChapterId,
  asContentPackageVersionId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionRecordId,
  asIsoTimestamp,
  asLearnerId,
  asLearnerMessageDefinitionId,
  asLearnerMessageOccurrenceId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  createLearnerMessageOccurrence,
  createScaffoldDecisionDefinition,
  type DecisionDefinition,
  type LearnerMessageOccurrence,
  type SimulationRun,
} from "../index";
import {
  emptyProjectionSafeCatalog,
  type ProjectionSafeContent,
} from "./content";
import { buildInboxProjection } from "./inbox-builder";
import { buildLearnerProgressionProjection } from "./learner-progression-builder";
import { buildMissionControlProjection } from "./mission-control-builder";
import { buildPerformanceProjection } from "./performance-builder";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const eligibleDecisionId = asDecisionId("decision_eligible");
const lockedDecisionId = asDecisionId("decision_locked");
const chapterOneId = "chapter-01";
const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");

const eligibleDefinition = (): DecisionDefinition =>
  createScaffoldDecisionDefinition({
    id: eligibleDecisionId,
    contentPackageVersionId,
  });

const lockedDefinition = (): DecisionDefinition =>
  createScaffoldDecisionDefinition({
    id: lockedDecisionId,
    contentPackageVersionId,
    availability: { kind: "locked" },
  });

const toSafeDecision = (
  def: DecisionDefinition,
  authoredOrder: number,
): ProjectionSafeContent["decisions"][number] => ({
  id: def.id,
  contentPackageVersionId: def.contentPackageVersionId,
  authoredOrder,
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
});

const projectionContent = (): ProjectionSafeContent => ({
  contentPackageVersionId,
  ...emptyProjectionSafeCatalog(),
  decisions: [
    toSafeDecision(eligibleDefinition(), 0),
    toSafeDecision(lockedDefinition(), 1),
  ],
  messages: [
    {
      id: "msg_informational",
      classification: "informational",
      relatedDecisionId: null,
      relatedMeetingId: null,
      relatedDocumentIds: [],
      chapterId: null,
    },
    {
      id: "msg_decision_bearing",
      classification: "decision_bearing",
      relatedDecisionId: eligibleDecisionId,
      relatedMeetingId: null,
      relatedDocumentIds: [],
      chapterId: chapterOneId,
    },
  ],
  chapters: [
    {
      id: chapterOneId,
      order: 1,
      title: "Chapter One",
      requiredDecisionIds: [eligibleDecisionId],
      requiredActivityIds: [],
      requiredMeetingIds: [],
    },
  ],
});

const occurrence = (input: {
  readonly id: string;
  readonly sequence: number;
  readonly subject?: string;
  readonly body?: string;
  readonly definitionId?: string;
}): LearnerMessageOccurrence => {
  const created = createLearnerMessageOccurrence({
    occurrenceId: asLearnerMessageOccurrenceId(input.id),
    definitionId: asLearnerMessageDefinitionId(
      input.definitionId ?? "msg_informational",
    ),
    definitionVersion: "1",
    deliverySequence: input.sequence,
    deliveredAt: asIsoTimestamp("2026-07-26T10:00:00.000Z"),
    sender: {
      senderId: "stakeholder_sponsor",
      displayName: "Alex Sponsor",
      roleLabel: "Executive Sponsor",
    },
    subject: input.subject ?? `Subject ${input.sequence}`,
    body: input.body ?? `Body ${input.sequence}`,
  });
  if (!created.ok) {
    throw new Error("createLearnerMessageOccurrence failed");
  }
  return created.value;
};

const baseState = () => ({
  ...createInitialSimulationState(),
  stateVersion: 2,
  learnerMessages: [
    occurrence({
      id: "learner_message:info",
      sequence: 1,
      definitionId: "msg_informational",
      subject: "Welcome",
      body: "Informational kickoff note.",
    }),
    occurrence({
      id: "learner_message:decision",
      sequence: 2,
      definitionId: "msg_decision_bearing",
      subject: "Decision needed",
      body: "Please submit your objective decision.",
    }),
  ],
});

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_1"),
  tenantId,
  learnerId: asLearnerId("learner_1"),
  businessCaseId: asBusinessCaseId("case_1"),
  contentPackageVersionId,
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 4,
  lastProcessedSequence: 0,
  currentChapterId: asChapterId(chapterOneId),
  currentDayId: null,
  startedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  updatedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  state: {
    ...baseState(),
    decisions: [
      {
        id: asDecisionRecordId("decision_record_1"),
        decisionDefinitionId: eligibleDecisionId,
        selectedOptionId: asDecisionOptionId("option_a"),
        submittedBy: asActorId("learner_1"),
        submittedAt: asIsoTimestamp("2026-07-26T11:00:00.000Z"),
        sourceActionId: asActionRecordId("action_1"),
        contextStateVersion: 1,
        status: "resolved",
        outcomeId: null,
        resolvedAt: asIsoTimestamp("2026-07-26T11:30:00.000Z"),
      },
    ],
  },
  ...overrides,
});

const snapshotFor = (run: SimulationRun) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return snapshot.value;
};

describe("BC-006 W5 northstar projection convergence", () => {
  it("does not count informational inbox messages in decision_bearing totals", () => {
    const run = activeRun({
      state: {
        ...baseState(),
        decisions: [],
      },
    });
    const content = projectionContent();
    const snapshot = snapshotFor(run);

    const inbox = buildInboxProjection({
      snapshot,
      projectionContent: content,
      generatedAt: now,
    });
    expect(inbox.ok).toBe(true);
    if (!inbox.ok) {
      return;
    }
    expect(inbox.value.summary.classificationCounts.informational).toBe(1);
    expect(inbox.value.summary.classificationCounts.decision_bearing).toBe(1);
    expect(
      inbox.value.messages.filter(
        (message) => message.classification === "informational",
      ),
    ).toHaveLength(1);
  });

  it("matches mission control pendingDecisions to eligible decisions", () => {
    const run = activeRun({
      state: {
        ...baseState(),
        decisions: [],
      },
    });
    const content = projectionContent();
    const snapshot = snapshotFor(run);
    const missionControl = buildMissionControlProjection({
      snapshot,
      eligibilityDefinitions: [eligibleDefinition(), lockedDefinition()],
      projectionContent: content,
      generatedAt: now,
    });
    expect(missionControl.ok).toBe(true);
    if (!missionControl.ok) {
      return;
    }
    expect(missionControl.value.counts.pendingDecisions).toEqual({
      availability: "available",
      count: 1,
    });
    expect(missionControl.value.nextRecommendedActions).toHaveLength(1);
    expect(missionControl.value.nextRecommendedActions[0]?.targetId).toBe(
      eligibleDecisionId,
    );
  });

  it("builds performance and learner progression from authoritative completions", () => {
    const run = activeRun();
    const content = projectionContent();
    const snapshot = snapshotFor(run);

    const performance = buildPerformanceProjection({
      snapshot,
      projectionContent: content,
      generatedAt: now,
    });
    const learnerProgression = buildLearnerProgressionProjection({
      snapshot,
      projectionContent: content,
      generatedAt: now,
    });

    expect(performance.ok).toBe(true);
    expect(learnerProgression.ok).toBe(true);
    if (!performance.ok || !learnerProgression.ok) {
      return;
    }

    expect(performance.value.decisionCounts).toEqual({
      submitted: 0,
      resolved: 1,
    });
    expect(performance.value.recentlyResolvedDecisions).toHaveLength(1);

    const chapter = learnerProgression.value.chapters.find(
      (entry) => entry.chapterId === chapterOneId,
    );
    expect(chapter?.requirements).toEqual([
      {
        kind: "decision",
        targetId: eligibleDecisionId,
        status: "completed",
      },
    ]);
    expect(chapter?.status).toBe("active");
  });
});
