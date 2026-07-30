/**
 * BC-006 Northstar content factory helpers — compact builders for chapters 2–6.
 */

import {
  asActivityId,
  asChapterId,
  asDecisionId,
  asDecisionOptionId,
  asDocumentId,
  asMeetingDefinitionId,
  asMetricKey,
  asNotificationId,
  asStakeholderId,
  type ChapterId,
  type DecisionOptionId,
  type MetricKey,
} from "../../../../shared-kernel/ids";
import { always } from "../conditions";
import type { ConditionExpression } from "../conditions";
import type {
  ActivityDefinition,
  ChapterDefinition,
  ContentConsequenceDefinition,
  ContentDecisionDefinition,
  ContentDecisionOptionDefinition,
  DocumentAccessibilityMetadata,
  DocumentDefinition,
  MeetingAgendaItem,
  MeetingDefinition,
  MessageDefinition,
  NotificationDefinition,
} from "../entities";
import {
  asCompetencyId,
  asCrisisId,
  asEvidenceTag,
  asLearningObjectiveId,
  asMessageDefinitionId,
  type EvidenceTag,
} from "../ids";
import type { DecisionId } from "../../../../shared-kernel/ids";
import type { CrisisDefinition } from "../entities";
import type { ConsequenceEffect } from "../effects";
import { localizedText } from "../localized";
import type { ExperienceVariant, LocalizedText } from "../localized";

export type CatalogMessageClass =
  | "informational"
  | "preparation_required"
  | "actionable"
  | "escalation"
  | "decision_triggering";

export interface MessageResponseFlags {
  readonly informationalOnly: boolean;
  readonly requiresResponse: boolean;
  readonly relatedDecisionId: DecisionId | null;
}

/** Map inbox catalog classification to message response fields. */
export const messageResponseFlags = (
  catalogClass: CatalogMessageClass,
  relatedDecisionId: DecisionId | null = null,
): MessageResponseFlags => {
  if (catalogClass === "informational") {
    return {
      informationalOnly: true,
      requiresResponse: false,
      relatedDecisionId: null,
    };
  }
  if (catalogClass === "decision_triggering") {
    return {
      informationalOnly: false,
      requiresResponse: true,
      relatedDecisionId,
    };
  }
  return {
    informationalOnly: false,
    requiresResponse: true,
    relatedDecisionId: null,
  };
};

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export const evidenceTagForDocumentId = (documentId: string): EvidenceTag => {
  const slug = documentId.startsWith("document.")
    ? documentId.slice("document.".length)
    : documentId;
  return asEvidenceTag(`evidence.${slug}`);
};

const defaultDocAccessibility = (
  title: LocalizedText,
): DocumentAccessibilityMetadata => ({
  accessibleTitle: title,
  language: "en-US",
  textAlternative: localizedText(
    `Accessible text of ${title.values["en-US"] ?? "document"}`,
  ),
  readingOrderNotes: null,
});

export interface BuildDocumentInput {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly documentType: string;
  readonly title: string;
  readonly summary: string;
  readonly body?: string;
  readonly supportsDecisionIds?: readonly string[];
  readonly availableWhen?: ConditionExpression;
}

export const buildDocument = (
  input: BuildDocumentInput,
): DocumentDefinition => {
  const id = asDocumentId(input.id);
  const title = localizedText(input.title);
  return {
    id,
    chapterId: input.chapterId,
    documentType: input.documentType,
    title,
    summary: localizedText(input.summary),
    body: localizedText(
      input.body ??
        `${input.summary} This artifact supports integrated governance, traceability, and decision quality for Connected Care.`,
    ),
    assetId: null,
    availableWhen: input.availableWhen ?? always,
    evidenceTags: [evidenceTagForDocumentId(input.id)],
    supportsDecisionIds: (input.supportsDecisionIds ?? []).map(asDecisionId),
    containsHiddenSections: false,
    accessibility: defaultDocAccessibility(title),
  };
};

export interface BuildMessageInput {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly senderStakeholderId: string | null;
  readonly subject: string;
  readonly body: string;
  readonly catalogClass: CatalogMessageClass;
  readonly relatedDecisionId?: string | null;
  readonly relatedMeetingId?: string | null;
  readonly relatedDocumentIds?: readonly string[];
  readonly urgency?: MessageDefinition["urgency"];
}

