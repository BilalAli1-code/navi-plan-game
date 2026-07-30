import { asId, type Brand, type Id } from "../shared-kernel/ids";
import type { WorkplaceProjectionType } from "./workplace-types";

/** Projection Context identifiers (not shared-kernel business IDs). */

export type SimulationProjectionId = Id<"SimulationProjectionId">;
export type ProjectionHash = Brand<string, "ProjectionHash">;

export const asSimulationProjectionId = (
  value: string,
): SimulationProjectionId => asId(value);

export const asProjectionHash = (value: string): ProjectionHash =>
  value as ProjectionHash;

/** Stable projection identity: projection:{type}:{tenantId}:{simulationRunId} */
export const deriveProjectionId = (input: {
  readonly projectionType: WorkplaceProjectionType;
  readonly tenantId: string;
  readonly simulationRunId: string;
}): string =>
  `projection:${input.projectionType}:${input.tenantId}:${input.simulationRunId}`;

export const deriveSimulationProjectionId = (input: {
  readonly tenantId: string;
  readonly simulationRunId: string;
}): SimulationProjectionId =>
  asSimulationProjectionId(
    deriveProjectionId({
      projectionType: "simulation",
      tenantId: input.tenantId,
      simulationRunId: input.simulationRunId,
    }),
  );
