/**
 * Map BC-003 authored content decisions/consequences onto runtime
 * DecisionDefinition contracts used by SubmitDecision resolution.
 */

import {
  asConsequenceDefinitionId,
  asDecisionOutcomeDefinitionId,
  asDocumentId,
  asLearnerMessageDefinitionId,
  asMetricKey,
  type ActivityId,
  type ChapterId,
  type ContentPackageVersionId,
  type DecisionId,
  type DocumentId,
  type MeetingDefinitionId,
} from "../../../shared-kernel/ids";
import { SUPPORTED_RESOLVER_VERSION } from "../../run/decision-resolver";
import type { DecisionDefinition } from "../decision-definition";
import type { ConsequenceDefinition } from "../consequence-definition";
import type { DecisionOutcomeDefinition } from "../decision-outcome-definition";
import type {
  ContentConsequenceDefinition,
  ContentDecisionDefinition,
} from "./entities";
import type { ConsequenceEffect } from "./effects";
import type { ConditionExpression } from "./conditions";
import type { BusinessCaseContentPackage } from "./package";
import { resolveLocalizedText, resolveExperienceVariant } from "./localized";
import type { ExperienceLevel } from "./enums";
import type {
  ProjectionSafeContent,
  ProjectionSafeDecisionDefinition,
} from "../../../projection/content";
import { classifyInboxMessage } from "./canonical-contracts";

interface DelayedScheduleProvenance {
  readonly sourceDecisionId: string | null;
  readonly sourceChapterId: string | null;
  readonly targetChapterId: string | null;
  readonly deferredEffectKind: string | null;
  readonly deferredEffectPayload: string | null;
}

const delayedSchedule = (
  id: ReturnType<typeof asConsequenceDefinitionId>,
  delayMs: number,
  reasonCode: string,
  provenance: DelayedScheduleProvenance = {
    sourceDecisionId: null,
    sourceChapterId: null,
    targetChapterId: null,
    deferredEffectKind: null,
    deferredEffectPayload: null,
  },
): ConsequenceDefinition => ({
  id,
  type: "schedule_event",
  timing: "delayed",
  target: { kind: "scheduled_event" },
  payload: {
    delayMs,
    reasonCode,
    sourceDecisionId: provenance.sourceDecisionId,
    sourceChapterId: provenance.sourceChapterId,
    targetChapterId: provenance.targetChapterId,
    deferredEffectKind: provenance.deferredEffectKind,
    deferredEffectPayload: provenance.deferredEffectPayload,
    triggerType:
      provenance.targetChapterId !== null ? "chapter_entry" : "chapter_exit",
    priority: 100,
  },
});

const stableJson = (value: unknown): string => JSON.stringify(value);

