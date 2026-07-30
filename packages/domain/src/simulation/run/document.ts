import type {
  RuleViolationCode,
  RuleViolationError,
} from "../../shared-kernel/errors";
import { ruleViolationError } from "../../shared-kernel/errors";
import type { CommandId, DocumentId } from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import { asIsoTimestamp, type IsoTimestamp } from "../../shared-kernel/time";

/**
 * Authoritative Document runtime state owned by SimulationRun (PS-ROADMAP-020).
 *
 * Distinct from authored Content Aggregate Document Definitions and from the
 * reserved `documents` workplace projection. v1 is append-only available-only
 * plain-text snapshots. Binary/object storage, Markdown/HTML, uploads, editing,
 * comments, and archive workflows are out of scope.
 */

export const DOCUMENT_TITLE_MAX_LENGTH = 200;
export const DOCUMENT_CATEGORY_MAX_LENGTH = 120;
export const DOCUMENT_DESCRIPTION_MAX_LENGTH = 2000;
export const DOCUMENT_BODY_MAX_LENGTH = 50_000;
export const DOCUMENT_DEFINITION_VERSION_MAX_LENGTH = 64;

export const documentContentTypes = ["plain_text"] as const;
export type DocumentContentType = (typeof documentContentTypes)[number];

export const isDocumentContentType = (
  value: string,
): value is DocumentContentType =>
  (documentContentTypes as readonly string[]).includes(value);

export const documentLifecycleStates = ["available"] as const;
export type DocumentLifecycleState = (typeof documentLifecycleStates)[number];

export const isDocumentLifecycleState = (
  value: string,
): value is DocumentLifecycleState =>
  (documentLifecycleStates as readonly string[]).includes(value);

/** Learner-safe content snapshot pinned at initialization. */
export interface DocumentLearnerSafeContent {
  readonly title: string;
  readonly category: string | null;
  readonly description: string | null;
  readonly contentType: DocumentContentType;
  /** Immutable plain-text body. Markup characters are rejected. */
  readonly body: string;
}

/**
 * One runtime Document per DocumentId per SimulationRun.
 *
 * Identity: DocumentId. Ordering: monotonic creationSequence (1-based).
 * Lifecycle v1: available-only (created Documents are immediately available).
 */
