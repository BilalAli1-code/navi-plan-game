/**
 * BC-006 Workstream 1 canonical content-contract companion model.
 *
 * This module is additive to the BC-003 BusinessCaseContentPackage schema.
 * It provides implementation-facing classification, coaching, and source
 * traceability contracts without creating a second authoritative runtime state.
 */

import type { ConditionExpression } from "./conditions";
import type { MessageDefinition } from "./entities";
import type { ExperienceLevel } from "./enums";
import { isValidLocalEntityId } from "./ids";
import type { LocalizedText } from "./localized";
import type { BusinessCaseContentPackage } from "./package";

export const CANONICAL_CONTENT_ENTITY_KINDS = [
  "chapter",
  "stakeholder",
  "message",
  "conversation",
  "meeting",
  "document",
  "notification",
  "activity",
  "decision",
  "decision_option",
  "consequence",
  "crisis",
  "assessment",
  "competency",
  "coaching_intervention",
  "achievement",
  "outcome",
  "asset",
] as const;

export type CanonicalContentEntityKind =
  (typeof CANONICAL_CONTENT_ENTITY_KINDS)[number];

export interface CanonicalContentReference {
  readonly kind: CanonicalContentEntityKind;
  readonly id: string;
}

/** A documentation source that governs one canonical content definition. */
export interface ContentSourceReference {
  readonly documentPath: string;
  readonly section: string;
  readonly anchor: string | null;
}

/** Traceability is implementation metadata and is not authoritative run state. */
export interface CanonicalContentTraceabilityEntry {
  readonly entity: CanonicalContentReference;
  readonly sources: readonly ContentSourceReference[];
}

export type InboxItemClassification =
  "informational" | "action_required" | "decision_bearing";

/**
 * Deterministically classify an authored Inbox message.
 *
 * A message is decision-bearing only when it both requires a learner response
 * and links to a canonical Decision. Merely mentioning a Decision never makes
 * informational content count as a Decision.
 */
export const classifyInboxMessage = (
  message: MessageDefinition,
): InboxItemClassification => {
  if (message.informationalOnly || !message.requiresResponse) {
    return "informational";
  }
  return message.relatedDecisionId === null
    ? "action_required"
    : "decision_bearing";
};

export type CoachingInterventionType =
  "orientation" | "hint" | "reflection_prompt" | "remediation" | "debrief";

/**
 * Authored coaching definition. Runtime coaching may explain authoritative
 * facts but may not mutate state, scoring, eligibility, or progression.
 */
export interface CoachingInterventionDefinition {
  readonly id: string;
  readonly chapterId: string | null;
  readonly interventionType: CoachingInterventionType;
  readonly triggerWhen: ConditionExpression;
  readonly audience: readonly ExperienceLevel[];
  readonly title: LocalizedText;
  readonly guidance: LocalizedText;
  readonly relatedDecisionIds: readonly string[];
  readonly relatedActivityIds: readonly string[];
}

/**
 * Additive implementation companion for one immutable content-package version.
 */
export interface CanonicalContentContractSet {
  readonly package: BusinessCaseContentPackage;
  readonly assessmentId: string;
  readonly coachingInterventions: readonly CoachingInterventionDefinition[];
  readonly traceability: readonly CanonicalContentTraceabilityEntry[];
}

export interface CanonicalContractValidationOptions {
  readonly requireTraceabilityCoverage?: boolean;
}

export interface CanonicalContractValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly entity: CanonicalContentReference | null;
  readonly relatedId: string | null;
}

export interface CanonicalContractValidationResult {
  readonly status: "passed" | "failed";
  readonly errors: readonly CanonicalContractValidationIssue[];
}

const ref = (
  kind: CanonicalContentEntityKind,
  id: string,
): CanonicalContentReference => ({ kind, id });