export const buildMessage = (input: BuildMessageInput): MessageDefinition => {
  const flags = messageResponseFlags(
    input.catalogClass,
    input.relatedDecisionId ? asDecisionId(input.relatedDecisionId) : null,
  );
  return {
    id: asMessageDefinitionId(input.id),
    chapterId: input.chapterId,
    senderStakeholderId: input.senderStakeholderId
      ? asStakeholderId(input.senderStakeholderId)
      : null,
    channel: "inbox",
    subject: localizedText(input.subject),
    body: localizedText(input.body),
    availableWhen: always,
    relatedDecisionId: flags.relatedDecisionId,
    relatedMeetingId: input.relatedMeetingId
      ? asMeetingDefinitionId(input.relatedMeetingId)
      : null,
    relatedDocumentIds: (input.relatedDocumentIds ?? []).map(asDocumentId),
    informationalOnly: flags.informationalOnly,
    requiresResponse: flags.requiresResponse,
    urgency: input.urgency ?? "important",
    accessibilitySummary: localizedText(`Inbox message: ${input.subject}`),
  };
};

export interface BuildMeetingInput {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly title: string;
  readonly purpose: string;
  readonly participantStakeholderIds: readonly string[];
  readonly agendaTitles: readonly string[];
  readonly relatedDecisionIds?: readonly string[];
  readonly relatedDocumentIds?: readonly string[];
  readonly estimatedMinutes?: number;
}

export const buildMeeting = (input: BuildMeetingInput): MeetingDefinition => {
  const meetingId = asMeetingDefinitionId(input.id);
  const agendaItems: MeetingAgendaItem[] = input.agendaTitles.map((title) => ({
    title: localizedText(title),
    durationMinutes: Math.max(
      10,
      Math.floor((input.estimatedMinutes ?? 60) / input.agendaTitles.length),
    ),
  }));
  return {
    id: meetingId,
    chapterId: input.chapterId,
    title: localizedText(input.title),
    purpose: localizedText(input.purpose),
    participantStakeholderIds:
      input.participantStakeholderIds.map(asStakeholderId),
    agendaItems,
    availableWhen: always,
    completionWhen: {
      kind: "meeting_status",
      meetingId,
      status: "completed",
    },
    relatedDecisionIds: (input.relatedDecisionIds ?? []).map(asDecisionId),
    relatedDocumentIds: (input.relatedDocumentIds ?? []).map(asDocumentId),
    estimatedMinutes: input.estimatedMinutes ?? 60,
    required: true,
    accessibilitySummary: localizedText(`Required meeting: ${input.title}`),
  };
};

export interface BuildActivityInput {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly title: string;
  readonly instructions: string;
  readonly activityType: ActivityDefinition["activityType"];
  readonly relatedDocumentIds?: readonly string[];
  readonly relatedDecisionIds?: readonly string[];
  readonly learningObjectiveIds?: readonly string[];
  readonly estimatedMinutes?: number;
  readonly completionWhen?: ConditionExpression;
}

export const buildActivity = (
  input: BuildActivityInput,
): ActivityDefinition => {
  const activityId = asActivityId(input.id);
  return {
    id: activityId,
    chapterId: input.chapterId,
    title: localizedText(input.title),
    instructions: { default: localizedText(input.instructions) },
    activityType: input.activityType,
    availableWhen: always,
    completionWhen: input.completionWhen ?? {
      kind: "activity_status",
      activityId,
      status: "completed",
    },
    required: true,
    relatedDocumentIds: (input.relatedDocumentIds ?? []).map(asDocumentId),
    relatedDecisionIds: (input.relatedDecisionIds ?? []).map(asDecisionId),
    learningObjectiveIds: (input.learningObjectiveIds ?? []).map(
      asLearningObjectiveId,
    ),
    estimatedMinutes: input.estimatedMinutes ?? 20,
  };
};

export interface BuildNotificationInput {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly title: string;
  readonly summary: string;
  readonly body: string;
}

export const buildNotification = (
  input: BuildNotificationInput,
): NotificationDefinition => ({
  id: asNotificationId(input.id),
  chapterId: input.chapterId,
  title: localizedText(input.title),
  summary: localizedText(input.summary),
  body: localizedText(input.body),
  availableWhen: always,
  accessibilitySummary: localizedText(input.title),
});

export interface DecisionOptionSpec {
  readonly label: string;
  readonly description: string;
}

export interface BuildDecisionInput {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly chapterNum: string;
  readonly shortName: string;
  readonly title: string;
  readonly situation: string;
  readonly prompt: string;
  readonly options: readonly DecisionOptionSpec[];
  readonly evidenceTags?: readonly string[];
  readonly learningObjectiveIds?: readonly string[];
  readonly competencyId?: string;
  readonly stakeholderIdsForEffects?: readonly string[];
}

