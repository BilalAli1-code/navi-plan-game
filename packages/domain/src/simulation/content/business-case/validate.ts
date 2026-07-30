/**
 * Pure 8-layer business-case content validation (BC-003).
 *
 * Does not execute authored code, SQL, or eval.
 */

import type {
  BusinessCaseId,
  ContentPackageVersionId,
} from "../../../shared-kernel/ids";
import type { ConditionExpression } from "./conditions";
import type { ConsequenceEffect } from "./effects";
import type { BusinessCaseContentPackage } from "./package";
import {
  BUSINESS_CASE_CONTENT_SCHEMA_VERSION,
  CURRENT_RUNTIME_COMPATIBILITY,
} from "./enums";
import {
  isValidBusinessCaseId,
  isValidContentVersion,
  isValidLocalEntityId,
} from "./ids";
import { computeBusinessCasePackageChecksum } from "./checksum";
import { resolveLocalizedText } from "./localized";
import {
  CONTENT_VALIDATOR_VERSION,
  issue,
  type ContentValidationIssue,
  type ContentValidationResult,
} from "./validation-result";

interface PackageIndexes {
  readonly chapters: Set<string>;
  readonly stakeholders: Set<string>;
  readonly messages: Set<string>;
  readonly meetings: Set<string>;
  readonly documents: Set<string>;
  readonly notifications: Set<string>;
  readonly activities: Set<string>;
  readonly decisions: Set<string>;
  readonly options: Set<string>;
  readonly consequences: Set<string>;
  readonly crises: Set<string>;
  readonly achievements: Set<string>;
  readonly outcomes: Set<string>;
  readonly assets: Set<string>;
  readonly competencies: Set<string>;
  readonly evidenceTags: Set<string>;
}

function buildIndexes(pkg: BusinessCaseContentPackage): PackageIndexes {
  const options = new Set<string>();
  for (const d of pkg.decisions) {
    for (const o of d.options) options.add(o.id);
  }
  const evidenceTags = new Set<string>();
  for (const doc of pkg.documents) {
    for (const tag of doc.evidenceTags) evidenceTags.add(tag);
  }
  return {
    chapters: new Set(pkg.chapters.map((c) => c.id)),
    stakeholders: new Set(pkg.stakeholders.map((s) => s.id)),
    messages: new Set(pkg.messages.map((m) => m.id)),
    meetings: new Set(pkg.meetings.map((m) => m.id)),
    documents: new Set(pkg.documents.map((d) => d.id)),
    notifications: new Set(pkg.notifications.map((n) => n.id)),
    activities: new Set(pkg.activities.map((a) => a.id)),
    decisions: new Set(pkg.decisions.map((d) => d.id)),
    options,
    consequences: new Set(pkg.consequences.map((c) => c.id)),
    crises: new Set(pkg.crises.map((c) => c.id)),
    achievements: new Set(pkg.achievements.map((a) => a.id)),
    outcomes: new Set(pkg.outcomes.map((o) => o.id)),
    assets: new Set(pkg.assets.map((a) => a.id)),
    competencies: new Set(pkg.assessment.competencies.map((c) => c.id)),
    evidenceTags,
  };
}

function errIssue(
  code: string,
  message: string,
  path: string,
  entityType: string | null,
  entityId: string | null,
  fieldPath: string | null,
  relatedEntityId?: string,
  suggestedResolution?: string,
): ContentValidationIssue {
  return issue({
    code,
    severity: "error",
    message,
    path,
    entityType,
    entityId,
    fieldPath,
    ...(relatedEntityId !== undefined ? { relatedEntityId } : {}),
    ...(suggestedResolution !== undefined ? { suggestedResolution } : {}),
  });
}

function warnIssue(
  code: string,
  message: string,
  path: string,
  entityType: string | null,
  entityId: string | null,
  fieldPath: string | null,
): ContentValidationIssue {
  return issue({
    code,
    severity: "warning",
    message,
    path,
    entityType,
    entityId,
    fieldPath,
  });
}

