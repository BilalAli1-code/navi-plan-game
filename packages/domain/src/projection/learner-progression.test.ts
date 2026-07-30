import { describe, expect, it } from "vitest";
import {
  asBusinessCaseId,
  asChapterId,
  asContentPackageVersionId,
  asDecisionId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createInitialSimulationState,
  type SimulationRun,
} from "../index";
import {
  emptyProjectionSafeCatalog,
  type ProjectionSafeContent,
} from "./content";
import {
  buildLearnerProgressionProjection,
  computeLearnerProgressionSemanticHash,
} from "./learner-progression-builder";
import {
  LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION,
  LEARNER_PROGRESSION_PROJECTION_TYPE,
} from "./learner-progression-contracts";
import { parseLearnerProgressionProjection } from "./learner-progression-payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const chapterOneId = "chapter-01";
const chapterTwoId = "chapter-02";
const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");

const projectionContent = (): ProjectionSafeContent => ({
  contentPackageVersionId,
  ...emptyProjectionSafeCatalog(),
  decisions: [],
  chapters: [
    {
      id: chapterOneId,
      order: 1,
      title: "Chapter One",
      requiredDecisionIds: [asDecisionId("decision.define-objective")],
      requiredActivityIds: [],
      requiredMeetingIds: [],
    },
    {
      id: chapterTwoId,
      order: 2,
      title: "Chapter Two",
      requiredDecisionIds: [],
      requiredActivityIds: [],
      requiredMeetingIds: [],
    },
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
  aggregateVersion: 2,
  lastProcessedSequence: 0,
  currentChapterId: asChapterId(chapterOneId),
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

const buildFor = (run: SimulationRun, generatedAt = now) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildLearnerProgressionProjection({
    snapshot: snapshot.value,
    projectionContent: projectionContent(),
    generatedAt,
  });
};

describe("buildLearnerProgressionProjection", () => {
  it("builds schema v1 learner progression with chapter requirements", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(
      LEARNER_PROGRESSION_PROJECTION_TYPE,
    );
    expect(result.value.projectionSchemaVersion).toBe(
      LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.projectionId).toBe(
      "projection:learner_progression:tenant_1:run_1",
    );
    expect(result.value.chapters).toHaveLength(2);
    expect(result.value.chapters[0]).toMatchObject({
      chapterId: chapterOneId,
      order: 1,
      title: "Chapter One",
      status: "blocked",
      requirements: [
        {
          kind: "decision",
          targetId: "decision.define-objective",
          status: "pending",
        },
      ],
    });
    expect(result.value.summary).toMatchObject({
      totalChapters: 2,
      completedChapterCount: 0,
      activeChapterId: chapterOneId,
      blockedChapterCount: 1,
      lockedChapterCount: 1,
      availableChapterCount: 0,
    });
    expect(result.value).not.toHaveProperty("xp");
    expect(result.value).not.toHaveProperty("mastery");
  });

  it("keeps semantic hash stable across generatedAt changes", () => {
    const first = buildFor(activeRun(), now);
    const second = buildFor(
      activeRun(),
      asIsoTimestamp("2026-07-26T13:00:00.000Z"),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(computeLearnerProgressionSemanticHash(first.value)).toBe(
      first.value.semanticHash,
    );
  });
});

describe("parseLearnerProgressionProjection", () => {
  it("round-trips a built projection and rejects hidden fields", () => {
    const built = buildFor(activeRun());
    expect(built.ok).toBe(true);
    if (!built.ok) {
      return;
    }
    const parsed = parseLearnerProgressionProjection(
      JSON.parse(JSON.stringify(built.value)),
    );
    expect(parsed.ok).toBe(true);

    const hidden = parseLearnerProgressionProjection({
      ...built.value,
      achievements: [],
    });
    expect(hidden.ok).toBe(false);
  });
});