export interface BuiltDecisionBundle {
  readonly decision: ContentDecisionDefinition;
  readonly consequences: readonly ContentConsequenceDefinition[];
  readonly optionIds: readonly DecisionOptionId[];
}

const metricKeys: readonly MetricKey[] = [
  asMetricKey("schedule_pressure"),
  asMetricKey("value_confidence"),
  asMetricKey("operational_stability"),
  asMetricKey("risk_exposure"),
  asMetricKey("plan_certainty"),
  asMetricKey("discovery_coverage"),
  asMetricKey("governance_clarity"),
  asMetricKey("engagement_breadth"),
];

export const buildDecision = (
  input: BuildDecisionInput,
): BuiltDecisionBundle => {
  const decisionId = asDecisionId(input.id);
  const competencyId = asCompetencyId(
    input.competencyId ?? "competency.decision-quality",
  );
  const stakeholderIds = (input.stakeholderIdsForEffects ?? []).map(
    asStakeholderId,
  );
  const consequenceIdsByOption: Record<string, readonly string[]> = {};
  const options: ContentDecisionOptionDefinition[] = [];
  const consequences: ContentConsequenceDefinition[] = [];

  input.options.forEach((opt, index) => {
    const optionSlug = slugify(opt.label);
    const optionId = asDecisionOptionId(
      `option.northstar.chapter-${input.chapterNum}.${input.shortName}.${optionSlug}`,
    );
    const consequenceId = `consequence.northstar.chapter-${input.chapterNum}.${input.shortName}.${optionSlug}`;
    consequenceIdsByOption[optionId] = [consequenceId];

    options.push({
      id: optionId,
      label: localizedText(opt.label),
      description: localizedText(opt.description),
      rationalePrompt: localizedText(
        `Why is "${opt.label}" the best-supported choice given the evidence?`,
      ),
      availableWhen: always,
    });

    // Keep metric deltas small so a complete six-chapter path remains within
    // fail-closed [0, 100] metric bounds (BC-006 W7 integrated validation).
    const effects: ConsequenceEffect[] = [
      {
        kind: "change_project_metric",
        metricKey: metricKeys[index % metricKeys.length]!,
        delta: index % 2 === 0 ? 1 : -1,
      },
      {
        kind: "emit_competency_signal",
        competencyId,
        delta: index === 0 ? 4 : index === 1 ? 2 : -1,
      },
    ];
    if (stakeholderIds.length > 0) {
      effects.push({
        kind: "change_stakeholder_signal",
        stakeholderId: stakeholderIds[index % stakeholderIds.length]!,
        delta: index % 2 === 0 ? 3 : -2,
      });
    }

    consequences.push({
      id: consequenceId,
      sourceDecisionId: decisionId,
      sourceEventId: null,
      applyWhen: {
        kind: "decision_option_selected",
        decisionId,
        optionId,
      },
      timing: { kind: "immediate" },
      effects,
      learnerFeedback: {
        default: localizedText(
          `After you chose "${opt.label}" on ${input.title}: ${opt.description} Project metrics and stakeholder signals update to reflect this trade-off.`,
        ),
      },
      reversible: false,
      recoveryActivityIds: [],
    });
  });

  const decision: ContentDecisionDefinition = {
    id: decisionId,
    chapterId: input.chapterId,
    title: localizedText(input.title),
    situation: localizedText(input.situation),
    prompt: { default: localizedText(input.prompt) },
    decisionType: "single_select",
    availableWhen: always,
    requiredEvidence: (input.evidenceTags ?? []).map((tag) => ({
      evidenceTag: asEvidenceTag(tag),
      minimumItems: 1,
      sourceTypes: ["document"] as const,
      requiredForEligibility: true,
      contributesToScoring: true,
    })),
    options,
    rubric: {
      competencyWeights: {
        [competencyId]: 50,
        [asCompetencyId("competency.governance")]: 50,
      },
      notes: localizedText(
        "Score evidence use, governance, and stakeholder trade-offs.",
      ),
    },
    consequenceIdsByOption,
    required: true,
    reversible: false,
    learningObjectiveIds: (input.learningObjectiveIds ?? []).map(
      asLearningObjectiveId,
    ),
    accessibilitySummary: localizedText(input.title),
  };

  return {
    decision,
    consequences,
    optionIds: options.map((o) => o.id),
  };
};