const mapEffectToConsequence = (
  effect: ConsequenceEffect,
  consequenceId: string,
  effectIndex: number,
  timing: "immediate" | "delayed",
  delayMs: number,
  provenance: DelayedScheduleProvenance,
): ConsequenceDefinition | null => {
  const id = asConsequenceDefinitionId(
    `${consequenceId}:effect:${effectIndex}`,
  );
  const delayedProvenance: DelayedScheduleProvenance = {
    ...provenance,
    deferredEffectKind: effect.kind,
    deferredEffectPayload: stableJson(effect),
  };
  switch (effect.kind) {
    case "change_project_metric":
      if (timing !== "immediate") {
        return delayedSchedule(
          id,
          delayMs,
          "CONTENT_DELAYED_METRIC",
          delayedProvenance,
        );
      }
      return {
        id,
        type: "project_metric_delta",
        timing: "immediate",
        target: {
          kind: "project_metric",
          metricKey: effect.metricKey,
        },
        payload: {
          metricKey: effect.metricKey,
          delta: effect.delta,
          reasonCode: "CONTENT_METRIC_DELTA",
        },
      };
    case "change_stakeholder_signal":
      if (timing !== "immediate") {
        return delayedSchedule(
          id,
          delayMs,
          "CONTENT_DELAYED_STAKEHOLDER",
          delayedProvenance,
        );
      }
      return {
        id,
        type: "stakeholder_signal",
        timing: "immediate",
        target: {
          kind: "stakeholder_context",
          stakeholderId: effect.stakeholderId,
        },
        payload: {
          signalType: "sentiment_delta",
          stakeholderId: effect.stakeholderId,
          sentimentDelta: effect.delta,
          reasonCode: "CONTENT_STAKEHOLDER_SIGNAL",
        },
      };
    case "emit_competency_signal":
    case "emit_assessment_signal":
      if (timing !== "immediate") {
        return delayedSchedule(
          id,
          delayMs,
          "CONTENT_DELAYED_COMPETENCY",
          delayedProvenance,
        );
      }
      return {
        id,
        type: "learning_signal",
        timing: "immediate",
        target: { kind: "learning_context" },
        payload: {
          signalType: "competency_delta",
          competencyKey: effect.competencyId,
          delta: effect.delta,
          reasonCode: "CONTENT_COMPETENCY_SIGNAL",
        },
      };
    case "make_notification_available":
      if (timing !== "immediate") {
        return delayedSchedule(
          id,
          delayMs,
          "CONTENT_DELAYED_NOTIFICATION",
          delayedProvenance,
        );
      }
      return {
        id,
        type: "deliver_learner_message",
        timing: "immediate",
        target: { kind: "learner_message" },
        payload: {
          messageDefinitionId: asLearnerMessageDefinitionId(
            `notification:${effect.notificationId}`,
          ),
          definitionVersion: "1",
          sender: {
            senderId: "system",
            displayName: "Program Office",
            roleLabel: "System",
          },
          subject: "Program update",
          body: "A new program notification is available in your Workplace.",
        },
      };
    case "schedule_message":
    case "schedule_meeting":
    case "schedule_crisis":
      return delayedSchedule(
        id,
        "afterSimulationDays" in effect
          ? Math.max(1, effect.afterSimulationDays) * 86_400_000
          : delayMs,
        "CONTENT_DELAYED_SCHEDULE",
        delayedProvenance,
      );
    case "transition_project_state":
      if (
        effect.status === "initiated" ||
        effect.status === "planning" ||
        effect.status === "executing" ||
        effect.status === "closing" ||
        effect.status === "closed"
      ) {
        if (timing !== "immediate") {
          return delayedSchedule(
            id,
            delayMs,
            "CONTENT_DELAYED_STATE",
            delayedProvenance,
          );
        }
        return {
          id,
          type: "project_state_transition",
          timing: "immediate",
          target: { kind: "project_state" },
          payload: {
            nextStatus: effect.status,
            reasonCode: "CONTENT_STATE_TRANSITION",
          },
        };
      }
      return null;
    case "make_message_available":
    case "make_meeting_available":
    case "make_document_available":
    case "initialize_activity":
    case "complete_activity":
    case "make_decision_available":
    case "set_case_flag":
    case "unlock_chapter":
    case "record_narrative_flag": {
      // Workplace unlock effects remain chapter-init / Workstream 4 concerns.
      // Preserve a deterministic analytics signal so authored consequences stay non-empty.
      const unlockProvenance: DelayedScheduleProvenance = {
        ...delayedProvenance,
        targetChapterId:
          effect.kind === "unlock_chapter"
            ? effect.chapterId
            : delayedProvenance.targetChapterId,
      };
      if (timing !== "immediate") {
        return delayedSchedule(
          id,
          delayMs,
          "CONTENT_DELAYED_UNLOCK",
          unlockProvenance,
        );
      }
      return {
        id,
        type: "analytics_signal",
        timing: "immediate",
        target: { kind: "analytics_context" },
        payload: {
          signalType: "content_unlock_intent",
          dimension: effect.kind,
          value: 1,
          reasonCode: "CONTENT_UNLOCK_SIGNAL",
        },
      };
    }
    default:
      return null;
  }
};

