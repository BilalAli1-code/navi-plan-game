import {
  asActorId,
  asCausationId,
  asCorrelationId,
  asSimulationRunId,
  isWorkplaceProjectionType,
  ruleViolationError,
  validationError,
  type ActorId,
  type CommandError,
  type Result,
  type SimulationRunId,
  type TenantId,
  type WorkplaceProjectionType,
  err,
  ok,
} from "@projectsim/domain";
import type {
  ProjectionProcessingTarget,
  ProjectionProcessingTargetRepository,
  ProjectionTargetQueueSummary,
} from "./projection-processing-target";
import type { WorkplaceProjectionRegistry } from "./workplace-projection-registry";

export const PROJECTION_OPS_CAPABILITY = "simulation.projection.ops" as const;

export interface ProjectionOpsActor {
  readonly actorId: ActorId;
  readonly tenantId: TenantId;
  readonly capabilities: readonly string[];
}

export interface ProjectionOpsAuthorizer {
  authorize(actor: ProjectionOpsActor): Promise<Result<void, CommandError>>;
}

export const createCapabilityProjectionOpsAuthorizer =
  (): ProjectionOpsAuthorizer => ({
    async authorize(actor) {
      if (!actor.capabilities.includes(PROJECTION_OPS_CAPABILITY)) {
        return err({
          kind: "authorization" as const,
          code: "PERMISSION_DENIED" as const,
          retryable: false as const,
          message: "Missing simulation.projection.ops capability.",
        });
      }
      return ok(undefined);
    },
  });

export type ProjectionRebuildOpResult = {
  readonly projectionType: WorkplaceProjectionType;
  readonly result: "rebuilt" | "already_current" | "failed";
  readonly saveResult?: "inserted" | "replaced" | "unchanged";
  readonly errorCode?: string;
  readonly durationMs: number;
};

export interface ProjectionOperationsService {
  getQueueSummary(
    actor: ProjectionOpsActor,
  ): Promise<Result<ProjectionTargetQueueSummary, CommandError>>;
  listFailedTargets(
    actor: ProjectionOpsActor,
    input: {
      readonly limit: number;
      readonly offset: number;
      readonly simulationRunId?: string;
      readonly projectionType?: string;
    },
  ): Promise<Result<readonly ProjectionProcessingTarget[], CommandError>>;
  getFailedTarget(
    actor: ProjectionOpsActor,
    eventId: string,
    projectionType: string,
  ): Promise<Result<ProjectionProcessingTarget, CommandError>>;
  rebuildOne(
    actor: ProjectionOpsActor,
    input: {
      readonly simulationRunId: string;
      readonly projectionType: string;
      readonly correlationId: string;
    },
  ): Promise<Result<ProjectionRebuildOpResult, CommandError>>;
  rebuildAllForRun(
    actor: ProjectionOpsActor,
    input: {
      readonly simulationRunId: string;
      readonly correlationId: string;
    },
  ): Promise<
    Result<
      {
        readonly results: readonly ProjectionRebuildOpResult[];
        readonly aggregate: "success" | "partial" | "failure";
      },
      CommandError
    >
  >;
  retryFailedTarget(
    actor: ProjectionOpsActor,
    input: {
      readonly eventId: string;
      readonly projectionType: string;
    },
  ): Promise<
    Result<
      {
        readonly eventId: string;
        readonly projectionType: WorkplaceProjectionType;
        readonly priorStatus: string | null;
        readonly newStatus: "retrying";
        readonly scheduledAt: string;
      },
      CommandError
    >
  >;
  /**
   * Replay = reset a retained target to retrying so the worker reprocesses it.
   * Does not mutate authoritative Domain state. Requires the target row.
   */
  replayTarget(
    actor: ProjectionOpsActor,
    input: {
      readonly eventId: string;
      readonly projectionType: string;
    },
  ): Promise<
    Result<
      {
        readonly eventId: string;
        readonly projectionType: WorkplaceProjectionType;
        readonly newStatus: "retrying";
        readonly scheduledAt: string;
      },
      CommandError
    >
  >;
  getProjectionStatus(
    actor: ProjectionOpsActor,
    input: {
      readonly simulationRunId: string;
      readonly projectionType?: string;
    },
  ): Promise<
    Result<
      {
        readonly simulationRunId: string;
        readonly queue: ProjectionTargetQueueSummary;
      },
      CommandError
    >
  >;
}

