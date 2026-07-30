import {
  archiveSimulationRun,
  completeSimulationRun,
  createSimulationRun,
  getThrownDomainError,
  pauseSimulationRun,
  recordSimulationRunFailure,
  recoverSimulationRun,
  resumeSimulationRun,
  ruleViolationError,
  startSimulationRun,
  type ActorId,
  type BusinessCaseId,
  type CausationId,
  type ChapterId,
  type CommandError,
  type ContentPackageVersionId,
  type CorrelationId,
  type DayId,
  type ExperienceLevel,
  type LearnerId,
  type ProjectMetrics,
  type Result,
  type SimulationRun,
  type SimulationRunId,
  type SimulationRunLifecycleEvent,
  type TenantId,
  err,
  ok,
} from "@projectsim/domain";
import type { Clock, IdentifierGenerator } from "./ports";
import type { SimulationRunRepository } from "./simulation-run-repository";

/**
 * Authorization for lifecycle operations. Reuses approved capabilities only:
 * `simulation.run.view` (load) and `simulation.run.start` (mutating lifecycle).
 * Pause/resume/complete/fail/archive/recover capability names are not in the
 * approved auth model — gap reported in the PR; mutations use `.start`.
 */
export interface SimulationRunLifecycleAuthorizer {
  authorize(
    operation: SimulationRunLifecycleOperation,
    actorId: ActorId,
  ): Promise<Result<void, CommandError>>;
}

export type SimulationRunLifecycleOperation =
  | "create"
  | "load"
  | "start"
  | "pause"
  | "resume"
  | "complete"
  | "fail"
  | "recover"
  | "archive";

export interface SimulationRunLifecycleServiceDeps {
  readonly tenantId: TenantId;
  readonly repository: SimulationRunRepository;
  readonly clock: Clock;
  readonly identifiers: IdentifierGenerator;
  readonly authorizer: SimulationRunLifecycleAuthorizer;
}

export interface CreateSimulationRunRequest {
  readonly actorId: ActorId;
  readonly learnerId: LearnerId;
  readonly businessCaseId: BusinessCaseId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly experienceLevel?: ExperienceLevel | null;
  readonly runtimeVersion: string;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly currentChapterId?: ChapterId | null;
  readonly currentDayId?: DayId | null;
  readonly simulationRunId?: SimulationRunId;
  readonly initialProjectMetrics?: ProjectMetrics;
}

export interface LifecycleRunRequest {
  readonly actorId: ActorId;
  readonly simulationRunId: SimulationRunId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly expectedAggregateVersion: number | null;
}

export interface SimulationRunLifecycleResult {
  readonly run: SimulationRun;
  readonly events: readonly SimulationRunLifecycleEvent[];
}

