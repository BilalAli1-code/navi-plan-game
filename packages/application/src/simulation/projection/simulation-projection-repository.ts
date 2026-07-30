import type {
  CommandError,
  ProjectionDomainEvent,
  Result,
  SimulationRunId,
  TenantId,
  WorkplaceProjection,
  WorkplaceProjectionType,
} from "@projectsim/domain";
import { SIMULATION_PROJECTION_TYPE } from "@projectsim/domain";

export type ProjectionSaveResult =
  | { readonly kind: "inserted" }
  | { readonly kind: "replaced" }
  | { readonly kind: "unchanged" };

/**
 * Derived-cache projection repository. Contains no business rules.
 * Persistence is outside the authoritative SimulationRun transaction.
 *
 * Identity includes projectionType (ADR-006). The simulation facade defaults
 * get/delete to `simulation` for Decision-slice callers.
 *
 * Rows are type-keyed WorkplaceProjection values (`simulation` and
 * `mission_control` today).
 */
export interface SimulationProjectionRepository {
  get(
    tenantId: TenantId,
    simulationRunId: SimulationRunId,
    projectionType?: WorkplaceProjectionType,
  ): Promise<WorkplaceProjection | null>;

  saveIfNewer(
    projection: WorkplaceProjection,
    pendingProjectionEvents?: readonly ProjectionDomainEvent[],
  ): Promise<Result<ProjectionSaveResult, CommandError>>;

  delete(
    tenantId: TenantId,
    simulationRunId: SimulationRunId,
    projectionType?: WorkplaceProjectionType,
  ): Promise<Result<void, CommandError>>;
}

export const resolveSimulationProjectionType = (
  projectionType?: WorkplaceProjectionType,
): WorkplaceProjectionType => projectionType ?? SIMULATION_PROJECTION_TYPE;