export interface ProjectionOperationsServiceDeps {
  readonly tenantId: TenantId;
  readonly authorizer: ProjectionOpsAuthorizer;
  readonly registry: WorkplaceProjectionRegistry;
  readonly targets: ProjectionProcessingTargetRepository;
  readonly now: () => Date;
  readonly log?: (event: string, fields: Record<string, unknown>) => void;
}

export const createProjectionOperationsService = (
  deps: ProjectionOperationsServiceDeps,
): ProjectionOperationsService => {
  const log = deps.log ?? (() => undefined);

  const ensureActor = async (
    actor: ProjectionOpsActor,
  ): Promise<Result<void, CommandError>> => {
    if (actor.tenantId !== deps.tenantId) {
      return err({
        kind: "authorization" as const,
        code: "TENANT_ACCESS_DENIED" as const,
        retryable: false as const,
        message: "Tenant mismatch.",
      });
    }
    return deps.authorizer.authorize(actor);
  };

  const parseType = (
    value: string,
  ): Result<WorkplaceProjectionType, CommandError> => {
    if (!isWorkplaceProjectionType(value)) {
      return err(
        validationError(
          [
            {
              path: "projectionType",
              reason: "invalid",
              message: `Unknown projection type: ${value}`,
            },
          ],
          `Unknown projection type: ${value}`,
        ),
      );
    }
    if (!deps.registry.handlerFor(value)) {
      return err(
        validationError(
          [
            {
              path: "projectionType",
              reason: "unregistered",
              message: `Projection type is not registered: ${value}`,
            },
          ],
          `Projection type is not registered: ${value}`,
        ),
      );
    }
    return ok(value);
  };

  const rebuildType = async (
    simulationRunId: SimulationRunId,
    projectionType: WorkplaceProjectionType,
    correlationId: string,
    actorId: ActorId,
  ): Promise<ProjectionRebuildOpResult> => {
    const started = deps.now().getTime();
    const handler = deps.registry.handlerFor(projectionType);
    if (!handler) {
      return {
        projectionType,
        result: "failed",
        errorCode: "missing_registration",
        durationMs: deps.now().getTime() - started,
      };
    }
    const result = await handler.rebuild({
      simulationRunId,
      correlationId: asCorrelationId(correlationId),
      causationId: asCausationId(`ops-rebuild:${correlationId}`),
      actorId,
      sourceEventType: "ProjectionOpsRebuild",
    });
    const durationMs = deps.now().getTime() - started;
    if (!result.ok) {
      return {
        projectionType,
        result: "failed",
        errorCode: "rebuild_failed",
        durationMs,
      };
    }
    return {
      projectionType,
      result: "rebuilt",
      durationMs,
    };
  };

  return {
    async getQueueSummary(actor) {
      const auth = await ensureActor(actor);
      if (!auth.ok) return auth;
      return ok(await deps.targets.queueSummary());
    },
    async listFailedTargets(actor, input) {
      const auth = await ensureActor(actor);
      if (!auth.ok) return auth;
      let projectionType: WorkplaceProjectionType | undefined;
      if (input.projectionType !== undefined) {
        const parsed = parseType(input.projectionType);
        if (!parsed.ok) return parsed;
        projectionType = parsed.value;
      }
      const limit = Math.min(Math.max(input.limit, 1), 100);
      const offset = Math.max(input.offset, 0);
      return ok(
        await deps.targets.listFailedTargets({
          limit,
          offset,
          ...(input.simulationRunId
            ? { simulationRunId: input.simulationRunId }
            : {}),
          ...(projectionType ? { projectionType } : {}),
        }),
      );
    },
    async getFailedTarget(actor, eventId, projectionTypeRaw) {
      const auth = await ensureActor(actor);
      if (!auth.ok) return auth;
      const parsed = parseType(projectionTypeRaw);
      if (!parsed.ok) return parsed;
      const target = await deps.targets.getTarget(eventId, parsed.value);
      if (
        !target ||
        (target.status !== "exhausted" && target.status !== "retrying")
      ) {
        return err(
          ruleViolationError(
            "PROJECTION_PROCESSING_TARGET_NOT_FOUND",
            "Failed processing target not found.",
          ),
        );
      }
      return ok(target);
    },
    async rebuildOne(actor, input) {
      const auth = await ensureActor(actor);
      if (!auth.ok) return auth;
      const parsed = parseType(input.projectionType);
      if (!parsed.ok) return parsed;
      const runId = asSimulationRunId(input.simulationRunId);
      log("projection.ops.rebuild", {
        actorId: actor.actorId,
        simulationRunId: input.simulationRunId,
        projectionType: parsed.value,
      });
      return ok(
        await rebuildType(
          runId,
          parsed.value,
          input.correlationId,
          asActorId(actor.actorId),
        ),
      );
    },
    async rebuildAllForRun(actor, input) {
      const auth = await ensureActor(actor);
      if (!auth.ok) return auth;
      const runId = asSimulationRunId(input.simulationRunId);
      log("projection.ops.rebuild_all", {
        actorId: actor.actorId,
        simulationRunId: input.simulationRunId,
      });
      const results: ProjectionRebuildOpResult[] = [];
      for (const projectionType of deps.registry.registeredTypes) {
        results.push(
          await rebuildType(
            runId,
            projectionType,
            `${input.correlationId}:${projectionType}`,
            asActorId(actor.actorId),
          ),
        );
      }
      const failed = results.filter((r) => r.result === "failed").length;
      const aggregate =
        failed === 0
          ? "success"
          : failed === results.length
            ? "failure"
            : "partial";
      return ok({ results, aggregate });
    },
    async retryFailedTarget(actor, input) {
      const auth = await ensureActor(actor);
      if (!auth.ok) return auth;
      const parsed = parseType(input.projectionType);
      if (!parsed.ok) return parsed;
      const now = deps.now();
      const result = await deps.targets.manualRetry({
        eventId: input.eventId,
        projectionType: parsed.value,
        now,
      });
      if (!result.ok) {
        return err(
          ruleViolationError(
            "PROJECTION_PROCESSING_TARGET_NOT_FOUND",
            "Processing target not found or not retryable.",
          ),
        );
      }
      log("projection.ops.retry", {
        actorId: actor.actorId,
        eventId: input.eventId,
        projectionType: parsed.value,
        priorStatus: result.priorStatus,
      });
      return ok({
        eventId: input.eventId,
        projectionType: parsed.value,
        priorStatus: result.priorStatus,
        newStatus: "retrying" as const,
        scheduledAt: now.toISOString(),
      });
    },
    async replayTarget(actor, input) {
      return this.retryFailedTarget(actor, input).then((result) => {
        if (!result.ok) return result;
        return ok({
          eventId: result.value.eventId,
          projectionType: result.value.projectionType,
          newStatus: "retrying" as const,
          scheduledAt: result.value.scheduledAt,
        });
      });
    },
    async getProjectionStatus(actor, input) {
      const auth = await ensureActor(actor);
      if (!auth.ok) return auth;
      let projectionType: WorkplaceProjectionType | undefined;
      if (input.projectionType !== undefined) {
        const parsed = parseType(input.projectionType);
        if (!parsed.ok) return parsed;
        projectionType = parsed.value;
      }
      const queue = await deps.targets.countByStatusForRun({
        simulationRunId: input.simulationRunId,
        ...(projectionType ? { projectionType } : {}),
      });
      return ok({
        simulationRunId: input.simulationRunId,
        queue,
      });
    },
  };
};