export interface BuildChapterInput {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly learningObjectiveIds: readonly string[];
  readonly priorChapterId: string;
  readonly requiredActivityIds: readonly string[];
  readonly requiredDecisionIds: readonly string[];
  readonly estimatedMinutes?: number;
  readonly learnerGuidance: ExperienceVariant<LocalizedText>;
}

export const buildChapter = (input: BuildChapterInput): ChapterDefinition => {
  const chapterId = asChapterId(input.id);
  const activityConditions: ConditionExpression[] =
    input.requiredActivityIds.map((aid) => ({
      kind: "activity_status",
      activityId: asActivityId(aid),
      status: "completed",
    }));
  const decisionConditions: ConditionExpression[] =
    input.requiredDecisionIds.map((did) => ({
      kind: "decision_status",
      decisionId: asDecisionId(did),
      status: "resolved",
    }));

  return {
    id: chapterId,
    order: input.order,
    title: localizedText(input.title),
    summary: localizedText(input.summary),
    learningObjectiveIds: input.learningObjectiveIds.map(asLearningObjectiveId),
    initialUnlock: false,
    unlockWhen: {
      kind: "chapter_status",
      chapterId: asChapterId(input.priorChapterId),
      status: "completed",
    },
    completionWhen: {
      kind: "all",
      conditions: [...activityConditions, ...decisionConditions],
    },
    requiredActivityIds: input.requiredActivityIds.map(asActivityId),
    requiredDecisionIds: input.requiredDecisionIds.map(asDecisionId),
    entryEventIds: [],
    completionEventIds: [],
    estimatedMinutes: input.estimatedMinutes ?? 100,
    learnerGuidance: input.learnerGuidance,
  };
};

export interface BuildCrisisInput {
  readonly id: string;
  readonly chapterId: ChapterId;
  readonly title: string;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedStakeholderIds: readonly string[];
  readonly resolutionDecisionId: string;
}

export interface BuildConsequenceInput {
  readonly id: string;
  readonly sourceDecisionId: string;
  readonly optionId: string;
  readonly feedback: string;
  readonly metricKey?: string;
  readonly metricDelta?: number;
  readonly stakeholderDeltas?: readonly {
    readonly stakeholderId: string;
    readonly delta: number;
  }[];
  readonly competencyId?: string;
  readonly competencyDelta?: number;
}

export const buildConsequence = (
  input: BuildConsequenceInput,
): ContentConsequenceDefinition => {
  const decisionId = asDecisionId(input.sourceDecisionId);
  const optionId = asDecisionOptionId(input.optionId);
  const effects: ConsequenceEffect[] = [
    {
      kind: "change_project_metric",
      metricKey: asMetricKey(input.metricKey ?? "value_confidence"),
      delta: input.metricDelta ?? 4,
    },
    {
      kind: "emit_competency_signal",
      competencyId: asCompetencyId(
        input.competencyId ?? "competency.decision-quality",
      ),
      delta: input.competencyDelta ?? 3,
    },
  ];
  for (const sd of input.stakeholderDeltas ?? []) {
    effects.push({
      kind: "change_stakeholder_signal",
      stakeholderId: asStakeholderId(sd.stakeholderId),
      delta: sd.delta,
    });
  }
  return {
    id: input.id,
    sourceDecisionId: decisionId,
    sourceEventId: null,
    applyWhen: {
      kind: "decision_option_selected",
      decisionId,
      optionId,
    },
    timing: { kind: "immediate" },
    effects,
    learnerFeedback: { default: localizedText(input.feedback) },
    reversible: false,
    recoveryActivityIds: [],
  };
};

export const buildCrisis = (input: BuildCrisisInput): CrisisDefinition => ({
  id: asCrisisId(input.id),
  chapterId: input.chapterId,
  title: localizedText(input.title),
  triggerWhen: always,
  initialEventIds: [],
  relatedDecisionIds: input.relatedDecisionIds.map(asDecisionId),
  relatedStakeholderIds: input.relatedStakeholderIds.map(asStakeholderId),
  resolutionWhen: {
    kind: "decision_status",
    decisionId: asDecisionId(input.resolutionDecisionId),
    status: "resolved",
  },
  outcomeFlags: [],
});

export const chapterIdForOrder = (order: number): ChapterId =>
  asChapterId(`chapter-0${order}`);

export const northstarDecisionId = (chapterNum: number, name: string): string =>
  `decision.northstar.chapter-0${chapterNum}.${name}`;