/** Enumerate stable references owned by one content contract set. */
export const listCanonicalContentReferences = (
  contractSet: CanonicalContentContractSet,
): readonly CanonicalContentReference[] => {
  const pkg = contractSet.package;
  return [
    ...pkg.chapters.map((entity) => ref("chapter", entity.id)),
    ...pkg.stakeholders.map((entity) => ref("stakeholder", entity.id)),
    ...pkg.messages.map((entity) => ref("message", entity.id)),
    ...pkg.conversations.map((entity) => ref("conversation", entity.id)),
    ...pkg.meetings.map((entity) => ref("meeting", entity.id)),
    ...pkg.documents.map((entity) => ref("document", entity.id)),
    ...pkg.notifications.map((entity) => ref("notification", entity.id)),
    ...pkg.activities.map((entity) => ref("activity", entity.id)),
    ...pkg.decisions.map((entity) => ref("decision", entity.id)),
    ...pkg.decisions.flatMap((decision) =>
      decision.options.map((option) => ref("decision_option", option.id)),
    ),
    ...pkg.consequences.map((entity) => ref("consequence", entity.id)),
    ...pkg.crises.map((entity) => ref("crisis", entity.id)),
    ref("assessment", contractSet.assessmentId),
    ...pkg.assessment.competencies.map((entity) =>
      ref("competency", entity.id),
    ),
    ...contractSet.coachingInterventions.map((entity) =>
      ref("coaching_intervention", entity.id),
    ),
    ...pkg.achievements.map((entity) => ref("achievement", entity.id)),
    ...pkg.outcomes.map((entity) => ref("outcome", entity.id)),
    ...pkg.assets.map((entity) => ref("asset", entity.id)),
  ];
};

const keyOf = (reference: CanonicalContentReference): string =>
  `${reference.kind}:${reference.id}`;

const validationIssue = (
  code: string,
  path: string,
  message: string,
  entity: CanonicalContentReference | null = null,
  relatedId: string | null = null,
): CanonicalContractValidationIssue => ({
  code,
  path,
  message,
  entity,
  relatedId,
});

/**
 * Validate BC-006 companion contracts without executing authored code or
 * reading runtime state. Existing BC-003 package validation remains required.
 */
