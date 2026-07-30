/**
 * BC-006 shared assembler for Northstar chapters 2–6.
 */

import type {
  ActivityDefinition,
  ChapterDefinition,
  ContentConsequenceDefinition,
  ContentDecisionDefinition,
  CrisisDefinition,
  DocumentDefinition,
  MeetingDefinition,
  MessageDefinition,
  NotificationDefinition,
} from "../entities";
import { localizedText } from "../localized";
import {
  buildActivity,
  buildChapter,
  buildCrisis,
  buildDecision,
  buildDocument,
  buildMeeting,
  buildMessage,
  buildNotification,
  chapterIdForOrder,
  northstarDecisionId,
  type CatalogMessageClass,
} from "./northstar-builders";

export interface NorthstarChapterEntities {
  readonly chapter: ChapterDefinition;
  readonly messages: MessageDefinition[];
  readonly meetings: MeetingDefinition[];
  readonly documents: DocumentDefinition[];
  readonly notifications: NotificationDefinition[];
  readonly activities: ActivityDefinition[];
  readonly decisions: ContentDecisionDefinition[];
  readonly consequences: ContentConsequenceDefinition[];
  readonly crises: CrisisDefinition[];
}

export interface CatalogDocument {
  readonly id: string;
  readonly documentType: string;
  readonly title: string;
  readonly summary: string;
  readonly supportsDecisionIds?: readonly string[];
}

export interface CatalogMessage {
  readonly id: string;
  readonly senderStakeholderId: string;
  readonly subject: string;
  readonly body: string;
  readonly catalogClass: CatalogMessageClass;
  readonly relatedDecisionId?: string;
  readonly relatedMeetingId?: string;
  readonly relatedDocumentIds?: readonly string[];
}

export interface CatalogMeeting {
  readonly id: string;
  readonly title: string;
  readonly purpose: string;
  readonly participantStakeholderIds: readonly string[];
  readonly agendaTitles: readonly string[];
  readonly relatedDecisionIds?: readonly string[];
  readonly relatedDocumentIds?: readonly string[];
  readonly estimatedMinutes?: number;
}

export interface CatalogActivity {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly activityType: ActivityDefinition["activityType"];
  readonly relatedDocumentIds?: readonly string[];
  readonly relatedDecisionIds?: readonly string[];
}

export interface CatalogDecision {
  readonly shortName: string;
  readonly name: string;
  readonly title: string;
  readonly situation: string;
  readonly prompt: string;
  readonly options: readonly {
    readonly label: string;
    readonly description: string;
  }[];
  readonly evidenceDocumentIds?: readonly string[];
  readonly stakeholderIdsForEffects?: readonly string[];
}

export interface ChapterCatalog {
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly learningObjectives: readonly {
    readonly id: string;
    readonly theme: string;
  }[];
  readonly priorChapterId: string;
  readonly notification: {
    readonly id: string;
    readonly title: string;
    readonly summary: string;
    readonly body: string;
  };
  readonly documents: readonly CatalogDocument[];
  readonly messages: readonly CatalogMessage[];
  readonly meetings: readonly CatalogMeeting[];
  readonly activities: readonly CatalogActivity[];
  readonly decisions: readonly CatalogDecision[];
  readonly crises?: readonly {
    readonly id: string;
    readonly title: string;
    readonly relatedDecisionIds: readonly string[];
    readonly relatedStakeholderIds: readonly string[];
    readonly resolutionDecisionId: string;
  }[];
  readonly learnerGuidance: {
    readonly default: string;
    readonly explorer?: string;
    readonly practitioner?: string;
    readonly leader?: string;
  };
}

const evidenceTagFromDocId = (docId: string): string => {
  const slug = docId.startsWith("document.") ? docId.slice(9) : docId;
  return `evidence.${slug}`;
};

