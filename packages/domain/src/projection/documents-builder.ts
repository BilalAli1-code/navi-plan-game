import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { DocumentRuntime } from "../simulation/run/document";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  DOCUMENTS_PROJECTION_SCHEMA_VERSION,
  DOCUMENTS_PROJECTION_TYPE,
  type DocumentsCapabilities,
  type DocumentsItem,
  type DocumentsProjection,
  type DocumentsSummary,
} from "./documents-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildDocumentsProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const UNSUPPORTED_CAPABILITIES: DocumentsCapabilities = {
  upload: "unsupported",
  edit: "unsupported",
  comment: "unsupported",
};

const toDocumentsItem = (document: DocumentRuntime): DocumentsItem => ({
  documentId: document.documentId,
  documentDefinitionId: document.documentDefinitionId,
  documentDefinitionVersion: document.documentDefinitionVersion,
  creationSequence: document.creationSequence,
  title: document.content.title,
  category: document.content.category,
  description: document.content.description,
  contentType: document.content.contentType,
  body: document.content.body,
  status: document.status,
  createdAt: document.createdAt,
});

const summarize = (documents: readonly DocumentsItem[]): DocumentsSummary => ({
  totalDocuments: documents.length,
  isEmpty: documents.length === 0,
});

/**
 * Pure Documents projection builder (PS-ROADMAP-020).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, renderer, sanitizer,
 * repository access, aggregate mutation, or browser lifecycle inference.
 *
 * Source of truth: authoritative SimulationRun snapshot `documents`.
 * Ordering: creationSequence ascending; stable tie-break by DocumentId.
 */
export const buildDocumentsProjection = (
  input: BuildDocumentsProjectionInput,
): Result<DocumentsProjection, RuleViolationError> => {
  const { snapshot, generatedAt } = input;
  const runtimes = snapshot.documents;

  const seenIds = new Set<string>();
  for (const document of runtimes) {
    if (seenIds.has(document.documentId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Documents source contains duplicate Document IDs.",
          { documentId: document.documentId },
        ),
      );
    }
    seenIds.add(document.documentId);
  }

  const ordered = [...runtimes].sort((a, b) => {
    if (a.creationSequence !== b.creationSequence) {
      return a.creationSequence - b.creationSequence;
    }
    return a.documentId.localeCompare(b.documentId);
  });

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!;
    const current = ordered[index]!;
    if (current.creationSequence <= previous.creationSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Document creationSequence values must be unique and strictly increasing.",
        ),
      );
    }
  }

  const documents = ordered.map(toDocumentsItem);

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: DOCUMENTS_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: DOCUMENTS_PROJECTION_TYPE,
    projectionSchemaVersion: DOCUMENTS_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    documents,
    summary: summarize(documents),
    capabilities: UNSUPPORTED_CAPABILITIES,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeDocumentsSemanticHash(withoutHash),
  });
};

export type SemanticDocumentsInput = Omit<
  DocumentsProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticDocumentsPayload = (
  projection: SemanticDocumentsInput,
): Readonly<Record<string, unknown>> => ({
  projectionId: projection.projectionId,
  projectionType: projection.projectionType,
  projectionSchemaVersion: projection.projectionSchemaVersion,
  tenantId: projection.tenantId,
  simulationRunId: projection.simulationRunId,
  learnerId: projection.learnerId,
  contentPackageVersionId: projection.contentPackageVersionId,
  sourceAggregateVersion: projection.sourceAggregateVersion,
  sourceStateVersion: projection.sourceStateVersion,
  sourceActionSequence: projection.sourceActionSequence,
  documents: projection.documents,
  summary: projection.summary,
  capabilities: projection.capabilities,
});

export const computeDocumentsSemanticHash = (
  projection: SemanticDocumentsInput,
) => computeSemanticHashFromStableValue(semanticDocumentsPayload(projection));