function requireLocalized(
  text:
    { readonly values: Readonly<Record<string, string>> } | null | undefined,
  defaultLocale: string,
  path: string,
  entityType: string,
  entityId: string,
  fieldPath: string,
  issues: ContentValidationIssue[],
): void {
  if (!text) {
    issues.push(
      errIssue(
        "REQUIRED_FIELD",
        `${fieldPath} is required`,
        path,
        entityType,
        entityId,
        fieldPath,
      ),
    );
    return;
  }
  const resolved = resolveLocalizedText(text, defaultLocale, defaultLocale);
  if (resolved === null) {
    issues.push(
      errIssue(
        "MISSING_LOCALIZED_TEXT",
        `${fieldPath} missing text for default locale ${defaultLocale}`,
        path,
        entityType,
        entityId,
        fieldPath,
        undefined,
        `Provide values["${defaultLocale}"].`,
      ),
    );
  }
}

function collectConditionRefs(
  condition: ConditionExpression,
  refs: {
    chapters: Set<string>;
    activities: Set<string>;
    decisions: Set<string>;
    options: Set<string>;
    meetings: Set<string>;
    documents: Set<string>;
    messages: Set<string>;
  },
): void {
  switch (condition.kind) {
    case "always":
      return;
    case "all":
    case "any":
      for (const c of condition.conditions) collectConditionRefs(c, refs);
      return;
    case "not":
      collectConditionRefs(condition.condition, refs);
      return;
    case "chapter_status":
      refs.chapters.add(condition.chapterId);
      return;
    case "activity_status":
      refs.activities.add(condition.activityId);
      return;
    case "decision_status":
      refs.decisions.add(condition.decisionId);
      return;
    case "decision_option_selected":
      refs.decisions.add(condition.decisionId);
      refs.options.add(condition.optionId);
      return;
    case "meeting_status":
      refs.meetings.add(condition.meetingId);
      return;
    case "document_available":
      refs.documents.add(condition.documentId);
      return;
    case "message_delivered":
      refs.messages.add(condition.messageId);
      return;
    case "metric_compare":
    case "narrative_flag":
    case "experience_level":
      return;
    default: {
      const _exhaustive: never = condition;
      void _exhaustive;
    }
  }
}

function validateEffectTargets(
  effect: ConsequenceEffect,
  indexes: PackageIndexes,
  entityId: string,
  path: string,
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const missing = (field: string, targetId: string, present: boolean): void => {
    if (!present) {
      issues.push(
        errIssue(
          "EFFECT_TARGET_MISSING",
          `Effect target ${targetId} not found`,
          `${path}.${field}`,
          "consequence",
          entityId,
          field,
          targetId,
          "Reference an entity that exists in this case version.",
        ),
      );
    }
  };

  switch (effect.kind) {
    case "change_project_metric":
    case "emit_assessment_signal":
    case "emit_competency_signal":
    case "set_case_flag":
    case "transition_project_state":
    case "record_narrative_flag":
      return issues;
    case "change_stakeholder_signal":
      missing(
        "stakeholderId",
        effect.stakeholderId,
        indexes.stakeholders.has(effect.stakeholderId),
      );
      return issues;
    case "make_message_available":
    case "schedule_message":
      missing(
        "messageId",
        effect.messageId,
        indexes.messages.has(effect.messageId),
      );
      return issues;
    case "make_meeting_available":
    case "schedule_meeting":
      missing(
        "meetingId",
        effect.meetingId,
        indexes.meetings.has(effect.meetingId),
      );
      return issues;
    case "make_document_available":
      missing(
        "documentId",
        effect.documentId,
        indexes.documents.has(effect.documentId),
      );
      return issues;
    case "make_notification_available":
      missing(
        "notificationId",
        effect.notificationId,
        indexes.notifications.has(effect.notificationId),
      );
      return issues;
    case "initialize_activity":
    case "complete_activity":
      missing(
        "activityId",
        effect.activityId,
        indexes.activities.has(effect.activityId),
      );
      return issues;
    case "make_decision_available":
      missing(
        "decisionId",
        effect.decisionId,
        indexes.decisions.has(effect.decisionId),
      );
      return issues;
    case "unlock_chapter":
      missing(
        "chapterId",
        effect.chapterId,
        indexes.chapters.has(effect.chapterId),
      );
      return issues;
    case "schedule_crisis":
      missing("crisisId", effect.crisisId, indexes.crises.has(effect.crisisId));
      return issues;
    default: {
      const _exhaustive: never = effect;
      void _exhaustive;
      return issues;
    }
  }
}

