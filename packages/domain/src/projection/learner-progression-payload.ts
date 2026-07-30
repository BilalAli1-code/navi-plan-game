import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import {
  LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION,
  LEARNER_PROGRESSION_PROJECTION_TYPE,
  type LearnerProgressionBlocker,
  type LearnerProgressionBlockerKind,
  type LearnerProgressionChapter,
  type LearnerProgressionChapterStatus,
  type LearnerProgressionProjection,
  type LearnerProgressionRequirement,
  type LearnerProgressionRequirementKind,
  type LearnerProgressionSummary,
} from "./learner-progression-contracts";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const chapterStatuses: readonly LearnerProgressionChapterStatus[] = [
  "locked",
  "available",
  "active",
  "blocked",
  "completed",
];

const requirementKinds: readonly LearnerProgressionRequirementKind[] = [
  "decision",
  "activity",
  "meeting",
];

const blockerKinds: readonly LearnerProgressionBlockerKind[] = [
  "decision",
  "activity",
  "meeting",
  "crisis",
];

const parseRequirement = (
  value: unknown,
): Result<LearnerProgressionRequirement, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.kind !== "string" ||
    !requirementKinds.includes(
      value.kind as LearnerProgressionRequirementKind,
    ) ||
    typeof value.targetId !== "string" ||
    value.targetId.trim().length === 0 ||
    (value.status !== "pending" && value.status !== "completed")
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Learner progression requirement is invalid.",
      ),
    );
  }
  return ok({
    kind: value.kind as LearnerProgressionRequirementKind,
    targetId: value.targetId,
    status: value.status,
  });
};

const parseBlocker = (
  value: unknown,
): Result<LearnerProgressionBlocker, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.code !== "string" ||
    value.code.trim().length === 0 ||
    typeof value.kind !== "string" ||
    !blockerKinds.includes(value.kind as LearnerProgressionBlockerKind) ||
    typeof value.targetId !== "string" ||
    value.targetId.trim().length === 0 ||
    typeof value.message !== "string" ||
    value.message.trim().length === 0
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Learner progression blocker is invalid.",
      ),
    );
  }
  return ok({
    code: value.code,
    kind: value.kind as LearnerProgressionBlockerKind,
    targetId: value.targetId,
    message: value.message,
  });
};