export interface DocumentRuntime {
  readonly documentId: DocumentId;
  /** Content definition identity (v1: same as documentId unless overridden). */
  readonly documentDefinitionId: DocumentId;
  readonly documentDefinitionVersion: string;
  /** 1-based monotonic creation order within the run. */
  readonly creationSequence: number;
  readonly content: DocumentLearnerSafeContent;
  readonly status: DocumentLifecycleState;
  readonly createdAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

const requireBoundedNonEmpty = (
  value: string,
  field: string,
  maxLength: number,
  code: RuleViolationCode,
): Result<string, RuleViolationError> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err(
      ruleViolationError(
        code,
        `Document.${field} must be a non-empty string.`,
        { field },
      ),
    );
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        code,
        `Document.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        code,
        `Document.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

const requireOptionalBounded = (
  value: string | null | undefined,
  field: string,
  maxLength: number,
  code: RuleViolationCode,
): Result<string | null, RuleViolationError> => {
  if (value === null || value === undefined) {
    return ok(null);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return ok(null);
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        code,
        `Document.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        code,
        `Document.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

export const createDocumentLearnerSafeContent = (input: {
  readonly title: string;
  readonly category?: string | null;
  readonly description?: string | null;
  readonly contentType?: DocumentContentType;
  readonly body: string;
}): Result<DocumentLearnerSafeContent, RuleViolationError> => {
  const title = requireBoundedNonEmpty(
    input.title,
    "title",
    DOCUMENT_TITLE_MAX_LENGTH,
    "DOCUMENT_CONTENT_INVALID",
  );
  if (!title.ok) {
    return title;
  }
  const category = requireOptionalBounded(
    input.category,
    "category",
    DOCUMENT_CATEGORY_MAX_LENGTH,
    "DOCUMENT_CONTENT_INVALID",
  );
  if (!category.ok) {
    return category;
  }
  const description = requireOptionalBounded(
    input.description,
    "description",
    DOCUMENT_DESCRIPTION_MAX_LENGTH,
    "DOCUMENT_CONTENT_INVALID",
  );
  if (!description.ok) {
    return description;
  }
  const contentType = input.contentType ?? "plain_text";
  if (!isDocumentContentType(contentType)) {
    return err(
      ruleViolationError(
        "DOCUMENT_CONTENT_INVALID",
        `Unsupported Document contentType '${String(contentType)}'.`,
      ),
    );
  }
  const body = requireBoundedNonEmpty(
    input.body,
    "body",
    DOCUMENT_BODY_MAX_LENGTH,
    "DOCUMENT_CONTENT_INVALID",
  );
  if (!body.ok) {
    return body;
  }
  return ok({
    title: title.value,
    category: category.value,
    description: description.value,
    contentType,
    body: body.value,
  });
};

export const createDocumentRuntime = (input: {
  readonly documentId: DocumentId;
  readonly documentDefinitionId?: DocumentId;
  readonly documentDefinitionVersion?: string;
  readonly creationSequence: number;
  readonly content: DocumentLearnerSafeContent;
  readonly createdAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}): Result<DocumentRuntime, RuleViolationError> => {
  if (!input.documentId || String(input.documentId).trim().length === 0) {
    return err(
      ruleViolationError(
        "DOCUMENT_IDENTITY_INVALID",
        "Document.documentId must be a non-empty identifier.",
      ),
    );
  }
  if (!Number.isInteger(input.creationSequence) || input.creationSequence < 1) {
    return err(
      ruleViolationError(
        "DOCUMENT_SEQUENCE_INVALID",
        "Document.creationSequence must be a positive integer.",
        { creationSequence: input.creationSequence },
      ),
    );
  }
  const definitionVersion = requireBoundedNonEmpty(
    input.documentDefinitionVersion ?? "1",
    "documentDefinitionVersion",
    DOCUMENT_DEFINITION_VERSION_MAX_LENGTH,
    "DOCUMENT_DEFINITION_INVALID",
  );
  if (!definitionVersion.ok) {
    return definitionVersion;
  }
  return ok({
    documentId: input.documentId,
    documentDefinitionId: input.documentDefinitionId ?? input.documentId,
    documentDefinitionVersion: definitionVersion.value,
    creationSequence: input.creationSequence,
    content: input.content,
    status: "available",
    createdAt: input.createdAt,
    originatingCommandId: input.originatingCommandId,
  });
};

export const documentRuntimeSemanticEqual = (
  left: DocumentRuntime,
  right: DocumentRuntime,
): boolean =>
  left.documentId === right.documentId &&
  left.documentDefinitionId === right.documentDefinitionId &&
  left.documentDefinitionVersion === right.documentDefinitionVersion &&
  left.content.title === right.content.title &&
  left.content.category === right.content.category &&
  left.content.description === right.content.description &&
  left.content.contentType === right.content.contentType &&
  left.content.body === right.content.body &&
  left.status === right.status;

export const serializeDocumentRuntime = (
  document: DocumentRuntime,
): Readonly<Record<string, unknown>> => ({
  documentId: document.documentId,
  documentDefinitionId: document.documentDefinitionId,
  documentDefinitionVersion: document.documentDefinitionVersion,
  creationSequence: document.creationSequence,
  content: {
    title: document.content.title,
    category: document.content.category,
    description: document.content.description,
    contentType: document.content.contentType,
    body: document.content.body,
  },
  status: document.status,
  createdAt: document.createdAt,
  originatingCommandId: document.originatingCommandId,
});

export const parseDocumentRuntime = (
  value: unknown,
): Result<DocumentRuntime, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "DOCUMENT_OCCURRENCE_INVALID",
        "Document runtime must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.documentId !== "string" ||
    record.documentId.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "DOCUMENT_IDENTITY_INVALID",
        "Document.documentId must be a non-empty string.",
      ),
    );
  }
  if (
    typeof record.documentDefinitionId !== "string" ||
    record.documentDefinitionId.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "DOCUMENT_DEFINITION_INVALID",
        "Document.documentDefinitionId must be a non-empty string.",
      ),
    );
  }
  if (
    typeof record.documentDefinitionVersion !== "string" ||
    record.documentDefinitionVersion.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "DOCUMENT_DEFINITION_INVALID",
        "Document.documentDefinitionVersion must be a non-empty string.",
      ),
    );
  }
  if (
    typeof record.creationSequence !== "number" ||
    !Number.isInteger(record.creationSequence) ||
    record.creationSequence < 1
  ) {
    return err(
      ruleViolationError(
        "DOCUMENT_SEQUENCE_INVALID",
        "Document.creationSequence must be a positive integer.",
      ),
    );
  }
  if (
    typeof record.status !== "string" ||
    !isDocumentLifecycleState(record.status)
  ) {
    return err(
      ruleViolationError(
        "DOCUMENT_OCCURRENCE_INVALID",
        `Unsupported Document status '${String(record.status)}'.`,
      ),
    );
  }
  if (typeof record.createdAt !== "string") {
    return err(
      ruleViolationError(
        "DOCUMENT_OCCURRENCE_INVALID",
        "Document.createdAt must be an ISO timestamp string.",
      ),
    );
  }
  if (
    typeof record.originatingCommandId !== "string" ||
    record.originatingCommandId.trim() === ""
  ) {
    return err(
      ruleViolationError(
        "DOCUMENT_OCCURRENCE_INVALID",
        "Document.originatingCommandId must be a non-empty string.",
      ),
    );
  }
  if (
    typeof record.content !== "object" ||
    record.content === null ||
    Array.isArray(record.content)
  ) {
    return err(
      ruleViolationError(
        "DOCUMENT_CONTENT_INVALID",
        "Document.content must be an object.",
      ),
    );
  }
  const contentRecord = record.content as Record<string, unknown>;
  if (
    typeof contentRecord.contentType !== "string" ||
    !isDocumentContentType(contentRecord.contentType)
  ) {
    return err(
      ruleViolationError(
        "DOCUMENT_CONTENT_INVALID",
        `Unsupported Document contentType '${String(contentRecord.contentType)}'.`,
      ),
    );
  }
  const content = createDocumentLearnerSafeContent({
    title: String(contentRecord.title ?? ""),
    category:
      contentRecord.category === null || contentRecord.category === undefined
        ? null
        : String(contentRecord.category),
    description:
      contentRecord.description === null ||
      contentRecord.description === undefined
        ? null
        : String(contentRecord.description),
    contentType: contentRecord.contentType,
    body: String(contentRecord.body ?? ""),
  });
  if (!content.ok) {
    return content;
  }
  return createDocumentRuntime({
    documentId: record.documentId as DocumentId,
    documentDefinitionId: record.documentDefinitionId as DocumentId,
    documentDefinitionVersion: record.documentDefinitionVersion,
    creationSequence: record.creationSequence,
    content: content.value,
    createdAt: asIsoTimestamp(record.createdAt),
    originatingCommandId: record.originatingCommandId as CommandId,
  });
};
