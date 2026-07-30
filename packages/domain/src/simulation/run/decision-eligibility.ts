import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  ActionRecordId,
  ContentPackageVersionId,
  DecisionId,
  DecisionOptionId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { DecisionDefinition } from "../content/decision-definition";
import {
  evaluateConditionExpression,
  type ConditionEvaluationFacts,
} from "../content/business-case/evaluate-condition";
import type { Decision } from "./decision";
import type { SimulationRunStatus } from "./status";
import { isLearnerActionAllowed } from "./status";
import type { SimulationState } from "./state";

/**
 * Pure decision eligibility shared by SubmitDecision and Projection
 * (PS-ROADMAP-006 / BC-006 Workstream 3).
 *
 * Projection must reuse this policy — never a display-only reinterpretation.
 */

export interface DecisionEligibilityContext {
  readonly runStatus: SimulationRunStatus;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly decisions: readonly Decision[];
  /** Initialized document definition ids available as evidence. */
  readonly availableDocumentIds: ReadonlySet<string>;
  /** Completed meeting definition ids available as evidence. */
  readonly completedMeetingIds: ReadonlySet<string>;
  /** Delivered learner-message definition ids available as evidence. */
  readonly deliveredMessageIds: ReadonlySet<string>;
  /** Completed activity ids required as evidence. */
  readonly completedActivityIds: ReadonlySet<string>;
  /** Active activity ids for condition evaluation. */
  readonly activeActivityIds: ReadonlySet<string>;
  /** Completed chapter ids from authoritative chapterProgress. */
  readonly completedChapterIds: ReadonlySet<string>;
  /** Chapters marked initialUnlock in the pinned package (optional). */
  readonly initiallyUnlockedChapterIds: ReadonlySet<string>;
  /** Current chapter cursor on the SimulationRun. */
  readonly currentChapterId: string | null;
  /** Metric values for condition evaluation. */
  readonly metricValues: ReadonlyMap<string, number>;
  /** Narrative / case flags when represented in state (optional empty). */
  readonly narrativeFlags: ReadonlyMap<string, boolean>;
  /** Experience level when available on the run path. */
  readonly experienceLevel: string | null;
}

export interface DecisionEligibilityCommandInput {
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionId: DecisionOptionId;
  readonly definition: DecisionDefinition;
  readonly sourceActionId: ActionRecordId;
  readonly submittedAt: IsoTimestamp;
}

const toConditionFacts = (
  context: DecisionEligibilityContext,
): ConditionEvaluationFacts => {
  const submittedDecisionIds = new Set(
    context.decisions.map((decision) => decision.decisionDefinitionId),
  );
  const resolvedDecisionIds = new Set(
    context.decisions
      .filter((decision) => decision.status === "resolved")
      .map((decision) => decision.decisionDefinitionId),
  );
  const selectedOptionsByDecisionId = new Map<string, string>();
  for (const decision of context.decisions) {
    selectedOptionsByDecisionId.set(
      decision.decisionDefinitionId,
      decision.selectedOptionId,
    );
  }
  return {
    completedChapterIds: context.completedChapterIds,
    currentChapterId: context.currentChapterId,
    initiallyUnlockedChapterIds: context.initiallyUnlockedChapterIds,
    submittedDecisionIds,
    resolvedDecisionIds,
    selectedOptionsByDecisionId,
    completedActivityIds: context.completedActivityIds,
    activeActivityIds: context.activeActivityIds,
    completedMeetingIds: context.completedMeetingIds,
    availableDocumentIds: context.availableDocumentIds,
    deliveredMessageIds: context.deliveredMessageIds,
    metricValues: context.metricValues,
    narrativeFlags: context.narrativeFlags,
    experienceLevel: context.experienceLevel,
  };
};

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

/**
 * Build the shared eligibility context from authoritative run status + state.
 * Used by SubmitDecision and projection builders for parity.
 */
