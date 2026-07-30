import type { EventId, SimulationRunId, TenantId } from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ProjectionHash } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/**
 * Shared workplace projection envelope fields (ADR-006 topology A3).
 *
 * Typed payloads are selected by `projectionType`. The executable
 * `SimulationProjection` remains envelope-compatible with a flat payload
 * (run/project/availableDecisions/decisionHistory at the root). Nested
 * `payload` shaping for new types is allowed; flattening simulation is not
 * required by PS-ROADMAP-010.
 */

export interface WorkplaceProjectionEnvelopeFields {
  readonly projectionId: string;
  readonly projectionType: WorkplaceProjectionType;
  readonly projectionSchemaVersion: number;

  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;

  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  /** Null only for future types that have no action-sequence source. */
  readonly sourceActionSequence: number | null;
  /** Provenance only — not a recency cursor; excluded from semantic hash. */
  readonly sourceEventId: EventId | null;

  readonly semanticHash: ProjectionHash;
  readonly generatedAt: IsoTimestamp;
}

/**
 * Generic envelope with nested payload for future workplace types.
 * Simulation continues to use the flat `SimulationProjection` shape.
 */
export interface WorkplaceProjectionEnvelope<
  TProjectionType extends WorkplaceProjectionType,
  TPayload,
> extends WorkplaceProjectionEnvelopeFields {
  readonly projectionType: TProjectionType;
  readonly payload: TPayload;
}

export const envelopeSourcePosition = (
  envelope: Pick<
    WorkplaceProjectionEnvelopeFields,
    "sourceAggregateVersion" | "sourceStateVersion" | "sourceActionSequence"
  >,
): {
  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  readonly sourceActionSequence: number;
} | null => {
  if (envelope.sourceActionSequence === null) {
    return null;
  }
  return {
    sourceAggregateVersion: envelope.sourceAggregateVersion,
    sourceStateVersion: envelope.sourceStateVersion,
    sourceActionSequence: envelope.sourceActionSequence,
  };
};
