import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  DocumentId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import {
  isDocumentContentType,
  isDocumentLifecycleState,
} from "../simulation/run/document";
import {
  DOCUMENTS_PROJECTION_SCHEMA_VERSION,
  DOCUMENTS_PROJECTION_TYPE,
  type DocumentsCapabilities,
  type DocumentsItem,
  type DocumentsProjection,
  type DocumentsSummary,
} from "./documents-contracts";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseCapabilities = (
  value: unknown,
): Result<DocumentsCapabilities, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    value.upload !== "unsupported" ||
    value.edit !== "unsupported" ||
    value.comment !== "unsupported"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Documents capabilities must mark upload/edit/comment as unsupported.",
      ),
    );
  }
  return ok({
    upload: "unsupported",
    edit: "unsupported",
    comment: "unsupported",
  });
};

const parseDocumentItem = (
  value: unknown,
): Result<DocumentsItem, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.documentId !== "string" ||
    value.documentId.trim().length === 0 ||
    typeof value.documentDefinitionId !== "string" ||
    value.documentDefinitionId.trim().length === 0 ||
    typeof value.documentDefinitionVersion !== "string" ||
    value.documentDefinitionVersion.trim().length === 0 ||
    typeof value.creationSequence !== "number" ||
    !Number.isInteger(value.creationSequence) ||
    value.creationSequence < 1 ||
    typeof value.title !== "string" ||
    value.title.trim().length === 0 ||
    (value.category !== null && typeof value.category !== "string") ||
    (value.description !== null && typeof value.description !== "string") ||
    typeof value.contentType !== "string" ||
    !isDocumentContentType(value.contentType) ||
    typeof value.body !== "string" ||
    value.body.trim().length === 0 ||
    typeof value.status !== "string" ||
    !isDocumentLifecycleState(value.status) ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Documents item is invalid.",
      ),
    );
  }

  for (const forbidden of [
    "originatingCommandId",
    "causationId",
    "correlationId",
    "aggregateVersion",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Documents item must not include hidden field '${forbidden}'.`,
        ),
      );
    }
  }

  return ok({
    documentId: value.documentId as DocumentId,
    documentDefinitionId: value.documentDefinitionId as DocumentId,
    documentDefinitionVersion: value.documentDefinitionVersion,
    creationSequence: value.creationSequence,
    title: value.title,
    category: value.category as string | null,
    description: value.description as string | null,
    contentType: value.contentType,
    body: value.body,
    status: value.status,
    createdAt: value.createdAt as IsoTimestamp,
  });
};

const parseSummary = (
  value: unknown,
  documentsLength: number,
): Result<DocumentsSummary, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.totalDocuments !== "number" ||
    !Number.isInteger(value.totalDocuments) ||
    value.totalDocuments < 0 ||
    typeof value.isEmpty !== "boolean"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Documents summary is invalid.",
      ),
    );
  }
  if (value.totalDocuments !== documentsLength) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Documents summary.totalDocuments must equal documents length.",
      ),
    );
  }
  if (value.isEmpty !== (documentsLength === 0)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Documents summary.isEmpty must match empty documents.",
      ),
    );
  }
  return ok({
    totalDocuments: value.totalDocuments,
    isEmpty: value.isEmpty,
  });
};

/**
 * Validate persisted Documents JSON before returning it as a typed contract.
 */
export const parseDocumentsProjection = (
  value: unknown,
): Result<DocumentsProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== DOCUMENTS_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (value.projectionSchemaVersion !== DOCUMENTS_PROJECTION_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Documents schema version '${String(value.projectionSchemaVersion)}'.`,
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
    !Array.isArray(value.documents)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Documents payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Documents semanticHash is invalid.",
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

  const capabilities = parseCapabilities(value.capabilities);
  if (!capabilities.ok) {
    return capabilities;
  }

  const documents: DocumentsItem[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.documents) {
    const parsed = parseDocumentItem(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenIds.has(parsed.value.documentId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Documents items must have unique documentId values.",
        ),
      );
    }
    seenIds.add(parsed.value.documentId);
    documents.push(parsed.value);
  }

  for (let index = 1; index < documents.length; index += 1) {
    const previous = documents[index - 1]!;
    const current = documents[index]!;
    if (current.creationSequence < previous.creationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Documents must be ordered ascending by creationSequence.",
        ),
      );
    }
  }

  const summary = parseSummary(value.summary, documents.length);
  if (!summary.ok) {
    return summary;
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: DOCUMENTS_PROJECTION_TYPE,
    projectionSchemaVersion: DOCUMENTS_PROJECTION_SCHEMA_VERSION,
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
    documents,
    summary: summary.value,
    capabilities: capabilities.value,
  });
};

export const serializeDocumentsProjection = (
  projection: DocumentsProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
