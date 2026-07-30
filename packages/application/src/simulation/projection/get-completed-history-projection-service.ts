import {
  COMPLETED_HISTORY_PROJECTION_TYPE,
  compareProjectionSourcePosition,
  getThrownDomainError,
  isCompletedHistoryProjection,
  ruleViolationError,
  type ActorId,
  type CausationId,
  type CommandError,
  type CompletedHistoryProjection,
  type CorrelationId,
  type Result,
  type SimulationRunId,
  type TenantId,
  err,
  ok,
} from "@projectsim/domain";
import type { SimulationRunRepository } from "../simulation-run-repository";
import type { ProjectionFreshness } from "./get-simulation-projection-service";
import type { SimulationProjectionAuthorizer } from "./projection-authorizer";
import type { RebuildCompletedHistoryProjectionService } from "./rebuild-completed-history-projection-service";
import type { SimulationProjectionRepository } from "./simulation-projection-repository";

export interface GetCompletedHistoryProjectionInput {
  readonly simulationRunId: SimulationRunId;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
}

export interface GetCompletedHistoryProjectionResult {
  readonly projection: CompletedHistoryProjection;
  readonly freshness: ProjectionFreshness;
}

export interface GetCompletedHistoryProjectionServiceDeps {
  readonly tenantId: TenantId;
  readonly authorizer: SimulationProjectionAuthorizer;
  readonly runRepository: SimulationRunRepository;
  readonly projectionRepository: SimulationProjectionRepository;
  readonly rebuildService: RebuildCompletedHistoryProjectionService;
}

/**
 * Application query: get learner-facing Completed History projection.
 * Binds projection type `completed_history` internally. Missing/stale -> sync rebuild.
 * Side-effect free for authoritative state (no Activity mutation).
 */
export interface GetCompletedHistoryProjectionService {
  get(
    input: GetCompletedHistoryProjectionInput,
  ): Promise<Result<GetCompletedHistoryProjectionResult, CommandError>>;
}

export const createGetCompletedHistoryProjectionService = (
  deps: GetCompletedHistoryProjectionServiceDeps,
): GetCompletedHistoryProjectionService => ({
  async get(input) {
    const authorization = await deps.authorizer.authorizeView({
      actorId: input.actorId,
      simulationRunId: input.simulationRunId,
    });
    if (!authorization.ok) {
      return err(authorization.error);
    }

    let run;
    try {
      run = await deps.runRepository.getById(
        deps.tenantId,
        input.simulationRunId,
      );
    } catch (error) {
      const domainError = getThrownDomainError(error);
      if (domainError) {
        return err(domainError);
      }
      throw error;
    }
    if (!run) {
      return err(
        ruleViolationError(
          "SIMULATION_RUN_NOT_FOUND",
          `SimulationRun '${input.simulationRunId}' was not found.`,
        ),
      );
    }
    if (run.tenantId !== deps.tenantId) {
      return err({
        kind: "authorization",
        code: "TENANT_ACCESS_DENIED",
        retryable: false,
        message: "SimulationRun tenant does not match the session tenant.",
      });
    }

    let cachedRow;
    try {
      cachedRow = await deps.projectionRepository.get(
        deps.tenantId,
        input.simulationRunId,
        COMPLETED_HISTORY_PROJECTION_TYPE,
      );
    } catch (error) {
      const domainError = getThrownDomainError(error);
      if (domainError) {
        return err(domainError);
      }
      throw error;
    }

    const cached =
      cachedRow && isCompletedHistoryProjection(cachedRow) ? cachedRow : null;

    const source = {
      sourceAggregateVersion: run.aggregateVersion,
      sourceStateVersion: run.state.stateVersion,
      sourceActionSequence: run.lastProcessedSequence,
    };

    if (cached) {
      const relation = compareProjectionSourcePosition(cached, source);
      if (relation === "equal") {
        return ok({ projection: cached, freshness: "current" });
      }
      if (relation === "newer") {
        return err(
          ruleViolationError(
            "PROJECTION_SOURCE_INVALID",
            "Cached Completed History projection source is ahead of the authoritative SimulationRun.",
          ),
        );
      }
    }

    const rebuilt = await deps.rebuildService.rebuild({
      simulationRunId: input.simulationRunId,
      correlationId: input.correlationId,
      causationId: input.causationId,
      actorId: input.actorId,
    });
    if (!rebuilt.ok) {
      if (cached) {
        return ok({ projection: cached, freshness: "rebuild_failed" });
      }
      return err(rebuilt.error);
    }
    return ok({
      projection: rebuilt.value.projection,
      freshness: "current",
    });
  },
});