const mapContentConsequence = (
  content: ContentConsequenceDefinition,
  provenance: DelayedScheduleProvenance,
): ConsequenceDefinition[] => {
  const timing =
    content.timing.kind === "delayed"
      ? ("delayed" as const)
      : ("immediate" as const);
  const delayMs =
    content.timing.kind === "delayed"
      ? Math.max(1, content.timing.afterSimulationDays) * 86_400_000
      : 3_600_000;
  const fromEffects = content.effects
    .map((effect, index) =>
      mapEffectToConsequence(
        effect,
        content.id,
        index,
        timing,
        delayMs,
        provenance,
      ),
    )
    .filter((entry): entry is ConsequenceDefinition => entry !== null);

  const extras: ConsequenceDefinition[] = [];
  if (
    timing === "delayed" &&
    fromEffects.every((c) => c.timing === "immediate")
  ) {
    extras.push(
      delayedSchedule(
        asConsequenceDefinitionId(`${content.id}:delayed`),
        delayMs,
        "CONTENT_DELAYED_CONSEQUENCE",
        provenance,
      ),
    );
  }
  if (fromEffects.length + extras.length === 0) {
    extras.push({
      id: asConsequenceDefinitionId(`${content.id}:analytics`),
      type: "analytics_signal",
      timing: "immediate",
      target: { kind: "analytics_context" },
      payload: {
        signalType: "decision_resolved",
        dimension: "content_consequence",
        value: 1,
        reasonCode: "CONTENT_CONSEQUENCE_APPLIED",
      },
    });
  }
  return [...fromEffects, ...extras];
};

export const mapContentDecisionToRuntimeDefinition = (input: {
  readonly decision: ContentDecisionDefinition;
  readonly consequencesById: ReadonlyMap<string, ContentConsequenceDefinition>;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly prerequisiteDecisionIds?: readonly DecisionId[];
  readonly requiredEvidenceDocumentIds?: readonly DocumentId[];
  readonly requiredEvidenceMeetingIds?: readonly MeetingDefinitionId[];
  readonly requiredEvidenceMessageIds?: readonly string[];
  readonly requiredEvidenceActivityIds?: readonly ActivityId[];
  readonly chapterId?: ChapterId | null;
  readonly eligibilityCondition?: ConditionExpression | null;
}): DecisionDefinition => {
  const { decision, consequencesById, contentPackageVersionId } = input;
  const provenanceBase: DelayedScheduleProvenance = {
    sourceDecisionId: decision.id,
    sourceChapterId: decision.chapterId,
    targetChapterId: null,
    deferredEffectKind: null,
    deferredEffectPayload: null,
  };
  const options = decision.options.map((option) => {
    const consequenceIds = decision.consequenceIdsByOption[option.id] ?? [];
    const consequenceDefinitions = consequenceIds.flatMap((cid) => {
      const authored = consequencesById.get(cid);
      if (!authored) {
        return [];
      }
      return mapContentConsequence(authored, provenanceBase);
    });
    const outcome: DecisionOutcomeDefinition = {
      id: asDecisionOutcomeDefinitionId(`outcome:${decision.id}:${option.id}`),
      resolverVersion: SUPPORTED_RESOLVER_VERSION,
      qualityClassification: null,
      explanationReference: null,
      consequenceDefinitions:
        consequenceDefinitions.length > 0
          ? consequenceDefinitions
          : [
              {
                id: asConsequenceDefinitionId(
                  `outcome:${decision.id}:${option.id}:default`,
                ),
                type: "analytics_signal",
                timing: "immediate",
                target: { kind: "analytics_context" },
                payload: {
                  signalType: "decision_resolved",
                  dimension: "decision_count",
                  value: 1,
                  reasonCode: "CONTENT_DECISION_RESOLVED",
                },
              },
              {
                id: asConsequenceDefinitionId(
                  `outcome:${decision.id}:${option.id}:metric`,
                ),
                type: "project_metric_delta",
                timing: "immediate",
                target: {
                  kind: "project_metric",
                  metricKey: asMetricKey("schedule_pressure"),
                },
                payload: {
                  metricKey: asMetricKey("schedule_pressure"),
                  delta: 0,
                  reasonCode: "CONTENT_NEUTRAL_METRIC",
                },
              },
            ],
    };
    return {
      id: option.id,
      decisionDefinitionId: decision.id,
      outcome,
    };
  });

  return {
    id: decision.id,
    contentPackageVersionId,
    options,
    availability: "available",
    prerequisiteDecisionIds: input.prerequisiteDecisionIds ?? [],
    requiredEvidenceDocumentIds: input.requiredEvidenceDocumentIds ?? [],
    requiredEvidenceMeetingIds: input.requiredEvidenceMeetingIds ?? [],
    requiredEvidenceMessageIds: input.requiredEvidenceMessageIds ?? [],
    requiredEvidenceActivityIds: input.requiredEvidenceActivityIds ?? [],
    chapterId: input.chapterId ?? decision.chapterId,
    eligibilityCondition:
      input.eligibilityCondition === undefined
        ? decision.availableWhen
        : input.eligibilityCondition,
    expiresAt: null,
  };
};

