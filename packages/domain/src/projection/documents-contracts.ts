import type {
  ContentPackageVersionId,
  DocumentId,
  EventId,
  LearnerId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type {
  DocumentContentType,
  DocumentLifecycleState,
} from "../simulation/run/document";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Canonical learner-facing Documents projection (PS-ROADMAP-020).
 *
 * Derived, read-only, rebuildable. Never authoritative business state.
 * Authoritative source: SimulationState.documents (schema v6 / PS-020).
 */

export const DOCUMENTS_PROJECTION_TYPE =
  "documents" as const satisfies WorkplaceProjectionType;
export const DOCUMENTS_PROJECTION_SCHEMA_VERSION = 1 as const;

export type DocumentsUnsupportedCapability = "unsupported";

export interface DocumentsCapabilities {
  readonly upload: DocumentsUnsupportedCapability;
  readonly edit: DocumentsUnsupportedCapability;
  readonly comment: DocumentsUnsupportedCapability;
}

/**
 * One public Documents item per authoritative DocumentRuntime.
 *
 * Identity: DocumentId. Ordering: creationSequence ascending.
 */
export interface DocumentsItem {
  readonly documentId: DocumentId;
  readonly documentDefinitionId: DocumentId;
  readonly documentDefinitionVersion: string;
  readonly creationSequence: number;
  readonly title: string;
  readonly category: string | null;
  readonly description: string | null;
  readonly contentType: DocumentContentType;
  readonly body: string;
  readonly status: DocumentLifecycleState;
  readonly createdAt: IsoTimestamp;
}

export interface DocumentsSummary {
  readonly totalDocuments: number;
  readonly isEmpty: boolean;
}

export interface DocumentsProjection {
  readonly projectionId: SimulationProjectionId;
  readonly projectionType: typeof DOCUMENTS_PROJECTION_TYPE;
  readonly projectionSchemaVersion: typeof DOCUMENTS_PROJECTION_SCHEMA_VERSION;

  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly learnerId: LearnerId;
  readonly contentPackageVersionId: ContentPackageVersionId;

  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  readonly sourceActionSequence: number;
  readonly sourceEventId: EventId | null;

  readonly generatedAt: IsoTimestamp;
  readonly semanticHash: ProjectionHash;

  /** Authoritative creationSequence ascending. */
  readonly documents: readonly DocumentsItem[];
  readonly summary: DocumentsSummary;
  readonly capabilities: DocumentsCapabilities;
}

export type { DocumentContentType, DocumentLifecycleState };
