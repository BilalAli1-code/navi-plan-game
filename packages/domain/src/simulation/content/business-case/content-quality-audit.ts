/**
 * BC-007 content-quality audit helpers (case-neutral where practical).
 *
 * Produces review candidates and hard failures for durable regressions.
 * Similarity findings are candidates — they do not auto-delete content.
 */

import type { BusinessCaseContentPackage } from "./package";
import { classifyInboxMessage } from "./canonical-contracts";
import { evaluateConditionExpression } from "./evaluate-condition";
import type { ConditionEvaluationFacts } from "./evaluate-condition";
import type { ConditionExpression } from "./conditions";

export interface ContentQualityFinding {
  readonly code: string;
  readonly severity: "blocker" | "critical" | "major" | "minor";
  readonly entityId: string;
  readonly message: string;
}

export interface ContentQualityAuditResult {
  readonly findings: readonly ContentQualityFinding[];
  readonly chapterWorkload: ReadonlyArray<{
    readonly chapterId: string;
    readonly requiredDecisions: number;
    readonly requiredActivities: number;
    readonly meetings: number;
    readonly messages: number;
    readonly documents: number;
    readonly estimatedMinutes: number | null;
  }>;
  readonly duplicateLearnerTextCandidates: readonly string[];
}

const localizedFirst = (
  value:
    { readonly values: Readonly<Record<string, string>> } | null | undefined,
): string => {
  if (!value) {
    return "";
  }
  return Object.values(value.values).find((entry) => entry.length > 0) ?? "";
};

const emptyFacts = (): ConditionEvaluationFacts => ({
  completedChapterIds: new Set(),
  currentChapterId: null,
  initiallyUnlockedChapterIds: new Set(),
  submittedDecisionIds: new Set(),
  resolvedDecisionIds: new Set(),
  selectedOptionsByDecisionId: new Map(),
  completedActivityIds: new Set(),
  activeActivityIds: new Set(),
  completedMeetingIds: new Set(),
  availableDocumentIds: new Set(),
  deliveredMessageIds: new Set(),
  metricValues: new Map(),
  narrativeFlags: new Map(),
  experienceLevel: null,
});

const SPOILER_PATTERNS: readonly RegExp[] = [
  /\bcrisis severity\b/i,
  /\bending credibility\b/i,
  /\banswer key\b/i,
  /\bsecret weight\b/i,
  /\bhidden consequence\b/i,
  /\bhighest scoring\b/i,
];

const collectText = (pkg: BusinessCaseContentPackage): string[] => {
  const texts: string[] = [];
  for (const message of pkg.messages) {
    texts.push(localizedFirst(message.subject), localizedFirst(message.body));
  }
  for (const decision of pkg.decisions) {
    texts.push(
      localizedFirst(decision.title),
      localizedFirst(decision.situation),
      localizedFirst(decision.prompt.default),
      localizedFirst(decision.prompt.explorer),
      localizedFirst(decision.prompt.practitioner),
      localizedFirst(decision.prompt.leader),
    );
    for (const option of decision.options) {
      texts.push(
        localizedFirst(option.label),
        localizedFirst(option.description),
      );
    }
  }
  for (const chapter of pkg.chapters) {
    texts.push(
      localizedFirst(chapter.title),
      localizedFirst(chapter.summary),
      localizedFirst(chapter.learnerGuidance?.default),
      localizedFirst(chapter.learnerGuidance?.explorer),
      localizedFirst(chapter.learnerGuidance?.practitioner),
      localizedFirst(chapter.learnerGuidance?.leader),
    );
  }
  return texts.filter((text) => text.length > 0);
};

const conditionReferencesFutureChapter = (
  condition: ConditionExpression,
  currentChapterOrder: number,
  chapterOrderById: ReadonlyMap<string, number>,
): boolean => {
  switch (condition.kind) {
    case "always":
      return false;
    case "all":
    case "any":
      return condition.conditions.some((entry) =>
        conditionReferencesFutureChapter(
          entry,
          currentChapterOrder,
          chapterOrderById,
        ),
      );
    case "not":
      return conditionReferencesFutureChapter(
        condition.condition,
        currentChapterOrder,
        chapterOrderById,
      );
    case "chapter_status": {
      const order = chapterOrderById.get(condition.chapterId);
      return order !== undefined && order > currentChapterOrder;
    }
    default:
      return false;
  }
};

/**
 * Audit a content package for BC-007 quality regressions.
 */
