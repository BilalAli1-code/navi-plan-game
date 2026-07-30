import {
  getThrownDomainError,
  listSubmittedDecisionRecordIds,
  resolveDecision,
  ruleViolationError,
  type ActorId,
  type CausationId,
  type CommandError,
  type CorrelationId,
  type DecisionRecordId,
  type Result,
  type SimulationDomainEvent,
  type SimulationRunId,
  type TenantId,
  err,
  ok,
} from "@projectsim/domain";
import type { DecisionDefinitionProvider } from "./decision-definition-provider";
import type { Clock, IdentifierGenerator } from "./ports";
import type { SimulationRunRepository } from "./simulation-run-repository";

/**
 * Internal recovery for Decisions left in `submitted` status (PS-ROADMAP-005).
 *
 * Not a learner command. Callers must supply approved system/admin authority
 * before invoking this service.
 */

export interface DecisionResolutionRecoveryServiceDeps {
  readonly tenantId: TenantId;
  readonly runRepository: SimulationRunRepository;
  readonly decisionDefinitionProvider: DecisionDefinitionProvider;
  readonly clock: Clock;
  readonly identifiers: IdentifierGenerator;
  /** Actor recorded on recovery events (system/admin). */
  readonly recoveryActorId: ActorId;
}

export interface RecoverSubmittedDecisionInput {
  readonly simulationRunId: SimulationRunId;
  readonly decisionRecordId: DecisionRecordId;
  readonly expectedVersion: number | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
}

export interface RecoverSubmittedDecisionResult {
  readonly alreadyResolved: boolean;
  readonly aggregateVersion: number;
  readonly decisionRecordId: DecisionRecordId;
  readonly outcomeId: string;
  readonly emittedEvents: readonly SimulationDomainEvent[];
}

export interface DecisionResolutionRecoveryService {
  listPendingSubmittedDecisions(
    simulationRunId: SimulationRunId,
  ): Promise<Result<readonly DecisionRecordId[], CommandError>>;

  recoverSubmittedDecision(
    input: RecoverSubmittedDecisionInput,
  ): Promise<Result<RecoverSubmittedDecisionResult, CommandError>>;
}

export const createDecisionResolutionRecoveryService = (
  deps: DecisionResolutionRecoveryServiceDeps,
): DecisionResolutionRecoveryService => ({
  async listPendingSubmittedDecisions(simulationRunId) {
    let run;
    try {
      run = await deps.runRepository.getById(deps.tenantId, simulationRunId);
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
          `SimulationRun '${simulationRunId}' was not found.`,
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
    return ok(listSubmittedDecisionRecordIds(run.state));
  },

  async recoverSubmittedDecision(input) {
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
    if (
      input.expectedVersion !== null &&
      input.expectedVersion !== run.aggregateVersion
    ) {
      return err({
        kind: "concurrency",
        code: "AGGREGATE_VERSION_CONFLICT",
        retryable: false,
        message: `Expected aggregate version ${input.expectedVersion} but found ${run.aggregateVersion}.`,
        expectedVersion: input.expectedVersion,
        actualVersion: run.aggregateVersion,
      });
    }

    const decision = run.state.decisions.find(
      (entry) => entry.id === input.decisionRecordId,
    );
    if (!decision) {
      return err(
        ruleViolationError(
          "DECISION_NOT_FOUND",
          `Decision '${input.decisionRecordId}' was not found.`,
        ),
      );
    }

    const definition =
      await deps.decisionDefinitionProvider.getDecisionDefinition(
        deps.tenantId,
        run.contentPackageVersionId,
        decision.decisionDefinitionId,
      );
    if (!definition) {
      return err(
        ruleViolationError(
          "DECISION_DEFINITION_NOT_FOUND",
          `Decision definition '${decision.decisionDefinitionId}' was not found for this run's content package version.`,
        ),
      );
    }

    const now = deps.clock.now();
    const resolved = resolveDecision(run, {
      decisionRecordId: input.decisionRecordId,
      definition,
      resolvedAt: now,
      recordedAt: now,
      correlationId: input.correlationId,
      causationId: input.causationId,
      actorId: deps.recoveryActorId,
      allocateEventId: () => deps.identifiers.nextEventId(),
    });
    if (!resolved.ok) {
      return err(resolved.error);
    }

    if (resolved.value.alreadyResolved) {
      return ok({
        alreadyResolved: true,
        aggregateVersion: run.aggregateVersion,
        decisionRecordId: resolved.value.decision.id,
        outcomeId: resolved.value.outcome.id,
        emittedEvents: [],
      });
    }

    const saved = await deps.runRepository.save(
      deps.tenantId,
      resolved.value.run,
      run.aggregateVersion,
      resolved.value.events,
    );
    if (!saved.ok) {
      return err(saved.error);
    }

    return ok({
      alreadyResolved: false,
      aggregateVersion: resolved.value.run.aggregateVersion,
      decisionRecordId: resolved.value.decision.id,
      outcomeId: resolved.value.outcome.id,
      emittedEvents: resolved.value.events,
    });
  },
});
