/**
 * BC-006 Workstream 6 — deterministic learning evidence extraction.
 */

import type { ExperienceLevel } from "../simulation/content/business-case/enums";
import type { SimulationRunReadSnapshot } from "../projection/read-snapshot";
import type { LearningSafeContent } from "./content";

export const LEARNING_EVIDENCE_RULE_VERSION = "learning-evidence/v1";

export type LearningEvidenceSourceType =
  | "decision_learning_signal"
  | "completed_activity"
  | "completed_reflection_activity"
  | "completed_practice_activity"
  | "completed_chapter";

export interface LearningEvidenceRecord {
  readonly evidenceId: string;
  readonly simulationRunId: string;
  readonly contentPackageVersionId: string;
  readonly sourceType: LearningEvidenceSourceType;
  readonly sourceIdentity: string;
  readonly chapterId: string | null;
  readonly competencyIds: readonly string[];
  readonly contributionDelta: number | null;
  readonly learnerSafeSummary: string;
  readonly ruleVersion: string;
  readonly sequence: number;
}

const LEARNING_SIGNAL_PREFIX = "learning_signal:";
const CONSEQUENCE_PREFIX = "consequence:";

/**
 * Recover runtime consequence definition id from a stable learning signal id.
 *
 * Format: `learning_signal:consequence:{runId}|{recordId}|{definitionId}|{resolver}`
 */
export const parseConsequenceDefinitionIdFromLearningSignalId = (
  learningSignalId: string,
): string | null => {
  if (!learningSignalId.startsWith(LEARNING_SIGNAL_PREFIX)) {
    return null;
  }
  const consequenceId = learningSignalId.slice(LEARNING_SIGNAL_PREFIX.length);
  if (!consequenceId.startsWith(CONSEQUENCE_PREFIX)) {
    return null;
  }
  const applicationKey = consequenceId.slice(CONSEQUENCE_PREFIX.length);
  const parts = applicationKey.split("|");
  if (parts.length !== 4) {
    return null;
  }
  return parts[2] ?? null;
};

const activityEvidenceId = (
  simulationRunId: string,
  activityId: string,
): string =>
  `learning_evidence:activity:${simulationRunId}:${activityId}:${LEARNING_EVIDENCE_RULE_VERSION}`;

const chapterEvidenceId = (
  simulationRunId: string,
  chapterId: string,
): string =>
  `learning_evidence:chapter:${simulationRunId}:${chapterId}:${LEARNING_EVIDENCE_RULE_VERSION}`;

const REFLECTIVE_PRACTICE_COMPETENCY_ID = "competency.reflective-practice";

const activitySourceType = (
  activityType: string,
): LearningEvidenceSourceType => {
  if (activityType === "reflection") {
    return "completed_reflection_activity";
  }
  if (activityType === "practice") {
    return "completed_practice_activity";
  }
  return "completed_activity";
};

const competencyIdsForCompletedActivity = (activityMeta: {
  readonly activityType: string;
  readonly relatedDecisionIds: readonly string[];
}): readonly string[] => {
  if (
    activityMeta.activityType === "reflection" &&
    activityMeta.relatedDecisionIds.length === 0
  ) {
    return [REFLECTIVE_PRACTICE_COMPETENCY_ID];
  }
  return [];
};

const chapterIdForDecision = (
  learningContent: LearningSafeContent,
  decisionDefinitionId: string,
): string | null => {
  for (const chapter of learningContent.chapters) {
    if (chapter.requiredDecisionIds.includes(decisionDefinitionId)) {
      return chapter.id;
    }
  }
  return null;
};

const compareEvidence = (
  left: LearningEvidenceRecord,
  right: LearningEvidenceRecord,
): number => {
  if (left.sequence !== right.sequence) {
    return left.sequence - right.sequence;
  }
  return left.evidenceId.localeCompare(right.evidenceId);
};

export interface ExtractLearningEvidenceInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly learningContent: LearningSafeContent;
  readonly experienceLevel: ExperienceLevel | null;
}

/**
 * Derive idempotent, deterministically ordered learning evidence from an
 * authoritative read snapshot. Informational inbox messages never contribute.
 */