export const auditContentQuality = (
  pkg: BusinessCaseContentPackage,
): ContentQualityAuditResult => {
  const findings: ContentQualityFinding[] = [];
  const chapterOrderById = new Map(
    pkg.chapters.map((chapter) => [chapter.id, chapter.order] as const),
  );

  const decisionIds = new Set(pkg.decisions.map((decision) => decision.id));
  const stakeholderIds = new Set(
    pkg.stakeholders.map((stakeholder) => stakeholder.id),
  );
  const documentIds = new Set(pkg.documents.map((document) => document.id));
  const meetingIds = new Set(pkg.meetings.map((meeting) => meeting.id));
  const activityIds = new Set(pkg.activities.map((activity) => activity.id));

  for (const message of pkg.messages) {
    if (message.informationalOnly && message.requiresResponse) {
      findings.push({
        code: "INFORMATIONAL_REQUIRES_RESPONSE",
        severity: "critical",
        entityId: message.id,
        message: "Informational message must not require a response.",
      });
    }
    if (
      message.relatedDecisionId &&
      !decisionIds.has(message.relatedDecisionId)
    ) {
      findings.push({
        code: "BROKEN_MESSAGE_DECISION_REF",
        severity: "blocker",
        entityId: message.id,
        message: `Message references missing decision ${message.relatedDecisionId}.`,
      });
    }
    if (
      message.senderStakeholderId &&
      !stakeholderIds.has(message.senderStakeholderId)
    ) {
      findings.push({
        code: "ORPHAN_MESSAGE_SENDER",
        severity: "critical",
        entityId: message.id,
        message: `Message sender ${message.senderStakeholderId} is not in the roster.`,
      });
    }
    if (
      classifyInboxMessage(message) === "decision_bearing" &&
      message.informationalOnly
    ) {
      findings.push({
        code: "INFORMATIONAL_CLASSIFIED_DECISION",
        severity: "critical",
        entityId: message.id,
        message: "Informational message classified as decision-bearing.",
      });
    }
  }

  for (const decision of pkg.decisions) {
    const labels = decision.options.map((option) =>
      localizedFirst(option.label).trim().toLowerCase(),
    );
    const uniqueLabels = new Set(labels);
    if (labels.length > 1 && uniqueLabels.size !== labels.length) {
      findings.push({
        code: "DUPLICATE_OPTION_LABELS",
        severity: "major",
        entityId: decision.id,
        message: "Decision has semantically identical option labels.",
      });
    }
    for (const evidence of decision.requiredEvidence ?? []) {
      if (evidence.requiredForEligibility && evidence.minimumItems < 1) {
        findings.push({
          code: "EMPTY_REQUIRED_EVIDENCE",
          severity: "critical",
          entityId: decision.id,
          message: "Required evidence gate has minimumItems < 1.",
        });
      }
    }
  }

  for (const document of pkg.documents) {
    for (const relatedId of document.supportsDecisionIds ?? []) {
      if (!decisionIds.has(relatedId)) {
        findings.push({
          code: "ORPHAN_DOCUMENT_DECISION_REF",
          severity: "major",
          entityId: document.id,
          message: `Document references missing decision ${relatedId}.`,
        });
      }
    }
  }

  for (const meeting of pkg.meetings) {
    for (const participantId of meeting.participantStakeholderIds ?? []) {
      if (!stakeholderIds.has(participantId)) {
        findings.push({
          code: "ORPHAN_MEETING_PARTICIPANT",
          severity: "critical",
          entityId: meeting.id,
          message: `Meeting participant ${participantId} is not in the roster.`,
        });
      }
    }
  }

  for (const activity of pkg.activities) {
    if (!chapterOrderById.has(activity.chapterId)) {
      findings.push({
        code: "ACTIVITY_UNKNOWN_CHAPTER",
        severity: "blocker",
        entityId: activity.id,
        message: `Activity references unknown chapter ${activity.chapterId}.`,
      });
    }
  }

  for (const chapter of pkg.chapters) {
    if (
      conditionReferencesFutureChapter(
        chapter.completionWhen,
        chapter.order,
        chapterOrderById,
      )
    ) {
      findings.push({
        code: "COMPLETION_REFERENCES_FUTURE_CHAPTER",
        severity: "critical",
        entityId: chapter.id,
        message: "Chapter completion condition references a later chapter.",
      });
    }
  }

  const endingOutcomes = pkg.outcomes.filter((outcome) =>
    outcome.id.startsWith("outcome.ending-"),
  );
  for (const ending of endingOutcomes) {
    if (ending.eligibleWhen.kind === "always") {
      findings.push({
        code: "ENDING_ALWAYS_ELIGIBLE",
        severity: "critical",
        entityId: ending.id,
        message:
          "Final ending uses eligibleWhen: always; discriminative conditions are required.",
      });
    }
  }
  // Mirror CompleteChapter selection-time facts: final chapter current, not yet
  // completed, with the package's final-closure-style decisions unresolved unless
  // Northstar-specific IDs are present.
  const northstarFinalClosure =
    "decision.northstar.chapter-06.final-closure-recommendation";
  const selectionTimeFacts: ConditionEvaluationFacts = {
    ...emptyFacts(),
    completedChapterIds: new Set(
      pkg.chapters.slice(0, -1).map((chapter) => chapter.id),
    ),
    currentChapterId: pkg.chapters[pkg.chapters.length - 1]?.id ?? null,
    submittedDecisionIds: new Set(
      pkg.decisions.some((decision) => decision.id === northstarFinalClosure)
        ? [northstarFinalClosure]
        : [],
    ),
    resolvedDecisionIds: new Set(
      pkg.decisions.some((decision) => decision.id === northstarFinalClosure)
        ? [northstarFinalClosure]
        : [],
    ),
  };
  const eligibleAtComplete = endingOutcomes.filter((outcome) =>
    evaluateConditionExpression(outcome.eligibleWhen, selectionTimeFacts),
  );
  if (endingOutcomes.length > 0 && eligibleAtComplete.length === 0) {
    findings.push({
      code: "NO_ENDING_CATCH_ALL",
      severity: "blocker",
      entityId: pkg.manifest.businessCaseId,
      message:
        "No ending remains eligible when all chapters are complete; final ending could return null.",
    });
  }

  const texts = collectText(pkg);
  for (const text of texts) {
    for (const pattern of SPOILER_PATTERNS) {
      if (pattern.test(text)) {
        findings.push({
          code: "LEARNER_FACING_SPOILER",
          severity: "major",
          entityId: "learner-facing-text",
          message: `Learner-facing text matches spoiler pattern ${pattern}.`,
        });
      }
    }
  }

  const normalizedBodies = new Map<string, string[]>();
  for (const message of pkg.messages) {
    const body = localizedFirst(message.body).trim().toLowerCase();
    if (body.length < 40) {
      continue;
    }
    const bucket = normalizedBodies.get(body) ?? [];
    bucket.push(message.id);
    normalizedBodies.set(body, bucket);
  }
  const duplicateLearnerTextCandidates: string[] = [];
  for (const [body, ids] of normalizedBodies) {
    if (ids.length > 1) {
      duplicateLearnerTextCandidates.push(...ids);
      findings.push({
        code: "NEAR_DUPLICATE_INBOX_BODY",
        severity: "minor",
        entityId: ids.join(","),
        message: `Exact duplicate inbox body across ${ids.length} messages (${body.slice(0, 48)}…).`,
      });
    }
  }

  // Unused sets reserved for future orphan sweeps without changing API.
  void documentIds;
  void meetingIds;
  void activityIds;

  const chapterWorkload = pkg.chapters.map((chapter) => {
    const requiredDecisions = pkg.decisions.filter(
      (decision) => decision.chapterId === chapter.id && decision.required,
    ).length;
    const requiredActivities = pkg.activities.filter(
      (activity) => activity.chapterId === chapter.id && activity.required,
    ).length;
    const meetings = pkg.meetings.filter(
      (meeting) => meeting.chapterId === chapter.id,
    ).length;
    const messages = pkg.messages.filter(
      (message) => message.chapterId === chapter.id,
    ).length;
    const documents = pkg.documents.filter(
      (document) => document.chapterId === chapter.id,
    ).length;
    // Deterministic estimate: decisions*8 + activities*4 + meetings*6 + docs*3 + messages*2
    const estimatedMinutes =
      requiredDecisions * 8 +
      requiredActivities * 4 +
      meetings * 6 +
      documents * 3 +
      messages * 2;
    return {
      chapterId: chapter.id,
      requiredDecisions,
      requiredActivities,
      meetings,
      messages,
      documents,
      estimatedMinutes,
    };
  });

  return {
    findings,
    chapterWorkload,
    duplicateLearnerTextCandidates,
  };
};

export const contentQualityHardFailures = (
  result: ContentQualityAuditResult,
): readonly ContentQualityFinding[] =>
  result.findings.filter(
    (finding) =>
      finding.severity === "blocker" || finding.severity === "critical",
  );