function assertUniqueLocalIds(
  items: ReadonlyArray<{ id: string; type: string; path: string }>,
  issues: ContentValidationIssue[],
): void {
  const seen = new Map<string, string>();
  for (const item of items) {
    if (!isValidLocalEntityId(item.id)) {
      issues.push(
        errIssue(
          "INVALID_ID_FORMAT",
          `Invalid ${item.type} id format: ${item.id}`,
          item.path,
          item.type,
          item.id,
          "id",
        ),
      );
    }
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) {
      issues.push(
        errIssue(
          "DUPLICATE_LOCAL_ID",
          `Duplicate ${item.type} id ${item.id} within this content version`,
          item.path,
          item.type,
          item.id,
          "id",
          undefined,
          "Local IDs must be unique within one business-case version.",
        ),
      );
    }
    seen.set(key, item.id);
  }
}

function hasCycle(graph: Map<string, ReadonlyArray<string>>): boolean {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const dfs = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      if (dfs(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  for (const node of graph.keys()) {
    if (dfs(node)) return true;
  }
  return false;
}

function chapterUnlockDeps(
  pkg: BusinessCaseContentPackage,
): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  for (const chapter of pkg.chapters) {
    const deps: string[] = [];
    if (chapter.unlockWhen !== null) {
      const refs = {
        chapters: new Set<string>(),
        activities: new Set<string>(),
        decisions: new Set<string>(),
        options: new Set<string>(),
        meetings: new Set<string>(),
        documents: new Set<string>(),
        messages: new Set<string>(),
      };
      collectConditionRefs(chapter.unlockWhen, refs);
      deps.push(...refs.chapters);
    }
    graph.set(chapter.id, deps);
  }
  return graph;
}

export interface ValidateBusinessCasePackageOptions {
  readonly validationRunId?: string;
  readonly contentPackageVersionId?: ContentPackageVersionId | null;
  readonly nowIso?: string;
}

/**
 * Validate a declarative business-case content package.
 */
export function validateBusinessCasePackage(
  pkg: BusinessCaseContentPackage,
  options: ValidateBusinessCasePackageOptions = {},
): ContentValidationResult {
  const startedAt = options.nowIso ?? new Date(0).toISOString();
  const issues: ContentValidationIssue[] = [];
  const { manifest } = pkg;
  const defaultLocale = manifest.defaultLocale;

  // Layer 1 — Structural
  if (!isValidBusinessCaseId(manifest.businessCaseId)) {
    issues.push(
      errIssue(
        "INVALID_BUSINESS_CASE_ID",
        `Invalid business_case_id: ${manifest.businessCaseId}`,
        "manifest.businessCaseId",
        "manifest",
        "manifest",
        "businessCaseId",
      ),
    );
  }
  requireLocalized(
    manifest.title,
    defaultLocale,
    "manifest.title",
    "manifest",
    "manifest",
    "title",
    issues,
  );
  requireLocalized(
    manifest.summary,
    defaultLocale,
    "manifest.summary",
    "manifest",
    "manifest",
    "summary",
    issues,
  );
  requireLocalized(
    manifest.shortTitle,
    defaultLocale,
    "manifest.shortTitle",
    "manifest",
    "manifest",
    "shortTitle",
    issues,
  );
  if (
    !Array.isArray(manifest.supportedExperienceLevels) ||
    manifest.supportedExperienceLevels.length === 0
  ) {
    issues.push(
      errIssue(
        "REQUIRED_FIELD",
        "supportedExperienceLevels must be a non-empty array",
        "manifest.supportedExperienceLevels",
        "manifest",
        "manifest",
        "supportedExperienceLevels",
      ),
    );
  }
  if (
    pkg.schemaVersion !== BUSINESS_CASE_CONTENT_SCHEMA_VERSION ||
    manifest.schemaVersion !== BUSINESS_CASE_CONTENT_SCHEMA_VERSION
  ) {
    issues.push(
      errIssue(
        "SCHEMA_INCOMPATIBLE",
        `schemaVersion is not supported (expected ${BUSINESS_CASE_CONTENT_SCHEMA_VERSION})`,
        "manifest.schemaVersion",
        "manifest",
        "manifest",
        "schemaVersion",
      ),
    );
  }
  if (pkg.chapters.length === 0) {
    issues.push(
      errIssue(
        "REQUIRED_FIELD",
        "At least one chapter is required",
        "chapters",
        "package",
        "package",
        "chapters",
      ),
    );
  }
  if (pkg.stakeholders.length === 0) {
    issues.push(
      errIssue(
        "REQUIRED_FIELD",
        "At least one stakeholder is required",
        "stakeholders",
        "package",
        "package",
        "stakeholders",
      ),
    );
  }
  if (manifest.chapterCount !== pkg.chapters.length) {
    issues.push(
      errIssue(
        "CHAPTER_COUNT_MISMATCH",
        `manifest.chapterCount ${manifest.chapterCount} does not match chapters.length ${pkg.chapters.length}`,
        "manifest.chapterCount",
        "manifest",
        "manifest",
        "chapterCount",
      ),
    );
  }

  // Layer 2 — Identifiers
  if (!isValidContentVersion(manifest.contentVersion)) {
    issues.push(
      errIssue(
        "INVALID_SEMVER",
        `content_version must be valid semver: ${manifest.contentVersion}`,
        "manifest.contentVersion",
        "manifest",
        "manifest",
        "contentVersion",
      ),
    );
  }

  const idItems: Array<{ id: string; type: string; path: string }> = [
    ...pkg.chapters.map((c, i) => ({
      id: c.id,
      type: "chapter",
      path: `chapters[${i}].id`,
    })),
    ...pkg.stakeholders.map((s, i) => ({
      id: s.id,
      type: "stakeholder",
      path: `stakeholders[${i}].id`,
    })),
    ...pkg.messages.map((m, i) => ({
      id: m.id,
      type: "message",
      path: `messages[${i}].id`,
    })),
    ...pkg.meetings.map((m, i) => ({
      id: m.id,
      type: "meeting",
      path: `meetings[${i}].id`,
    })),
    ...pkg.documents.map((d, i) => ({
      id: d.id,
      type: "document",
      path: `documents[${i}].id`,
    })),
    ...pkg.notifications.map((n, i) => ({
      id: n.id,
      type: "notification",
      path: `notifications[${i}].id`,
    })),
    ...pkg.activities.map((a, i) => ({
      id: a.id,
      type: "activity",
      path: `activities[${i}].id`,
    })),
    ...pkg.decisions.map((d, i) => ({
      id: d.id,
      type: "decision",
      path: `decisions[${i}].id`,
    })),
    ...pkg.consequences.map((c, i) => ({
      id: c.id,
      type: "consequence",
      path: `consequences[${i}].id`,
    })),
    ...pkg.crises.map((c, i) => ({
      id: c.id,
      type: "crisis",
      path: `crises[${i}].id`,
    })),
    ...pkg.achievements.map((a, i) => ({
      id: a.id,
      type: "achievement",
      path: `achievements[${i}].id`,
    })),
    ...pkg.outcomes.map((o, i) => ({
      id: o.id,
      type: "outcome",
      path: `outcomes[${i}].id`,
    })),
    ...pkg.assets.map((a, i) => ({
      id: a.id,
      type: "asset",
      path: `assets[${i}].id`,
    })),
  ];
  for (const [di, d] of pkg.decisions.entries()) {
    for (const [oi, o] of d.options.entries()) {
      idItems.push({
        id: o.id,
        type: "decision_option",
        path: `decisions[${di}].options[${oi}].id`,
      });
    }
  }
  assertUniqueLocalIds(idItems, issues);

  const indexes = buildIndexes(pkg);

  // Layer 3 — References
  for (const chapter of pkg.chapters) {
    for (const activityId of chapter.requiredActivityIds) {
      if (!indexes.activities.has(activityId)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Chapter required activity ${activityId} not found`,
            `chapters.${chapter.id}.requiredActivityIds`,
            "chapter",
            chapter.id,
            "requiredActivityIds",
            activityId,
          ),
        );
      }
    }
    for (const decisionId of chapter.requiredDecisionIds) {
      if (!indexes.decisions.has(decisionId)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Chapter required decision ${decisionId} not found`,
            `chapters.${chapter.id}.requiredDecisionIds`,
            "chapter",
            chapter.id,
            "requiredDecisionIds",
            decisionId,
          ),
        );
      }
    }
  }

  for (const stakeholder of pkg.stakeholders) {
    for (const rel of stakeholder.relationships) {
      if (!indexes.stakeholders.has(rel.otherStakeholderId)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Stakeholder relationship target ${rel.otherStakeholderId} not found`,
            `stakeholders.${stakeholder.id}.relationships`,
            "stakeholder",
            stakeholder.id,
            "relationships",
            rel.otherStakeholderId,
          ),
        );
      }
    }
    for (const behavior of stakeholder.chapterBehavior) {
      if (!indexes.chapters.has(behavior.chapterId)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Stakeholder chapterBehavior chapter ${behavior.chapterId} not found`,
            `stakeholders.${stakeholder.id}.chapterBehavior`,
            "stakeholder",
            stakeholder.id,
            "chapterBehavior",
            behavior.chapterId,
          ),
        );
      }
    }
    if (
      stakeholder.portraitAssetId !== null &&
      !indexes.assets.has(stakeholder.portraitAssetId)
    ) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Stakeholder portrait asset ${stakeholder.portraitAssetId} not found`,
          `stakeholders.${stakeholder.id}.portraitAssetId`,
          "stakeholder",
          stakeholder.id,
          "portraitAssetId",
          stakeholder.portraitAssetId,
        ),
      );
    }
  }

  for (const message of pkg.messages) {
    if (!indexes.chapters.has(message.chapterId)) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Message chapter ${message.chapterId} not found`,
          `messages.${message.id}.chapterId`,
          "message",
          message.id,
          "chapterId",
          message.chapterId,
        ),
      );
    }
    if (
      message.senderStakeholderId !== null &&
      !indexes.stakeholders.has(message.senderStakeholderId)
    ) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Message sender ${message.senderStakeholderId} not found`,
          `messages.${message.id}.senderStakeholderId`,
          "message",
          message.id,
          "senderStakeholderId",
          message.senderStakeholderId,
        ),
      );
    }
    if (
      message.relatedDecisionId !== null &&
      !indexes.decisions.has(message.relatedDecisionId)
    ) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Message related decision ${message.relatedDecisionId} not found`,
          `messages.${message.id}.relatedDecisionId`,
          "message",
          message.id,
          "relatedDecisionId",
          message.relatedDecisionId,
        ),
      );
    }
    if (
      message.relatedMeetingId !== null &&
      !indexes.meetings.has(message.relatedMeetingId)
    ) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Message related meeting ${message.relatedMeetingId} not found`,
          `messages.${message.id}.relatedMeetingId`,
          "message",
          message.id,
          "relatedMeetingId",
          message.relatedMeetingId,
        ),
      );
    }
    for (const docId of message.relatedDocumentIds) {
      if (!indexes.documents.has(docId)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Message related document ${docId} not found`,
            `messages.${message.id}.relatedDocumentIds`,
            "message",
            message.id,
            "relatedDocumentIds",
            docId,
          ),
        );
      }
    }
  }

  for (const meeting of pkg.meetings) {
    if (!indexes.chapters.has(meeting.chapterId)) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Meeting chapter ${meeting.chapterId} not found`,
          `meetings.${meeting.id}.chapterId`,
          "meeting",
          meeting.id,
          "chapterId",
          meeting.chapterId,
        ),
      );
    }
    for (const sid of meeting.participantStakeholderIds) {
      if (!indexes.stakeholders.has(sid)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Meeting participant ${sid} not found`,
            `meetings.${meeting.id}.participantStakeholderIds`,
            "meeting",
            meeting.id,
            "participantStakeholderIds",
            sid,
          ),
        );
      }
    }
  }

  for (const decision of pkg.decisions) {
    if (!indexes.chapters.has(decision.chapterId)) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Decision chapter ${decision.chapterId} not found`,
          `decisions.${decision.id}.chapterId`,
          "decision",
          decision.id,
          "chapterId",
          decision.chapterId,
        ),
      );
    }
    for (const evidence of decision.requiredEvidence) {
      if (
        !indexes.evidenceTags.has(evidence.evidenceTag) &&
        evidence.requiredForEligibility
      ) {
        issues.push(
          errIssue(
            "MISSING_EVIDENCE_REFERENCE",
            `Evidence tag ${evidence.evidenceTag} is not produced by any document in this package`,
            `decisions.${decision.id}.requiredEvidence`,
            "decision",
            decision.id,
            "requiredEvidence",
            evidence.evidenceTag,
          ),
        );
      }
    }
    for (const [optionId, consequenceIds] of Object.entries(
      decision.consequenceIdsByOption,
    )) {
      if (!indexes.options.has(optionId)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `consequenceIdsByOption key ${optionId} is not a decision option`,
            `decisions.${decision.id}.consequenceIdsByOption`,
            "decision",
            decision.id,
            "consequenceIdsByOption",
            optionId,
          ),
        );
      }
      for (const cid of consequenceIds) {
        if (!indexes.consequences.has(cid)) {
          issues.push(
            errIssue(
              "MISSING_REFERENCE",
              `Option consequence ${cid} not found`,
              `decisions.${decision.id}.consequenceIdsByOption`,
              "decision",
              decision.id,
              "consequenceIdsByOption",
              cid,
            ),
          );
        }
      }
    }
    for (const competencyId of Object.keys(decision.rubric.competencyWeights)) {
      if (!indexes.competencies.has(competencyId)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Rubric competency ${competencyId} not found in assessment`,
            `decisions.${decision.id}.rubric`,
            "decision",
            decision.id,
            "rubric.competencyWeights",
            competencyId,
          ),
        );
      }
    }
  }

  for (const activity of pkg.activities) {
    if (!indexes.chapters.has(activity.chapterId)) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Activity chapter ${activity.chapterId} not found`,
          `activities.${activity.id}.chapterId`,
          "activity",
          activity.id,
          "chapterId",
          activity.chapterId,
        ),
      );
    }
  }

  for (const doc of pkg.documents) {
    if (doc.assetId !== null && !indexes.assets.has(doc.assetId)) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Document asset ${doc.assetId} not found`,
          `documents.${doc.id}.assetId`,
          "document",
          doc.id,
          "assetId",
          doc.assetId,
        ),
      );
    }
  }

  if (
    manifest.thumbnailAssetId !== null &&
    !indexes.assets.has(manifest.thumbnailAssetId)
  ) {
    issues.push(
      errIssue(
        "MISSING_REFERENCE",
        `Thumbnail asset ${manifest.thumbnailAssetId} not found`,
        "manifest.thumbnailAssetId",
        "manifest",
        "manifest",
        "thumbnailAssetId",
        manifest.thumbnailAssetId,
      ),
    );
  }
  if (
    manifest.heroAssetId !== null &&
    !indexes.assets.has(manifest.heroAssetId)
  ) {
    issues.push(
      errIssue(
        "MISSING_REFERENCE",
        `Hero asset ${manifest.heroAssetId} not found`,
        "manifest.heroAssetId",
        "manifest",
        "manifest",
        "heroAssetId",
        manifest.heroAssetId,
      ),
    );
  }

  // Layer 4 — Narrative / progression
  const unlockGraph = chapterUnlockDeps(pkg);
  if (hasCycle(unlockGraph)) {
    issues.push(
      errIssue(
        "CIRCULAR_DEPENDENCY",
        "Chapter unlock dependencies contain a cycle",
        "chapters",
        "chapter",
        "chapters",
        "unlockWhen",
        undefined,
        "Remove circular unlockWhen chapter_status references.",
      ),
    );
  }
  const orders = pkg.chapters.map((c) => c.order);
  if (new Set(orders).size !== orders.length) {
    issues.push(
      errIssue(
        "INVALID_CHAPTER_ORDER",
        "Chapter order values must be unique",
        "chapters",
        "chapter",
        "chapters",
        "order",
      ),
    );
  }

  // Layer 5 — Decisions and consequences
  for (const decision of pkg.decisions) {
    if (decision.options.length === 0) {
      issues.push(
        errIssue(
          "DECISION_WITHOUT_OPTIONS",
          `Decision ${decision.id} has no options`,
          `decisions.${decision.id}.options`,
          "decision",
          decision.id,
          "options",
        ),
      );
    }
  }

  for (const consequence of pkg.consequences) {
    const refs = {
      chapters: new Set<string>(),
      activities: new Set<string>(),
      decisions: new Set<string>(),
      options: new Set<string>(),
      meetings: new Set<string>(),
      documents: new Set<string>(),
      messages: new Set<string>(),
    };
    collectConditionRefs(consequence.applyWhen, refs);
    for (const id of refs.chapters) {
      if (!indexes.chapters.has(id)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Condition chapter ${id} missing`,
            `consequences.${consequence.id}.applyWhen`,
            "consequence",
            consequence.id,
            "applyWhen",
            id,
          ),
        );
      }
    }
    for (const id of refs.activities) {
      if (!indexes.activities.has(id)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Condition activity ${id} missing`,
            `consequences.${consequence.id}.applyWhen`,
            "consequence",
            consequence.id,
            "applyWhen",
            id,
          ),
        );
      }
    }
    for (const id of refs.decisions) {
      if (!indexes.decisions.has(id)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Condition decision ${id} missing`,
            `consequences.${consequence.id}.applyWhen`,
            "consequence",
            consequence.id,
            "applyWhen",
            id,
          ),
        );
      }
    }
    for (const id of refs.options) {
      if (!indexes.options.has(id)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Condition option ${id} missing`,
            `consequences.${consequence.id}.applyWhen`,
            "consequence",
            consequence.id,
            "applyWhen",
            id,
          ),
        );
      }
    }
    for (const id of refs.documents) {
      if (!indexes.documents.has(id)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Condition document ${id} missing`,
            `consequences.${consequence.id}.applyWhen`,
            "consequence",
            consequence.id,
            "applyWhen",
            id,
          ),
        );
      }
    }
    for (const id of refs.meetings) {
      if (!indexes.meetings.has(id)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Condition meeting ${id} missing`,
            `consequences.${consequence.id}.applyWhen`,
            "consequence",
            consequence.id,
            "applyWhen",
            id,
          ),
        );
      }
    }
    for (const id of refs.messages) {
      if (!indexes.messages.has(id)) {
        issues.push(
          errIssue(
            "MISSING_REFERENCE",
            `Condition message ${id} missing`,
            `consequences.${consequence.id}.applyWhen`,
            "consequence",
            consequence.id,
            "applyWhen",
            id,
          ),
        );
      }
    }
    if (
      consequence.timing.kind === "delayed" &&
      consequence.timing.afterSimulationDays < 0
    ) {
      issues.push(
        errIssue(
          "INVALID_DELAYED_TRIGGER",
          "Delayed consequence afterSimulationDays must be >= 0",
          `consequences.${consequence.id}.timing`,
          "consequence",
          consequence.id,
          "timing.afterSimulationDays",
        ),
      );
    }
    for (const effect of consequence.effects) {
      issues.push(
        ...validateEffectTargets(
          effect,
          indexes,
          consequence.id,
          `consequences.${consequence.id}.effects`,
        ),
      );
    }
    if (
      consequence.sourceDecisionId !== null &&
      !indexes.decisions.has(consequence.sourceDecisionId)
    ) {
      issues.push(
        errIssue(
          "MISSING_REFERENCE",
          `Consequence sourceDecisionId ${consequence.sourceDecisionId} not found`,
          `consequences.${consequence.id}.sourceDecisionId`,
          "consequence",
          consequence.id,
          "sourceDecisionId",
          consequence.sourceDecisionId,
        ),
      );
    }
  }

  // Layer 6 — Information fairness
  for (const decision of pkg.decisions) {
    for (const evidence of decision.requiredEvidence) {
      if (!evidence.requiredForEligibility) continue;
      const supportingDocs = pkg.documents.filter((d) =>
        d.evidenceTags.includes(evidence.evidenceTag),
      );
      for (const doc of supportingDocs) {
        if (doc.containsHiddenSections) {
          issues.push(
            errIssue(
              "HIDDEN_EVIDENCE_REQUIRED",
              `Decision requires evidence from document ${doc.id} that contains hidden sections`,
              `decisions.${decision.id}.requiredEvidence`,
              "decision",
              decision.id,
              "requiredEvidence",
              doc.id,
              "Do not require hidden evidence for eligibility before discovery.",
            ),
          );
        }
      }
    }
  }

  // Layer 7 — Accessibility / localization
  if (!manifest.supportedLocales.includes(manifest.defaultLocale)) {
    issues.push(
      errIssue(
        "UNSUPPORTED_LOCALE",
        `Default locale ${manifest.defaultLocale} is not in supportedLocales`,
        "manifest.defaultLocale",
        "manifest",
        "manifest",
        "defaultLocale",
      ),
    );
  }
  for (const asset of pkg.assets) {
    if (asset.kind === "image") {
      requireLocalized(
        asset.accessibilityLabel,
        defaultLocale,
        `assets.${asset.id}.accessibilityLabel`,
        "asset",
        asset.id,
        "accessibilityLabel",
        issues,
      );
      if (
        resolveLocalizedText(asset.accessibilityLabel, defaultLocale) === null
      ) {
        issues.push(
          errIssue(
            "MISSING_ALT_TEXT",
            `Image asset ${asset.id} requires accessibilityLabel for default locale`,
            `assets.${asset.id}.accessibilityLabel`,
            "asset",
            asset.id,
            "accessibilityLabel",
          ),
        );
      }
    }
  }
  requireLocalized(
    manifest.accessibilitySummary,
    defaultLocale,
    "manifest.accessibilitySummary",
    "manifest",
    "manifest",
    "accessibilitySummary",
    issues,
  );

  // Layer 8 — Runtime / publication
  if (
    pkg.runtimeCompatibility !== CURRENT_RUNTIME_COMPATIBILITY ||
    manifest.runtimeCompatibility !== CURRENT_RUNTIME_COMPATIBILITY
  ) {
    issues.push(
      errIssue(
        "RUNTIME_INCOMPATIBLE",
        `runtimeCompatibility is not supported (expected ${CURRENT_RUNTIME_COMPATIBILITY})`,
        "manifest.runtimeCompatibility",
        "manifest",
        "manifest",
        "runtimeCompatibility",
      ),
    );
  }

  const expectedChecksum = computeBusinessCasePackageChecksum(pkg);
  if (manifest.publicationStatus === "published") {
    if (!manifest.checksum) {
      issues.push(
        errIssue(
          "CHECKSUM_MISMATCH",
          "Published packages must include a checksum",
          "manifest.checksum",
          "manifest",
          "manifest",
          "checksum",
        ),
      );
    } else if (manifest.checksum !== expectedChecksum) {
      issues.push(
        errIssue(
          "CHECKSUM_MISMATCH",
          `Checksum mismatch: expected ${expectedChecksum}, got ${manifest.checksum}`,
          "manifest.checksum",
          "manifest",
          "manifest",
          "checksum",
        ),
      );
    }
  }

  if (
    manifest.publicationStatus === "published" &&
    manifest.availability === "retired"
  ) {
    issues.push(
      warnIssue(
        "PUBLISHED_BUT_RETIRED",
        "Package is published but retired from new-run selection",
        "manifest.availability",
        "manifest",
        "manifest",
        "availability",
      ),
    );
  }

  const stamped = issues.map((i) =>
    issue({
      ...i,
      businessCaseId: manifest.businessCaseId,
      contentVersion: manifest.contentVersion,
    }),
  );
  const errors = stamped.filter((i) => i.severity === "error");
  const warnings = stamped.filter((i) => i.severity === "warning");
  const completedAt = options.nowIso ?? new Date(0).toISOString();

  return {
    validationRunId:
      options.validationRunId ??
      `validation:${manifest.businessCaseId}:${manifest.contentVersion}`,
    contentPackageVersionId: options.contentPackageVersionId ?? null,
    businessCaseId: manifest.businessCaseId as BusinessCaseId,
    contentVersion: manifest.contentVersion,
    checksum: expectedChecksum,
    startedAt,
    completedAt,
    status: errors.length === 0 ? "passed" : "failed",
    errors,
    warnings,
    validatorVersion: CONTENT_VALIDATOR_VERSION,
  };
}

/** True when a validated published package may appear in the learner catalog for new runs. */
export function isSelectableForNewRuns(
  pkg: BusinessCaseContentPackage,
  validation: ContentValidationResult,
): boolean {
  return (
    validation.status === "passed" &&
    pkg.manifest.publicationStatus === "published" &&
    pkg.manifest.availability === "available" &&
    pkg.runtimeCompatibility === CURRENT_RUNTIME_COMPATIBILITY &&
    pkg.manifest.runtimeCompatibility === CURRENT_RUNTIME_COMPATIBILITY
  );
}
