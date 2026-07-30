import {
  asActorId,
  asBusinessCaseId,
  asContentPackageVersionId,
  asCorrelationId,
  asLearnerId,
  asSimulationRunId,
} from "@projectsim/domain";
import type { SimulationModuleRegistry } from "../module-registry";

export interface SeedDemoRunInput {
  readonly tenantId: string;
  readonly actorId: string;
  readonly simulationRunId: string;
  readonly learnerId?: string;
  readonly businessCaseId?: string;
  readonly contentPackageVersionId?: string;
  readonly correlationId?: string;
}

/** Create + start an active SimulationRun for local Decision UI demos/tests. */
export const seedDemoSimulationRun = async (
  registry: SimulationModuleRegistry,
  input: SeedDemoRunInput,
): Promise<
  { readonly ok: true } | { readonly ok: false; readonly message: string }
> => {
  const services = registry.get(input.tenantId);
  const contentPackageVersionId = asContentPackageVersionId(
    input.contentPackageVersionId ?? "cpv_1",
  );
  const simulationRunId = asSimulationRunId(input.simulationRunId);
  const actorId = asActorId(input.actorId);
  const correlationId = asCorrelationId(
    input.correlationId ?? `corr_seed_${input.simulationRunId}`,
  );

  const existing = await services.lifecycleService.load(
    actorId,
    simulationRunId,
  );
  if (existing.ok) {
    if (existing.value.status === "active") {
      return { ok: true };
    }
    if (existing.value.status === "created") {
      const started = await services.lifecycleService.start({
        actorId,
        simulationRunId,
        correlationId,
        causationId: null,
        expectedAggregateVersion: null,
      });
      if (!started.ok) {
        return { ok: false, message: started.error.message };
      }
      return { ok: true };
    }
    return {
      ok: false,
      message: `SimulationRun '${input.simulationRunId}' exists with status '${existing.value.status}'.`,
    };
  }

  const created = await services.lifecycleService.create({
    actorId,
    learnerId: asLearnerId(input.learnerId ?? "learner_1"),
    businessCaseId: asBusinessCaseId(input.businessCaseId ?? "case_1"),
    contentPackageVersionId,
    runtimeVersion: "runtime-1",
    correlationId,
    causationId: null,
    simulationRunId,
  });
  if (!created.ok) {
    return { ok: false, message: created.error.message };
  }

  const started = await services.lifecycleService.start({
    actorId,
    simulationRunId,
    correlationId,
    causationId: null,
    expectedAggregateVersion: null,
  });
  if (!started.ok) {
    return { ok: false, message: started.error.message };
  }
  return { ok: true };
};

/**
 * Dev HTTP seed routes are opt-in only.
 * Default is disabled — production must never expose this surface.
 */
export const devRoutesEnabled = (): boolean =>
  process.env.PROJECTSIM_ENABLE_DEV_ROUTES === "1";
