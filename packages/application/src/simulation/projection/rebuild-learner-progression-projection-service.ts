import {
  LEARNER_PROGRESSION_PROJECTION_TYPE,
  buildLearnerProgressionProjection,
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
  type LearnerProgressionProjection,
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
import type { DecisionProjectionContentProvider } from "./decision-projection-content-provider";
import type { SimulationProjectionRepository } from "./simulation-projection-repository";

export interface RebuildLearnerProgressionProjectionInput {
  readonly simulationRunId: SimulationRunId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly actorId: ActorId | null;
  readonly sourceEventId?: EventId;
  readonly sourceEventType?: string;
}

export interface RebuildLearnerProgressionProjectionResult {
  readonly projection: LearnerProgressionProjection;
  readonly saveResult: "inserted" | "replaced" | "unchanged";
  readonly emittedEvents: readonly ProjectionDomainEvent[];
}

export interface RebuildLearnerProgressionProjectionServiceDeps {
  readonly tenantId: TenantId;
  readonly runRepository: SimulationRunRepository;
  readonly projectionRepository: SimulationProjectionRepository;
  readonly contentProvider: DecisionProjectionContentProvider;
  readonly clock: Clock;
  readonly identifiers: IdentifierGenerator;
  readonly projectionEventPublisher?: DomainEventPublisher;
}

export interface RebuildLearnerProgressionProjectionService {
  rebuild(
    input: RebuildLearnerProgressionProjectionInput,
  ): Promise<Result<RebuildLearnerProgressionProjectionResult, CommandError>>;
}

/**
 * Rebuild Learner Progression from authoritative snapshot + chapter catalogs.
 */
export const createRebuildLearnerProgressionProjectionService = (
  deps: RebuildLearnerProgressionProjectionServiceDeps,
): RebuildLearnerProgressionProjectionService => ({
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
            projectionType: LEARNER_PROGRESSION_PROJECTION_TYPE,
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

    const projectionContent =
      await deps.contentProvider.listProjectionSafeContent(
        deps.tenantId,
        run.contentPackageVersionId,
        run.experienceLevel,
      );
    if (!projectionContent) {
      const unavailable = ruleViolationError(
        "PROJECTION_CONTENT_UNAVAILABLE",
        "Projection-safe content is unavailable for this run's content package version.",
      );
      await emitBuildFailed(unavailable.code, true);
      return err(unavailable);
    }

    const built = buildLearnerProgressionProjection(
      input.sourceEventId === undefined
        ? {
            snapshot: snapshot.value,
            projectionContent,
            generatedAt: now,
          }
        : {
            snapshot: snapshot.value,
            projectionContent,
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
        projectionType: LEARNER_PROGRESSION_PROJECTION_TYPE,
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