export const validateCanonicalContentContractSet = (
  contractSet: CanonicalContentContractSet,
  options: CanonicalContractValidationOptions = {},
): CanonicalContractValidationResult => {
  const errors: CanonicalContractValidationIssue[] = [];
  const references = listCanonicalContentReferences(contractSet);
  const referenceKeys = new Set<string>();

  for (const [index, reference] of references.entries()) {
    if (!isValidLocalEntityId(reference.id)) {
      errors.push(
        validationIssue(
          "INVALID_CANONICAL_ID",
          `references[${index}]`,
          `Invalid canonical ${reference.kind} id: ${reference.id}`,
          reference,
        ),
      );
    }
    const key = keyOf(reference);
    if (referenceKeys.has(key)) {
      errors.push(
        validationIssue(
          "DUPLICATE_CANONICAL_ID",
          `references[${index}]`,
          `Duplicate canonical reference ${key}`,
          reference,
        ),
      );
    }
    referenceKeys.add(key);
  }

  for (const [index, message] of contractSet.package.messages.entries()) {
    if (message.informationalOnly && message.requiresResponse) {
      errors.push(
        validationIssue(
          "INVALID_INBOX_CLASSIFICATION",
          `package.messages[${index}]`,
          "An informational message cannot require a learner response.",
          ref("message", message.id),
        ),
      );
    }
    if (message.channel === "system" && message.requiresResponse) {
      errors.push(
        validationIssue(
          "INVALID_MESSAGE_CLASSIFICATION",
          `package.messages[${index}]`,
          "A system message cannot require a learner response.",
          ref("message", message.id),
        ),
      );
    }
  }

  const chapterIds = new Set(
    contractSet.package.chapters.map((item) => item.id),
  );
  const decisionIds = new Set(
    contractSet.package.decisions.map((item) => item.id),
  );
  const activityIds = new Set(
    contractSet.package.activities.map((item) => item.id),
  );
  const coachingIds = new Set<string>();

  for (const [index, coaching] of contractSet.coachingInterventions.entries()) {
    const coachingRef = ref("coaching_intervention", coaching.id);
    if (coachingIds.has(coaching.id)) {
      errors.push(
        validationIssue(
          "DUPLICATE_COACHING_ID",
          `coachingInterventions[${index}].id`,
          `Duplicate coaching intervention id ${coaching.id}`,
          coachingRef,
        ),
      );
    }
    coachingIds.add(coaching.id);

    if (coaching.audience.length === 0) {
      errors.push(
        validationIssue(
          "EMPTY_COACHING_AUDIENCE",
          `coachingInterventions[${index}].audience`,
          "A coaching intervention must target at least one experience level.",
          coachingRef,
        ),
      );
    }
    if (
      coaching.chapterId !== null &&
      !chapterIds.has(coaching.chapterId as never)
    ) {
      errors.push(
        validationIssue(
          "BROKEN_COACHING_REFERENCE",
          `coachingInterventions[${index}].chapterId`,
          `Coaching chapter ${coaching.chapterId} does not exist.`,
          coachingRef,
          coaching.chapterId,
        ),
      );
    }
    for (const decisionId of coaching.relatedDecisionIds) {
      if (!decisionIds.has(decisionId as never)) {
        errors.push(
          validationIssue(
            "BROKEN_COACHING_REFERENCE",
            `coachingInterventions[${index}].relatedDecisionIds`,
            `Coaching Decision ${decisionId} does not exist.`,
            coachingRef,
            decisionId,
          ),
        );
      }
    }
    for (const activityId of coaching.relatedActivityIds) {
      if (!activityIds.has(activityId as never)) {
        errors.push(
          validationIssue(
            "BROKEN_COACHING_REFERENCE",
            `coachingInterventions[${index}].relatedActivityIds`,
            `Coaching Activity ${activityId} does not exist.`,
            coachingRef,
            activityId,
          ),
        );
      }
    }
  }

  const tracedKeys = new Set<string>();
  for (const [index, entry] of contractSet.traceability.entries()) {
    const key = keyOf(entry.entity);
    if (!referenceKeys.has(key)) {
      errors.push(
        validationIssue(
          "BROKEN_TRACEABILITY_REFERENCE",
          `traceability[${index}].entity`,
          `Traceability target ${key} does not exist in this contract set.`,
          entry.entity,
        ),
      );
    }
    if (tracedKeys.has(key)) {
      errors.push(
        validationIssue(
          "DUPLICATE_TRACEABILITY_ENTRY",
          `traceability[${index}].entity`,
          `Traceability target ${key} is declared more than once.`,
          entry.entity,
        ),
      );
    }
    tracedKeys.add(key);

    if (entry.sources.length === 0) {
      errors.push(
        validationIssue(
          "MISSING_TRACEABILITY_SOURCE",
          `traceability[${index}].sources`,
          `Traceability target ${key} must include at least one source.`,
          entry.entity,
        ),
      );
    }
    for (const [sourceIndex, source] of entry.sources.entries()) {
      if (
        !source.documentPath.endsWith(".md") ||
        source.section.trim() === ""
      ) {
        errors.push(
          validationIssue(
            "INVALID_TRACEABILITY_SOURCE",
            `traceability[${index}].sources[${sourceIndex}]`,
            "Traceability sources require a Markdown documentPath and non-empty section.",
            entry.entity,
          ),
        );
      }
    }
  }

  if (options.requireTraceabilityCoverage === true) {
    for (const reference of references) {
      const key = keyOf(reference);
      if (!tracedKeys.has(key)) {
        errors.push(
          validationIssue(
            "MISSING_TRACEABILITY_COVERAGE",
            "traceability",
            `Canonical reference ${key} has no source-document traceability.`,
            reference,
          ),
        );
      }
    }
  }

  return {
    status: errors.length === 0 ? "passed" : "failed",
    errors,
  };
};