export interface SimulationRunLifecycleService {
  create(
    request: CreateSimulationRunRequest,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>>;
  load(
    actorId: ActorId,
    simulationRunId: SimulationRunId,
  ): Promise<Result<SimulationRun, CommandError>>;
  start(
    request: LifecycleRunRequest,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>>;
  pause(
    request: LifecycleRunRequest,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>>;
  resume(
    request: LifecycleRunRequest,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>>;
  complete(
    request: LifecycleRunRequest,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>>;
  recordFailure(
    request: LifecycleRunRequest,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>>;
  recover(
    request: LifecycleRunRequest,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>>;
  archive(
    request: LifecycleRunRequest,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>>;
}

const notFound = (simulationRunId: SimulationRunId): CommandError =>
  ruleViolationError(
    "SIMULATION_RUN_NOT_FOUND",
    `SimulationRun '${simulationRunId}' was not found in this tenant.`,
  );

export const createSimulationRunLifecycleService = (
  deps: SimulationRunLifecycleServiceDeps,
): SimulationRunLifecycleService => {
  const loadAuthorized = async (
    operation: SimulationRunLifecycleOperation,
    actorId: ActorId,
    simulationRunId: SimulationRunId,
  ): Promise<Result<SimulationRun, CommandError>> => {
    const auth = await deps.authorizer.authorize(operation, actorId);
    if (!auth.ok) {
      return auth;
    }
    let run: SimulationRun | null;
    try {
      run = await deps.repository.getById(deps.tenantId, simulationRunId);
    } catch (error) {
      const domainError = getThrownDomainError(error);
      if (domainError) {
        return err(domainError);
      }
      throw error;
    }
    if (!run) {
      return err(notFound(simulationRunId));
    }
    return ok(run);
  };

  const persistTransition = async (
    previousVersion: number,
    transition: {
      readonly run: SimulationRun;
      readonly events: readonly SimulationRunLifecycleEvent[];
    },
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>> => {
    const saved = await deps.repository.save(
      deps.tenantId,
      transition.run,
      previousVersion,
      transition.events,
    );
    if (!saved.ok) {
      return saved;
    }
    return ok({ run: transition.run, events: transition.events });
  };

  const apply = async (
    operation: SimulationRunLifecycleOperation,
    request: LifecycleRunRequest,
    operate: (run: SimulationRun) => Result<
      {
        readonly run: SimulationRun;
        readonly events: readonly SimulationRunLifecycleEvent[];
      },
      CommandError
    >,
  ): Promise<Result<SimulationRunLifecycleResult, CommandError>> => {
    const loaded = await loadAuthorized(
      operation,
      request.actorId,
      request.simulationRunId,
    );
    if (!loaded.ok) {
      return loaded;
    }
    const run = loaded.value;
    if (
      request.expectedAggregateVersion !== null &&
      request.expectedAggregateVersion !== run.aggregateVersion
    ) {
      return err({
        kind: "concurrency",
        code: "AGGREGATE_VERSION_CONFLICT",
        retryable: false,
        message: `Expected aggregate version ${request.expectedAggregateVersion} but found ${run.aggregateVersion}.`,
        expectedVersion: request.expectedAggregateVersion,
        actualVersion: run.aggregateVersion,
      });
    }

    const transition = operate(run);
    if (!transition.ok) {
      return transition;
    }

    // Re-bind context timestamps/ids onto events produced by domain (domain
    // already received ctx). Domain operate closures below pass ctx.
    return persistTransition(run.aggregateVersion, transition.value);
  };

  return {
    async create(request) {
      const auth = await deps.authorizer.authorize("create", request.actorId);
      if (!auth.ok) {
        return auth;
      }
      const now = deps.clock.now();
      const created = createSimulationRun({
        id: request.simulationRunId ?? deps.identifiers.nextSimulationRunId(),
        tenantId: deps.tenantId,
        learnerId: request.learnerId,
        businessCaseId: request.businessCaseId,
        contentPackageVersionId: request.contentPackageVersionId,
        experienceLevel: request.experienceLevel ?? null,
        runtimeVersion: request.runtimeVersion,
        currentChapterId: request.currentChapterId ?? null,
        currentDayId: request.currentDayId ?? null,
        ...(request.initialProjectMetrics !== undefined
          ? { initialProjectMetrics: request.initialProjectMetrics }
          : {}),
        createdAt: now,
        eventId: deps.identifiers.nextEventId(),
        actorId: request.actorId,
        correlationId: request.correlationId,
        causationId: request.causationId,
      });
      if (!created.ok) {
        return created;
      }
      const saved = await deps.repository.save(
        deps.tenantId,
        created.value.run,
        null,
        created.value.events,
      );
      if (!saved.ok) {
        return saved;
      }
      return ok({
        run: created.value.run,
        events: created.value.events,
      });
    },

    async load(actorId, simulationRunId) {
      return loadAuthorized("load", actorId, simulationRunId);
    },

    start(request) {
      return apply("start", request, (run) =>
        startSimulationRun(run, {
          occurredAt: deps.clock.now(),
          recordedAt: deps.clock.now(),
          eventId: deps.identifiers.nextEventId(),
          actorId: request.actorId,
          correlationId: request.correlationId,
          causationId: request.causationId,
        }),
      );
    },

    pause(request) {
      return apply("pause", request, (run) =>
        pauseSimulationRun(run, {
          occurredAt: deps.clock.now(),
          recordedAt: deps.clock.now(),
          eventId: deps.identifiers.nextEventId(),
          actorId: request.actorId,
          correlationId: request.correlationId,
          causationId: request.causationId,
        }),
      );
    },

    resume(request) {
      return apply("resume", request, (run) =>
        resumeSimulationRun(run, {
          occurredAt: deps.clock.now(),
          recordedAt: deps.clock.now(),
          eventId: deps.identifiers.nextEventId(),
          actorId: request.actorId,
          correlationId: request.correlationId,
          causationId: request.causationId,
        }),
      );
    },

    complete(request) {
      return apply("complete", request, (run) =>
        completeSimulationRun(run, {
          occurredAt: deps.clock.now(),
          recordedAt: deps.clock.now(),
          eventId: deps.identifiers.nextEventId(),
          actorId: request.actorId,
          correlationId: request.correlationId,
          causationId: request.causationId,
        }),
      );
    },

    recordFailure(request) {
      return apply("fail", request, (run) =>
        recordSimulationRunFailure(run, {
          occurredAt: deps.clock.now(),
          recordedAt: deps.clock.now(),
          eventId: deps.identifiers.nextEventId(),
          actorId: request.actorId,
          correlationId: request.correlationId,
          causationId: request.causationId,
        }),
      );
    },

    recover(request) {
      return apply("recover", request, (run) =>
        recoverSimulationRun(run, {
          occurredAt: deps.clock.now(),
          recordedAt: deps.clock.now(),
          eventId: deps.identifiers.nextEventId(),
          actorId: request.actorId,
          correlationId: request.correlationId,
          causationId: request.causationId,
        }),
      );
    },

    archive(request) {
      return apply("archive", request, (run) =>
        archiveSimulationRun(run, {
          occurredAt: deps.clock.now(),
          recordedAt: deps.clock.now(),
          eventId: deps.identifiers.nextEventId(),
          actorId: request.actorId,
          correlationId: request.correlationId,
          causationId: request.causationId,
        }),
      );
    },
  };
};