const prerequisitesForDecision = (
  decision: ContentDecisionDefinition,
  all: readonly ContentDecisionDefinition[],
): DecisionId[] => {
  // Encode chapter ordering: earlier required decisions in the same chapter are prerequisites.
  const sameChapter = all
    .filter((d) => d.chapterId === decision.chapterId && d.required)
    .map((d) => d.id);
  const index = sameChapter.indexOf(decision.id);
  if (index <= 0) {
    return [];
  }
  return sameChapter.slice(0, index);
};

const evidenceDocumentsForDecision = (
  decision: ContentDecisionDefinition,
  pkg: BusinessCaseContentPackage,
): DocumentId[] => {
  const required = decision.requiredEvidence.filter(
    (evidence) =>
      evidence.requiredForEligibility &&
      evidence.sourceTypes.includes("document"),
  );
  if (required.length === 0) {
    return [];
  }
  const ids = new Set<string>();
  for (const evidence of required) {
    for (const document of pkg.documents) {
      if (document.evidenceTags.includes(evidence.evidenceTag)) {
        ids.add(document.id);
      }
    }
  }
  return [...ids]
    .sort((a, b) => a.localeCompare(b))
    .map((id) => asDocumentId(id));
};

const evidenceMeetingsForDecision = (
  decision: ContentDecisionDefinition,
  pkg: BusinessCaseContentPackage,
): MeetingDefinitionId[] => {
  const required = decision.requiredEvidence.filter(
    (evidence) =>
      evidence.requiredForEligibility &&
      evidence.sourceTypes.includes("meeting"),
  );
  if (required.length === 0) {
    return [];
  }
  const ids = new Set<string>();
  for (const evidence of required) {
    for (const meeting of pkg.meetings) {
      if (String(meeting.id) === String(evidence.evidenceTag)) {
        ids.add(meeting.id);
      }
    }
  }
  return [...ids]
    .sort((a, b) => a.localeCompare(b))
    .map((id) => id as MeetingDefinitionId);
};

const evidenceMessagesForDecision = (
  decision: ContentDecisionDefinition,
  pkg: BusinessCaseContentPackage,
): string[] => {
  const required = decision.requiredEvidence.filter(
    (evidence) =>
      evidence.requiredForEligibility &&
      evidence.sourceTypes.includes("message"),
  );
  if (required.length === 0) {
    return [];
  }
  const ids = new Set<string>();
  for (const evidence of required) {
    for (const message of pkg.messages) {
      if (String(message.id) === String(evidence.evidenceTag)) {
        ids.add(message.id);
      }
    }
  }
  return [...ids].sort((a, b) => a.localeCompare(b));
};

export const mapBusinessCasePackageToRuntimeDecisions = (
  pkg: BusinessCaseContentPackage,
  contentPackageVersionId: ContentPackageVersionId,
): readonly DecisionDefinition[] => {
  const consequencesById = new Map(
    pkg.consequences.map((c) => [c.id, c] as const),
  );
  return pkg.decisions.map((decision) =>
    mapContentDecisionToRuntimeDefinition({
      decision,
      consequencesById,
      contentPackageVersionId,
      prerequisiteDecisionIds: prerequisitesForDecision(
        decision,
        pkg.decisions,
      ),
      requiredEvidenceDocumentIds: evidenceDocumentsForDecision(decision, pkg),
      requiredEvidenceMeetingIds: evidenceMeetingsForDecision(decision, pkg),
      requiredEvidenceMessageIds: evidenceMessagesForDecision(decision, pkg),
      requiredEvidenceActivityIds: [],
      chapterId: decision.chapterId,
      eligibilityCondition: decision.availableWhen,
    }),
  );
};