export const buildDecisionEligibilityContext = (input: {
  readonly runStatus: SimulationRunStatus;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly currentChapterId: string | null;
  readonly state: SimulationState;
  readonly initiallyUnlockedChapterIds?: ReadonlySet<string>;
  readonly experienceLevel?: string | null;
}): DecisionEligibilityContext =>
  buildDecisionEligibilityContextFromParts({
    runStatus: input.runStatus,
    contentPackageVersionId: input.contentPackageVersionId,
    currentChapterId: input.currentChapterId,
    decisions: input.state.decisions,
    documents: input.state.documents,
    meetings: input.state.meetings,
    learnerMessages: input.state.learnerMessages,
    activities: input.state.activities,
    projectMetrics: input.state.projectMetrics,
    chapterProgress: input.state.chapterProgress,
    narrativeFlags: input.state.narrativeFlags,
    ...(input.initiallyUnlockedChapterIds
      ? { initiallyUnlockedChapterIds: input.initiallyUnlockedChapterIds }
      : {}),
    ...(input.experienceLevel !== undefined
      ? { experienceLevel: input.experienceLevel }
      : {}),
  });

/**
 * Projection-parity builder from flattened authoritative snapshot fields.
 */
export const buildDecisionEligibilityContextFromParts = (input: {
  readonly runStatus: SimulationRunStatus;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly currentChapterId: string | null;
  readonly decisions: readonly Decision[];
  readonly documents: readonly { readonly documentDefinitionId: string }[];
  readonly meetings: readonly {
    readonly meetingDefinitionId: string;
    readonly status: string;
  }[];
  readonly learnerMessages: readonly {
    readonly definitionId: string;
    readonly deliveryStatus: string;
    readonly deliveredAt: string | null;
  }[];
  readonly activities: readonly {
    readonly activityId: string;
    readonly status: string;
  }[];
  readonly projectMetrics: Readonly<Record<string, { readonly value: number }>>;
  readonly chapterProgress?: readonly unknown[];
  readonly initiallyUnlockedChapterIds?: ReadonlySet<string>;
  readonly experienceLevel?: string | null;
  readonly narrativeFlags?: Readonly<Record<string, boolean>>;
}): DecisionEligibilityContext => {
  const metricValues = new Map<string, number>();
  for (const [key, metric] of Object.entries(input.projectMetrics)) {
    metricValues.set(key, metric.value);
  }
  return {
    runStatus: input.runStatus,
    contentPackageVersionId: input.contentPackageVersionId,
    decisions: input.decisions,
    availableDocumentIds: new Set(
      input.documents.map((document) => document.documentDefinitionId),
    ),
    completedMeetingIds: new Set(
      input.meetings
        .filter((meeting) => meeting.status === "completed")
        .map((meeting) => meeting.meetingDefinitionId),
    ),
    deliveredMessageIds: new Set(
      input.learnerMessages
        .filter(
          (message) =>
            message.deliveryStatus === "delivered" ||
            message.deliveredAt !== null,
        )
        .map((message) => message.definitionId),
    ),
    completedActivityIds: new Set(
      input.activities
        .filter((activity) => activity.status === "completed")
        .map((activity) => activity.activityId),
    ),
    activeActivityIds: new Set(
      input.activities
        .filter((activity) => activity.status === "active")
        .map((activity) => activity.activityId),
    ),
    completedChapterIds: completedChapterIdsFromProgress(
      input.chapterProgress ?? [],
    ),
    initiallyUnlockedChapterIds: input.initiallyUnlockedChapterIds ?? new Set(),
    currentChapterId: input.currentChapterId,
    metricValues,
    narrativeFlags: new Map(Object.entries(input.narrativeFlags ?? {})),
    experienceLevel: input.experienceLevel ?? null,
  };
};

