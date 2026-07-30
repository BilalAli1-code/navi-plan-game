import {
  MASTERY_PROJECTION_TYPE,
  buildMasteryProjection,
  createProjectionBuildFailedEvent,
  createProjectionRebuiltEvent,
  getThrownDomainError,
  ruleViolationError,
  toSimulationRunReadSnapshot,
  type ActorId,
  type CausationId,
  type CommandError,
  type CorrelationId,
  type EventId,
  type MasteryProjection,
  type ProjectionDomainEvent,
  type Result,
  type SimulationRunId,
  type TenantId,
  err,
  ok,
} from "@projectsim/domain";
import type { DomainEventPublisher } from "@projectsim/domain";
import type { Clock, IdentifierGenerator } from "../ports";
import type { SimulationRunRepository } from "../simulation-run-repository";
import type { LearningProjectionContentProvider } from "./learning-projection-content-provider";
import type { SimulationProjectionRepository } from "./simulation-projection-repository";

export interface RebuildMasteryProjectionInput {
  readonly simulationRunId: SimulationRunId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly actorId: ActorId | null;
  readonly sourceEventId?: EventId;
  readonly sourceEventType?: string;
}

export interface RebuildMasteryProjectionResult {
  readonly projection: MasteryProjection;
  readonly saveResult: "inserted" | "replaced" | "unchanged";
  readonly emittedEvents: readonly ProjectionDomainEvent[];
}

export interface RebuildMasteryProjectionServiceDeps {
  readonly tenantId: TenantId;
  readonly runRepository: SimulationRunRepository;
  readonly projectionRepository: SimulationProjectionRepository;
  readonly contentProvider: LearningProjectionContentProvider;
  readonly clock: Clock;
  readonly identifiers: IdentifierGenerator;
  readonly projectionEventPublisher?: DomainEventPublisher;
}

export interface RebuildMasteryProjectionService {
  rebuild(
    input: RebuildMasteryProjectionInput,
  ): Promise<Result<RebuildMasteryProjectionResult, CommandError>>;
}

/**
 * Rebuild Mastery from authoritative SimulationRun snapshot evidence.
 */
export const createRebuildMasteryProjectionService = (
  deps: RebuildMasteryProjectionServiceDeps,
): RebuildMasteryProjectionService => ({
  async rebuild(input) {
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

    const now = deps.clock.now();
    const emitBuildFailed = async (
      errorCode: string,
      retryable: boolean,
    ): Promise<void> => {
      if (!deps.projectionEventPublisher) {
        return;
      }
      await deps.projectionEventPublisher.publish([
        createProjectionBuildFailedEvent({
          eventId: deps.identifiers.nextEventId(),
          occurredAt: now,
          recordedAt: now,
          actorId: input.actorId,
          correlationId: input.correlationId,
          causationId: input.causationId,
          tenantId: deps.tenantId,
          payload: {
            simulationRunId: input.simulationRunId,
            projectionType: MASTERY_PROJECTION_TYPE,
            sourceAggregateVersion: run.aggregateVersion,
            sourceStateVersion: run.state.stateVersion,
            sourceActionSequence: run.lastProcessedSequence,
            errorCode,
            failedAt: now,
            retryable,
          },
        }),
      ]);
    };

    const snapshot = toSimulationRunReadSnapshot(run);
    if (!snapshot.ok) {
      await emitBuildFailed(snapshot.error.code, false);
      return err(snapshot.error);
    }

    const learningContent = await deps.contentProvider.listLearningSafeContent(
      deps.tenantId,
      run.contentPackageVersionId,
      run.experienceLevel,
    );
    if (!learningContent) {
      const unavailable = ruleViolationError(
        "PROJECTION_CONTENT_UNAVAILABLE",
        "Learning-safe content is unavailable for this run's content package version.",
      );
      await emitBuildFailed(unavailable.code, true);
      return err(unavailable);
    }

    const built = buildMasteryProjection(
      input.sourceEventId === undefined
        ? {
            snapshot: snapshot.value,
            learningContent,
            experienceLevel: run.experienceLevel,
            generatedAt: now,
          }
        : {
            snapshot: snapshot.value,
            learningContent,
            experienceLevel: run.experienceLevel,
            generatedAt: now,
            sourceEvent: {
              eventId: input.sourceEventId,
              eventType: input.sourceEventType ?? "unknown",
            },
          },
    );
    if (!built.ok) {
      await emitBuildFailed(built.error.code, true);
      return err(built.error);
    }

    const rebuiltEvent = createProjectionRebuiltEvent({
      eventId: deps.identifiers.nextEventId(),
      occurredAt: now,
      recordedAt: now,
      actorId: input.actorId,
      correlationId: input.correlationId,
      causationId: input.causationId,
      tenantId: deps.tenantId,
      payload: {
        projectionId: built.value.projectionId,
        projectionType: MASTERY_PROJECTION_TYPE,
        projectionSchemaVersion: built.value.projectionSchemaVersion,
        simulationRunId: built.value.simulationRunId,
        sourceAggregateVersion: built.value.sourceAggregateVersion,
        sourceStateVersion: built.value.sourceStateVersion,
        sourceActionSequence: built.value.sourceActionSequence,
        sourceEventId: built.value.sourceEventId,
        projectionHash: built.value.semanticHash,
        generatedAt: built.value.generatedAt,
      },
    });

    const saved = await deps.projectionRepository.saveIfNewer(built.value, [
      rebuiltEvent,
    ]);
    if (!saved.ok) {
      await emitBuildFailed(
        saved.error.code,
        saved.error.code !== "PROJECTION_NONDETERMINISTIC",
      );
      return err(saved.error);
    }

    return ok({
      projection: built.value,
      saveResult: saved.value.kind,
      emittedEvents: saved.value.kind === "unchanged" ? [] : [rebuiltEvent],
    });
  },
});