export const mapBusinessCasePackageToProjectionSafeContent = (
  pkg: BusinessCaseContentPackage,
  contentPackageVersionId: ContentPackageVersionId,
  experienceLevel: ExperienceLevel = "practitioner",
): ProjectionSafeContent => {
  const locale = pkg.manifest.defaultLocale;
  const decisions: ProjectionSafeDecisionDefinition[] = pkg.decisions.map(
    (decision, index) => {
      const promptVariant = resolveExperienceVariant(
        decision.prompt,
        experienceLevel,
      );
      const prompt =
        resolveLocalizedText(promptVariant, locale, locale) ??
        resolveLocalizedText(decision.title, locale, locale) ??
        decision.id;
      const title =
        resolveLocalizedText(decision.title, locale, locale) ?? decision.id;
      const description = resolveLocalizedText(
        decision.situation,
        locale,
        locale,
      );
      const optionLabels: Record<string, string> = {};
      const publicResultSummaryByOptionId: Record<string, string | null> = {};
      for (const [oi, option] of decision.options.entries()) {
        optionLabels[option.id] =
          resolveLocalizedText(option.label, locale, locale) ?? option.id;
        const feedback = pkg.consequences.find((c) =>
          (decision.consequenceIdsByOption[option.id] ?? []).includes(c.id),
        );
        publicResultSummaryByOptionId[option.id] = feedback
          ? resolveLocalizedText(
              resolveExperienceVariant(
                feedback.learnerFeedback,
                experienceLevel,
              ),
              locale,
              locale,
            )
          : `You selected ${optionLabels[option.id]}.`;
        void oi;
      }
      return {
        id: decision.id,
        contentPackageVersionId,
        authoredOrder: index,
        title,
        prompt,
        description,
        availability: "available",
        expiresAt: null,
        options: decision.options.map((option, oi) => ({
          id: option.id,
          authoredOrder: oi,
          label: optionLabels[option.id] ?? option.id,
        })),
        publicResultSummaryByOptionId,
      };
    },
  );

  const messages = pkg.messages.map((message) => ({
    id: message.id,
    classification: classifyInboxMessage(message),
    relatedDecisionId: message.relatedDecisionId,
    relatedMeetingId: message.relatedMeetingId,
    relatedDocumentIds: [...message.relatedDocumentIds],
    chapterId: message.chapterId,
  }));

  const requiredMeetingIdsByChapter = new Map<string, string[]>();
  for (const meeting of pkg.meetings) {
    if (!meeting.required) {
      continue;
    }
    const list = requiredMeetingIdsByChapter.get(meeting.chapterId) ?? [];
    list.push(meeting.id);
    requiredMeetingIdsByChapter.set(meeting.chapterId, list);
  }

  const chapters = [...pkg.chapters]
    .sort((a, b) =>
      a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id),
    )
    .map((chapter) => ({
      id: chapter.id,
      order: chapter.order,
      title: resolveLocalizedText(chapter.title, locale, locale) ?? chapter.id,
      requiredDecisionIds: [...chapter.requiredDecisionIds],
      requiredActivityIds: [...chapter.requiredActivityIds],
      requiredMeetingIds: [
        ...(requiredMeetingIdsByChapter.get(chapter.id) ?? []),
      ].sort((a, b) => a.localeCompare(b)),
    }));

  const meetings = pkg.meetings.map((meeting) => ({
    id: meeting.id,
    chapterId: meeting.chapterId,
    required: meeting.required,
    relatedDecisionIds: [...meeting.relatedDecisionIds],
    relatedDocumentIds: [...meeting.relatedDocumentIds],
  }));

  const documents = pkg.documents.map((document) => ({
    id: document.id,
    chapterId: document.chapterId,
    evidenceTags: [...document.evidenceTags],
    supportsDecisionIds: [...document.supportsDecisionIds],
  }));

  const activities = pkg.activities.map((activity) => ({
    id: activity.id,
    chapterId: activity.chapterId,
    required: activity.required,
    relatedDecisionIds: [...activity.relatedDecisionIds],
    relatedDocumentIds: [...activity.relatedDocumentIds],
  }));

  return {
    contentPackageVersionId,
    decisions,
    messages,
    chapters,
    meetings,
    documents,
    activities,
  };
};
