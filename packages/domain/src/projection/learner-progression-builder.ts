import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { DecisionId, EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type {
  ProjectionSafeChapterDefinition,
  ProjectionSafeContent,
} from "./content";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION,
  LEARNER_PROGRESSION_PROJECTION_TYPE,
  type LearnerProgressionBlocker,
  type LearnerProgressionChapter,
  type LearnerProgressionChapterStatus,
  type LearnerProgressionProjection,
  type LearnerProgressionRequirement,
  type LearnerProgressionSummary,
} from "./learner-progression-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildLearnerProgressionProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly projectionContent: ProjectionSafeContent;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const completedChapterIdsFromProgress = (
  chapterProgress: readonly unknown[],
): Set<string> => {
  const ids = new Set<string>();
  for (const entry of chapterProgress) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    if (typeof record.chapterId === "string" && record.status === "completed") {
      ids.add(record.chapterId);
    }
  }
  return ids;
};

const buildRequirements = (
  chapter: ProjectionSafeChapterDefinition,
  snapshot: SimulationRunReadSnapshot,
): readonly LearnerProgressionRequirement[] => {
  const requirements: LearnerProgressionRequirement[] = [
    ...chapter.requiredDecisionIds.map((targetId) => ({
      kind: "decision" as const,
      targetId,
      status: snapshot.decisions.some(
        (decision) =>
          decision.decisionDefinitionId === (targetId as DecisionId) &&
          decision.status === "resolved",
      )
        ? ("completed" as const)
        : ("pending" as const),
    })),
    ...chapter.requiredActivityIds.map((targetId) => ({
      kind: "activity" as const,
      targetId,
      status: snapshot.activities.some(
        (activity) =>
          activity.activityId === targetId && activity.status === "completed",
      )
        ? ("completed" as const)
        : ("pending" as const),
    })),
    ...chapter.requiredMeetingIds.map((targetId) => ({
      kind: "meeting" as const,
      targetId,
      status: snapshot.meetings.some(
        (meeting) =>
          meeting.meetingDefinitionId === targetId &&
          meeting.status === "completed",
      )
        ? ("completed" as const)
        : ("pending" as const),
    })),
  ];
  return requirements.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind.localeCompare(b.kind);
    }
    return a.targetId.localeCompare(b.targetId);
  });
};

const buildBlockers = (
  chapter: ProjectionSafeChapterDefinition,
  requirements: readonly LearnerProgressionRequirement[],
  snapshot: SimulationRunReadSnapshot,
): readonly LearnerProgressionBlocker[] => {
  const blockers: LearnerProgressionBlocker[] = requirements
    .filter((requirement) => requirement.status === "pending")
    .map((requirement) => ({
      code: `REQUIRED_${requirement.kind.toUpperCase()}_INCOMPLETE`,
      kind: requirement.kind,
      targetId: requirement.targetId,
      message: `Required ${requirement.kind} '${requirement.targetId}' is not complete.`,
    }));

  for (const crisis of snapshot.crises) {
    if (crisis.chapterId === chapter.id && crisis.status === "triggered") {
      blockers.push({
        code: "CRISIS_BLOCKING",
        kind: "crisis",
        targetId: crisis.crisisId,
        message: `Crisis '${crisis.crisisId}' is unresolved.`,
      });
    }
  }

  return blockers.sort((a, b) => {
    if (a.code !== b.code) {
      return a.code.localeCompare(b.code);
    }
    return a.targetId.localeCompare(b.targetId);
  });
};

const deriveChapterStatus = (input: {
  readonly chapter: ProjectionSafeChapterDefinition;
  readonly chapters: readonly ProjectionSafeChapterDefinition[];
  readonly completedChapterIds: ReadonlySet<string>;
  readonly currentChapterId: string | null;
  readonly blockers: readonly LearnerProgressionBlocker[];
}): LearnerProgressionChapterStatus => {
  const { chapter, chapters, completedChapterIds, currentChapterId, blockers } =
    input;

  if (completedChapterIds.has(chapter.id)) {
    return "completed";
  }

  const priorIncomplete = chapters.some(
    (candidate) =>
      candidate.order < chapter.order && !completedChapterIds.has(candidate.id),
  );
  if (priorIncomplete) {
    return "locked";
  }

  if (currentChapterId === chapter.id) {
    return blockers.length > 0 ? "blocked" : "active";
  }

  const immediatelyPrior = chapters.find(
    (candidate) => candidate.order === chapter.order - 1,
  );
  if (
    chapter.order === chapters[0]?.order ||
    (immediatelyPrior && completedChapterIds.has(immediatelyPrior.id))
  ) {
    return "available";
  }

  return "locked";
};