export const assembleNorthstarChapter = (
  catalog: ChapterCatalog,
): NorthstarChapterEntities => {
  const chapterId = chapterIdForOrder(catalog.order);
  const chapterNum = String(catalog.order).padStart(2, "0");
  const loIds = catalog.learningObjectives.map((lo) => lo.id);

  const documents = catalog.documents.map((d) =>
    buildDocument({
      id: d.id,
      chapterId,
      documentType: d.documentType,
      title: d.title,
      summary: d.summary,
      ...(d.supportsDecisionIds
        ? { supportsDecisionIds: d.supportsDecisionIds }
        : {}),
    }),
  );

  const decisionIds = catalog.decisions.map((d) =>
    northstarDecisionId(catalog.order, d.name),
  );

  const messages = catalog.messages.map((m) =>
    buildMessage({
      id: m.id,
      chapterId,
      senderStakeholderId: m.senderStakeholderId,
      subject: m.subject,
      body: m.body,
      catalogClass: m.catalogClass,
      ...(m.relatedDecisionId
        ? { relatedDecisionId: m.relatedDecisionId }
        : {}),
      ...(m.relatedMeetingId ? { relatedMeetingId: m.relatedMeetingId } : {}),
      ...(m.relatedDocumentIds
        ? { relatedDocumentIds: m.relatedDocumentIds }
        : {}),
    }),
  );

  const meetings = catalog.meetings.map((m) =>
    buildMeeting({
      id: m.id,
      chapterId,
      title: m.title,
      purpose: m.purpose,
      participantStakeholderIds: m.participantStakeholderIds,
      agendaTitles: m.agendaTitles,
      ...(m.relatedDecisionIds
        ? { relatedDecisionIds: m.relatedDecisionIds }
        : {}),
      ...(m.relatedDocumentIds
        ? { relatedDocumentIds: m.relatedDocumentIds }
        : {}),
      ...(m.estimatedMinutes ? { estimatedMinutes: m.estimatedMinutes } : {}),
    }),
  );

  const activities = catalog.activities.map((a) =>
    buildActivity({
      id: a.id,
      chapterId,
      title: a.title,
      instructions: a.instructions,
      activityType: a.activityType,
      ...(a.relatedDocumentIds
        ? { relatedDocumentIds: a.relatedDocumentIds }
        : {}),
      ...(a.relatedDecisionIds
        ? { relatedDecisionIds: a.relatedDecisionIds }
        : {}),
      learningObjectiveIds: loIds.slice(0, 2),
    }),
  );

  const activityIds = catalog.activities.map((a) => a.id);

  const decisions: ContentDecisionDefinition[] = [];
  const consequences: ContentConsequenceDefinition[] = [];
  const evidenceDocsByDecision = new Map<string, readonly string[]>();

  catalog.decisions.forEach((d, index) => {
    const evidenceDocs =
      d.evidenceDocumentIds ??
      catalog.documents
        .slice(0, Math.min(3, catalog.documents.length))
        .map((doc) => doc.id);
    const decisionId = northstarDecisionId(catalog.order, d.name);
    evidenceDocsByDecision.set(decisionId, evidenceDocs);
    const bundle = buildDecision({
      id: decisionId,
      chapterId,
      chapterNum,
      shortName: d.shortName,
      title: d.title,
      situation: d.situation,
      prompt: d.prompt,
      options: d.options,
      evidenceTags: evidenceDocs.map(evidenceTagFromDocId),
      learningObjectiveIds: loIds.slice(
        index % loIds.length,
        (index % loIds.length) + 1,
      ),
      ...(d.stakeholderIdsForEffects
        ? { stakeholderIdsForEffects: d.stakeholderIdsForEffects }
        : {}),
    });
    decisions.push(bundle.decision);
    consequences.push(...bundle.consequences);
  });

  const documentsWithSupport = documents.map((document) => {
    const supported = new Set(document.supportsDecisionIds);
    for (const [decisionId, evidenceDocs] of evidenceDocsByDecision) {
      if (evidenceDocs.includes(document.id)) {
        supported.add(decisionId as never);
      }
    }
    return {
      ...document,
      supportsDecisionIds: [...supported],
    };
  });

  const notification = buildNotification({
    id: catalog.notification.id,
    chapterId,
    title: catalog.notification.title,
    summary: catalog.notification.summary,
    body: catalog.notification.body,
  });

  const chapter = buildChapter({
    id: `chapter-0${catalog.order}`,
    order: catalog.order,
    title: catalog.title,
    summary: catalog.summary,
    learningObjectiveIds: loIds,
    priorChapterId: catalog.priorChapterId,
    requiredActivityIds: activityIds,
    requiredDecisionIds: decisionIds,
    learnerGuidance: {
      default: localizedText(catalog.learnerGuidance.default),
      ...(catalog.learnerGuidance.explorer
        ? {
            explorer: localizedText(catalog.learnerGuidance.explorer),
          }
        : {}),
      ...(catalog.learnerGuidance.practitioner
        ? {
            practitioner: localizedText(catalog.learnerGuidance.practitioner),
          }
        : {}),
      ...(catalog.learnerGuidance.leader
        ? { leader: localizedText(catalog.learnerGuidance.leader) }
        : {}),
    },
  });

  const crises = (catalog.crises ?? []).map((c) =>
    buildCrisis({
      id: c.id,
      chapterId,
      title: c.title,
      relatedDecisionIds: c.relatedDecisionIds,
      relatedStakeholderIds: c.relatedStakeholderIds,
      resolutionDecisionId: c.resolutionDecisionId,
    }),
  );

  return {
    chapter,
    messages,
    meetings,
    documents: documentsWithSupport,
    notifications: [notification],
    activities,
    decisions,
    consequences,
    crises,
  };
};

/** Standard participant sets for meetings. */
export const NS = {
  learner: [] as const,
  corePlanning: [
    "stakeholder.program-director",
    "stakeholder.pmo",
    "stakeholder.clinical",
    "stakeholder.operations",
    "stakeholder.technology",
    "stakeholder.privacy",
    "stakeholder.finance",
    "stakeholder.vendor",
    "stakeholder.analyst",
  ] as const,
  steering: [
    "stakeholder.sponsor",
    "stakeholder.program-director",
    "stakeholder.steering-secretariat",
    "stakeholder.clinical",
    "stakeholder.finance",
    "stakeholder.operations",
  ] as const,
  recovery: [
    "stakeholder.sponsor",
    "stakeholder.program-director",
    "stakeholder.delivery-lead",
    "stakeholder.vendor",
    "stakeholder.finance",
    "stakeholder.quality",
  ] as const,
  readiness: [
    "stakeholder.operations",
    "stakeholder.clinical",
    "stakeholder.technology",
    "stakeholder.change-lead",
    "stakeholder.support-lead",
    "stakeholder.quality",
  ] as const,
  deployment: [
    "stakeholder.incident-lead",
    "stakeholder.operations",
    "stakeholder.technology",
    "stakeholder.support-lead",
    "stakeholder.vendor",
  ] as const,
  closure: [
    "stakeholder.sponsor",
    "stakeholder.benefits-owner",
    "stakeholder.finance",
    "stakeholder.procurement",
    "stakeholder.pmo",
  ] as const,
};
