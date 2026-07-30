import {
  evaluateProjectionSave,
  parseWorkplaceProjection,
  serializeWorkplaceProjection,
  type DomainEventPublisher,
  type SimulationRunId,
  type TenantId,
  type WorkplaceProjection,
  type WorkplaceProjectionType,
  err,
  ok,
} from "@projectsim/domain";
import type {
  ProjectionSaveResult,
  SimulationProjectionRepository,
} from "@projectsim/application";
import { resolveSimulationProjectionType } from "@projectsim/application";

export const createInMemorySimulationProjectionRepository = (options?: {
  readonly eventPublisher?: DomainEventPublisher;
}): SimulationProjectionRepository & {
  readonly rows: Map<string, WorkplaceProjection>;
} => {
  const rows = new Map<string, WorkplaceProjection>();
  const key = (
    tenantId: TenantId,
    runId: SimulationRunId,
    projectionType: WorkplaceProjectionType,
  ) => `${tenantId}:${runId}:${projectionType}`;

  return {
    rows,
    async get(tenantId, simulationRunId, projectionType) {
      const type = resolveSimulationProjectionType(projectionType);
      return rows.get(key(tenantId, simulationRunId, type)) ?? null;
    },
    async saveIfNewer(projection, pendingProjectionEvents = []) {
      const parsed = parseWorkplaceProjection(
        serializeWorkplaceProjection(projection),
      );
      if (!parsed.ok) {
        return err(parsed.error);
      }
      const mapKey = key(
        projection.tenantId,
        projection.simulationRunId,
        projection.projectionType,
      );
      const existing = rows.get(mapKey);
      const decision = evaluateProjectionSave(
        existing
          ? {
              sourceAggregateVersion: existing.sourceAggregateVersion,
              sourceStateVersion: existing.sourceStateVersion,
              sourceActionSequence: existing.sourceActionSequence,
              semanticHash: existing.semanticHash,
            }
          : null,
        {
          sourceAggregateVersion: parsed.value.sourceAggregateVersion,
          sourceStateVersion: parsed.value.sourceStateVersion,
          sourceActionSequence: parsed.value.sourceActionSequence,
          semanticHash: parsed.value.semanticHash,
        },
      );
      if (!decision.ok) {
        return err(decision.error);
      }
      if (decision.value.kind === "unchanged") {
        return ok({ kind: "unchanged" } satisfies ProjectionSaveResult);
      }
      rows.set(mapKey, parsed.value);
      if (pendingProjectionEvents.length > 0 && options?.eventPublisher) {
        await options.eventPublisher.publish(pendingProjectionEvents);
      }
      return ok({
        kind: decision.value.kind === "insert" ? "inserted" : "replaced",
      } satisfies ProjectionSaveResult);
    },
    async delete(tenantId, simulationRunId, projectionType) {
      const type = resolveSimulationProjectionType(projectionType);
      rows.delete(key(tenantId, simulationRunId, type));
      return ok(undefined);
    },
  };
};