const summarizeChapters = (
  chapters: readonly LearnerProgressionChapter[],
  currentChapterId: string | null,
): LearnerProgressionSummary => {
  let completedChapterCount = 0;
  let blockedChapterCount = 0;
  let lockedChapterCount = 0;
  let availableChapterCount = 0;
  for (const chapter of chapters) {
    switch (chapter.status) {
      case "completed":
        completedChapterCount += 1;
        break;
      case "blocked":
        blockedChapterCount += 1;
        break;
      case "locked":
        lockedChapterCount += 1;
        break;
      case "available":
        availableChapterCount += 1;
        break;
      default:
        break;
    }
  }
  return {
    totalChapters: chapters.length,
    completedChapterCount,
    activeChapterId: currentChapterId,
    blockedChapterCount,
    lockedChapterCount,
    availableChapterCount,
  };
};

/**
 * Pure Learner Progression projection builder (BC-006 Workstream 5).
 *
 * Deterministic, side-effect-free, learner-safe. No XP/mastery/achievements/
 * reflection. Source: authoritative snapshot + projection-safe chapter catalogs.
 */
export const buildLearnerProgressionProjection = (
  input: BuildLearnerProgressionProjectionInput,
): Result<LearnerProgressionProjection, RuleViolationError> => {
  const { snapshot, projectionContent, generatedAt } = input;

  if (
    projectionContent.contentPackageVersionId !==
    snapshot.contentPackageVersionId
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_CONTENT_VERSION_MISMATCH",
        "Projection content version does not match the run contentPackageVersionId.",
      ),
    );
  }

  const completedChapterIds = completedChapterIdsFromProgress(
    snapshot.chapterProgress,
  );

  const orderedChapters = [...projectionContent.chapters].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.id.localeCompare(b.id);
  });

  const chapters: LearnerProgressionChapter[] = orderedChapters.map(
    (chapter) => {
      const requirements = buildRequirements(chapter, snapshot);
      const blockers = buildBlockers(chapter, requirements, snapshot);
      const status = deriveChapterStatus({
        chapter,
        chapters: orderedChapters,
        completedChapterIds,
        currentChapterId: snapshot.currentChapterId,
        blockers,
      });
      return {
        chapterId: chapter.id,
        order: chapter.order,
        title: chapter.title,
        status,
        requirements,
        blockers,
      };
    },
  );

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: LEARNER_PROGRESSION_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: LEARNER_PROGRESSION_PROJECTION_TYPE,
    projectionSchemaVersion: LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    chapters,
    summary: summarizeChapters(chapters, snapshot.currentChapterId),
  };

  return ok({
    ...withoutHash,
    semanticHash: computeLearnerProgressionSemanticHash(withoutHash),
  });
};

export type SemanticLearnerProgressionInput = Omit<
  LearnerProgressionProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticLearnerProgressionPayload = (
  projection: SemanticLearnerProgressionInput,
): Readonly<Record<string, unknown>> => ({
  projectionId: projection.projectionId,
  projectionType: projection.projectionType,
  projectionSchemaVersion: projection.projectionSchemaVersion,
  tenantId: projection.tenantId,
  simulationRunId: projection.simulationRunId,
  learnerId: projection.learnerId,
  contentPackageVersionId: projection.contentPackageVersionId,
  sourceAggregateVersion: projection.sourceAggregateVersion,
  sourceStateVersion: projection.sourceStateVersion,
  sourceActionSequence: projection.sourceActionSequence,
  chapters: projection.chapters,
  summary: projection.summary,
});

export const computeLearnerProgressionSemanticHash = (
  projection: SemanticLearnerProgressionInput,
) =>
  computeSemanticHashFromStableValue(
    semanticLearnerProgressionPayload(projection),
  );