const isChapterUnlockedForDecision = (
  context: DecisionEligibilityContext,
  definition: DecisionDefinition,
): boolean => {
  if (definition.chapterId === null) {
    return true;
  }
  const chapterId = definition.chapterId;
  if (context.currentChapterId === chapterId) {
    return true;
  }
  if (context.initiallyUnlockedChapterIds.has(chapterId)) {
    return (
      context.currentChapterId === null ||
      context.currentChapterId === chapterId
    );
  }
  // A later chapter unlocks only after it becomes the current chapter cursor.
  return false;
};

/** Learner-actionable availability (no selected option required). */
export const isDecisionDefinitionAvailable = (
  context: DecisionEligibilityContext,
  definition: DecisionDefinition,
  evaluatedAt: IsoTimestamp,
): Result<true, RuleViolationError> => {
  if (!isLearnerActionAllowed(context.runStatus)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun is '${context.runStatus}' and cannot accept learner actions.`,
        { status: context.runStatus },
      ),
    );
  }

  if (definition.contentPackageVersionId !== context.contentPackageVersionId) {
    return err(
      ruleViolationError(
        "CONTENT_VERSION_MISMATCH",
        "Decision definition does not belong to this run's contentPackageVersionId.",
        {
          runContentPackageVersionId: context.contentPackageVersionId,
          definitionContentPackageVersionId: definition.contentPackageVersionId,
        },
      ),
    );
  }

  if (definition.availability !== "available") {
    return err(
      ruleViolationError(
        "DECISION_NOT_ELIGIBLE",
        `Decision '${definition.id}' is not available.`,
        { availability: definition.availability },
      ),
    );
  }

  if (definition.expiresAt !== null && evaluatedAt >= definition.expiresAt) {
    return err(
      ruleViolationError(
        "DECISION_EXPIRED",
        `Decision '${definition.id}' expired at ${definition.expiresAt}.`,
        { expiresAt: definition.expiresAt },
      ),
    );
  }

  if (!isChapterUnlockedForDecision(context, definition)) {
    return err(
      ruleViolationError(
        "DECISION_NOT_ELIGIBLE",
        `Decision '${definition.id}' is not eligible because chapter '${definition.chapterId}' is not unlocked.`,
        {
          decisionDefinitionId: definition.id,
          chapterId: definition.chapterId,
          currentChapterId: context.currentChapterId,
          codeHint: "CHAPTER_NOT_UNLOCKED",
        },
      ),
    );
  }

  if (
    definition.eligibilityCondition !== null &&
    !evaluateConditionExpression(
      definition.eligibilityCondition,
      toConditionFacts(context),
    )
  ) {
    return err(
      ruleViolationError(
        "DECISION_NOT_ELIGIBLE",
        `Decision '${definition.id}' authored availability condition is not satisfied.`,
        {
          decisionDefinitionId: definition.id,
          codeHint: "CONDITION_NOT_SATISFIED",
        },
      ),
    );
  }

  const submittedDefinitionIds = new Set(
    context.decisions.map((decision) => decision.decisionDefinitionId),
  );
  for (const prerequisiteId of definition.prerequisiteDecisionIds) {
    if (!submittedDefinitionIds.has(prerequisiteId)) {
      return err(
        ruleViolationError(
          "DECISION_PREREQUISITES_NOT_SATISFIED",
          `Prerequisite decision '${prerequisiteId}' has not been submitted.`,
          { prerequisiteDecisionId: prerequisiteId },
        ),
      );
    }
  }

  for (const documentId of definition.requiredEvidenceDocumentIds) {
    if (!context.availableDocumentIds.has(documentId)) {
      return err(
        ruleViolationError(
          "DECISION_NOT_ELIGIBLE",
          `Required evidence document '${documentId}' is not available for decision '${definition.id}'.`,
          {
            decisionDefinitionId: definition.id,
            requiredEvidenceDocumentId: documentId,
            codeHint: "EVIDENCE_REQUIRED",
          },
        ),
      );
    }
  }

  for (const meetingId of definition.requiredEvidenceMeetingIds) {
    if (!context.completedMeetingIds.has(meetingId)) {
      return err(
        ruleViolationError(
          "DECISION_NOT_ELIGIBLE",
          `Required evidence meeting '${meetingId}' is not completed for decision '${definition.id}'.`,
          {
            decisionDefinitionId: definition.id,
            requiredEvidenceMeetingId: meetingId,
            codeHint: "EVIDENCE_REQUIRED",
          },
        ),
      );
    }
  }

  for (const messageId of definition.requiredEvidenceMessageIds) {
    if (!context.deliveredMessageIds.has(messageId)) {
      return err(
        ruleViolationError(
          "DECISION_NOT_ELIGIBLE",
          `Required evidence message '${messageId}' is not delivered for decision '${definition.id}'.`,
          {
            decisionDefinitionId: definition.id,
            requiredEvidenceMessageId: messageId,
            codeHint: "EVIDENCE_REQUIRED",
          },
        ),
      );
    }
  }

  for (const activityId of definition.requiredEvidenceActivityIds) {
    if (!context.completedActivityIds.has(activityId)) {
      return err(
        ruleViolationError(
          "DECISION_NOT_ELIGIBLE",
          `Required evidence activity '${activityId}' is not completed for decision '${definition.id}'.`,
          {
            decisionDefinitionId: definition.id,
            requiredEvidenceActivityId: activityId,
            codeHint: "EVIDENCE_REQUIRED",
          },
        ),
      );
    }
  }

  if (submittedDefinitionIds.has(definition.id)) {
    return err(
      ruleViolationError(
        "DECISION_ALREADY_SUBMITTED",
        `Decision definition '${definition.id}' was already submitted.`,
        { decisionDefinitionId: definition.id },
      ),
    );
  }

  return ok(true);
};

/** Full SubmitDecision eligibility including selected option and source action. */
export const validateDecisionEligibility = (
  context: DecisionEligibilityContext,
  input: DecisionEligibilityCommandInput,
): Result<void, RuleViolationError> => {
  const available = isDecisionDefinitionAvailable(
    context,
    input.definition,
    input.submittedAt,
  );
  if (!available.ok) {
    return available;
  }

  if (input.definition.id !== input.decisionDefinitionId) {
    return err(
      ruleViolationError(
        "DECISION_DEFINITION_NOT_FOUND",
        "Resolved decision definition id does not match the submitted decisionId.",
        {
          expected: input.decisionDefinitionId,
          actual: input.definition.id,
        },
      ),
    );
  }

  const option = input.definition.options.find(
    (entry) => entry.id === input.selectedOptionId,
  );
  if (!option) {
    return err(
      ruleViolationError(
        "DECISION_OPTION_NOT_FOUND",
        `Option '${input.selectedOptionId}' was not found on decision '${input.decisionDefinitionId}'.`,
        { selectedOptionId: input.selectedOptionId },
      ),
    );
  }
  if (option.decisionDefinitionId !== input.definition.id) {
    return err(
      ruleViolationError(
        "DECISION_OPTION_MISMATCH",
        `Option '${input.selectedOptionId}' does not belong to decision '${input.definition.id}'.`,
        {
          selectedOptionId: input.selectedOptionId,
          optionDecisionDefinitionId: option.decisionDefinitionId,
        },
      ),
    );
  }
  if (!option.outcome) {
    return err(
      ruleViolationError(
        "DECISION_OUTCOME_DEFINITION_INVALID",
        "Selected option is missing an outcome definition.",
      ),
    );
  }

  if (
    context.decisions.some(
      (decision) => decision.sourceActionId === input.sourceActionId,
    )
  ) {
    return err(
      ruleViolationError(
        "DECISION_SOURCE_ACTION_DUPLICATE",
        `Source action '${input.sourceActionId}' already produced a Decision.`,
        { sourceActionId: input.sourceActionId },
      ),
    );
  }

  return ok(undefined);
};