export const extractLearningEvidence = (
  input: ExtractLearningEvidenceInput,
): readonly LearningEvidenceRecord[] => {
  void input.experienceLevel;
  const { snapshot, learningContent } = input;
  const byEvidenceId = new Map<string, LearningEvidenceRecord>();
  let sequence = 0;

  const upsert = (record: Omit<LearningEvidenceRecord, "sequence">): void => {
    const existing = byEvidenceId.get(record.evidenceId);
    if (existing) {
      return;
    }
    byEvidenceId.set(record.evidenceId, { ...record, sequence });
    sequence += 1;
  };

  const outcomesByDecisionRecordId = new Map(
    snapshot.decisionOutcomes.map((outcome) => [
      outcome.decisionRecordId,
      outcome,
    ]),
  );

  for (const decision of snapshot.decisions) {
    if (decision.status !== "resolved") {
      continue;
    }
    const outcome = outcomesByDecisionRecordId.get(decision.id);
    if (!outcome) {
      continue;
    }
    const chapterId = chapterIdForDecision(
      learningContent,
      decision.decisionDefinitionId,
    );

    for (const signalId of outcome.learningSignalIds) {
      const consequenceDefinitionId =
        parseConsequenceDefinitionIdFromLearningSignalId(signalId);
      if (consequenceDefinitionId === null) {
        continue;
      }
      const payload =
        learningContent.consequenceLearningSignals[consequenceDefinitionId];
      if (!payload) {
        continue;
      }
      const competencyTitle =
        learningContent.competencies.find(
          (competency) => competency.id === payload.competencyKey,
        )?.title ?? payload.competencyKey;
      upsert({
        evidenceId: signalId,
        simulationRunId: snapshot.simulationRunId,
        contentPackageVersionId: snapshot.contentPackageVersionId,
        sourceType: "decision_learning_signal",
        sourceIdentity: signalId,
        chapterId,
        competencyIds: [payload.competencyKey],
        contributionDelta: payload.delta,
        learnerSafeSummary: `Decision evidence contributed to ${competencyTitle}.`,
        ruleVersion: LEARNING_EVIDENCE_RULE_VERSION,
      });
    }
  }

  const activityMetaById = new Map(
    learningContent.activities.map((activity) => [activity.id, activity]),
  );

  for (const activity of snapshot.activities) {
    if (activity.status !== "completed") {
      continue;
    }
    const meta = activityMetaById.get(activity.activityId);
    if (!meta) {
      continue;
    }
    upsert({
      evidenceId: activityEvidenceId(
        snapshot.simulationRunId,
        activity.activityId,
      ),
      simulationRunId: snapshot.simulationRunId,
      contentPackageVersionId: snapshot.contentPackageVersionId,
      sourceType: activitySourceType(meta.activityType),
      sourceIdentity: activity.activityId,
      chapterId: meta.chapterId,
      competencyIds: competencyIdsForCompletedActivity(meta),
      contributionDelta: null,
      learnerSafeSummary: `Completed activity: ${meta.title}.`,
      ruleVersion: LEARNING_EVIDENCE_RULE_VERSION,
    });
  }

  for (const entry of snapshot.chapterProgress) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      continue;
    }
    const record = entry as Record<string, unknown>;
    if (record.status !== "completed" || typeof record.chapterId !== "string") {
      continue;
    }
    const chapter = learningContent.chapters.find(
      (item) => item.id === record.chapterId,
    );
    upsert({
      evidenceId: chapterEvidenceId(snapshot.simulationRunId, record.chapterId),
      simulationRunId: snapshot.simulationRunId,
      contentPackageVersionId: snapshot.contentPackageVersionId,
      sourceType: "completed_chapter",
      sourceIdentity: record.chapterId,
      chapterId: record.chapterId,
      competencyIds: [],
      contributionDelta: null,
      learnerSafeSummary: `Completed chapter: ${chapter?.title ?? record.chapterId}.`,
      ruleVersion: LEARNING_EVIDENCE_RULE_VERSION,
    });
  }

  return [...byEvidenceId.values()].sort(compareEvidence);
};