const parseChapter = (
  value: unknown,
): Result<LearnerProgressionChapter, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.chapterId !== "string" ||
    value.chapterId.trim().length === 0 ||
    typeof value.order !== "number" ||
    !Number.isInteger(value.order) ||
    value.order < 1 ||
    typeof value.title !== "string" ||
    value.title.trim().length === 0 ||
    typeof value.status !== "string" ||
    !chapterStatuses.includes(
      value.status as LearnerProgressionChapterStatus,
    ) ||
    !Array.isArray(value.requirements) ||
    !Array.isArray(value.blockers)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Learner progression chapter is invalid.",
      ),
    );
  }
  const requirements: LearnerProgressionRequirement[] = [];
  for (const raw of value.requirements) {
    const parsed = parseRequirement(raw);
    if (!parsed.ok) {
      return parsed;
    }
    requirements.push(parsed.value);
  }
  const blockers: LearnerProgressionBlocker[] = [];
  for (const raw of value.blockers) {
    const parsed = parseBlocker(raw);
    if (!parsed.ok) {
      return parsed;
    }
    blockers.push(parsed.value);
  }
  for (const forbidden of [
    "xp",
    "mastery",
    "achievements",
    "reflection",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Learner progression chapter must not include hidden field '${forbidden}'.`,
        ),
      );
    }
  }
  return ok({
    chapterId: value.chapterId,
    order: value.order,
    title: value.title,
    status: value.status as LearnerProgressionChapterStatus,
    requirements,
    blockers,
  });
};

const parseSummary = (
  value: unknown,
  chaptersLength: number,
): Result<LearnerProgressionSummary, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Learner progression summary is invalid.",
      ),
    );
  }
  const fields = [
    "totalChapters",
    "completedChapterCount",
    "blockedChapterCount",
    "lockedChapterCount",
    "availableChapterCount",
  ] as const;
  for (const field of fields) {
    const count = value[field];
    if (
      typeof count !== "number" ||
      !Number.isInteger(count) ||
      (count as number) < 0
    ) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Learner progression summary counts are invalid.",
        ),
      );
    }
  }
  if (value.totalChapters !== chaptersLength) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Learner progression summary.totalChapters must equal chapters length.",
      ),
    );
  }
  if (
    value.activeChapterId !== null &&
    value.activeChapterId !== undefined &&
    typeof value.activeChapterId !== "string"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Learner progression summary.activeChapterId must be a string or null.",
      ),
    );
  }
  return ok({
    totalChapters: value.totalChapters as number,
    completedChapterCount: value.completedChapterCount as number,
    activeChapterId:
      value.activeChapterId === undefined || value.activeChapterId === null
        ? null
        : String(value.activeChapterId),
    blockedChapterCount: value.blockedChapterCount as number,
    lockedChapterCount: value.lockedChapterCount as number,
    availableChapterCount: value.availableChapterCount as number,
  });
};

export const parseLearnerProgressionProjection = (
  value: unknown,
): Result<LearnerProgressionProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== LEARNER_PROGRESSION_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (
    value.projectionSchemaVersion !==
    LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Learner Progression schema version '${String(value.projectionSchemaVersion)}'.`,
      ),
    );
  }
  if (
    typeof value.projectionId !== "string" ||
    typeof value.tenantId !== "string" ||
    typeof value.simulationRunId !== "string" ||
    typeof value.learnerId !== "string" ||
    typeof value.contentPackageVersionId !== "string" ||
    typeof value.sourceAggregateVersion !== "number" ||
    typeof value.sourceStateVersion !== "number" ||
    typeof value.sourceActionSequence !== "number" ||
    typeof value.generatedAt !== "string" ||
    typeof value.semanticHash !== "string" ||
    !Array.isArray(value.chapters) ||
    !isPlainObject(value.summary)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Learner progression payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Learner progression semanticHash is invalid.",
      ),
    );
  }

  const position = assertProjectionSourcePosition({
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
  });
  if (!position.ok) {
    return position;
  }

  const chapters: LearnerProgressionChapter[] = [];
  const seenChapterIds = new Set<string>();
  for (const raw of value.chapters) {
    const parsed = parseChapter(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenChapterIds.has(parsed.value.chapterId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Learner progression chapters must have unique chapterId values.",
        ),
      );
    }
    seenChapterIds.add(parsed.value.chapterId);
    chapters.push(parsed.value);
  }

  for (let index = 1; index < chapters.length; index += 1) {
    const previous = chapters[index - 1]!;
    const current = chapters[index]!;
    if (current.order < previous.order) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Learner progression chapters must be ordered ascending by order.",
        ),
      );
    }
  }

  const summary = parseSummary(value.summary, chapters.length);
  if (!summary.ok) {
    return summary;
  }

  for (const forbidden of [
    "xp",
    "mastery",
    "achievements",
    "reflection",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Learner progression projection must not include hidden field '${forbidden}'.`,
        ),
      );
    }
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: LEARNER_PROGRESSION_PROJECTION_TYPE,
    projectionSchemaVersion: LEARNER_PROGRESSION_PROJECTION_SCHEMA_VERSION,
    tenantId: value.tenantId as TenantId,
    simulationRunId: value.simulationRunId as SimulationRunId,
    learnerId: value.learnerId as LearnerId,
    contentPackageVersionId:
      value.contentPackageVersionId as ContentPackageVersionId,
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
    sourceEventId:
      value.sourceEventId === null || value.sourceEventId === undefined
        ? null
        : (value.sourceEventId as EventId),
    generatedAt: value.generatedAt as IsoTimestamp,
    semanticHash: asProjectionHash(value.semanticHash),
    chapters,
    summary: summary.value,
  });
};

export const serializeLearnerProgressionProjection = (
  projection: LearnerProgressionProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
