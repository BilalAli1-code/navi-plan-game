import {
  asCausationId,
  asCorrelationId,
  asEventId,
  asSimulationRunId,
  type SimulationDomainEvent,
  type TenantId,
  type WorkplaceProjectionType,
} from "@projectsim/domain";
import type { ProjectionProcessingTargetRepository } from "./projection-processing-target";
import {
  classifyProjectionTargetError,
  computeRetryDelayMsWithJitter,
  shouldExhaust,
  summarizeProjectionTargetError,
  type RelayRetryPolicyConfig,
  type ProjectionTargetErrorClassification,
} from "./relay-retry-policy";
import type { WorkplaceProjectionRegistry } from "./workplace-projection-registry";

export interface ProjectionTargetProcessorDeps {
  readonly tenantId: TenantId;
  readonly registry: WorkplaceProjectionRegistry;
  readonly targets: ProjectionProcessingTargetRepository;
  readonly policy: RelayRetryPolicyConfig;
  readonly now: () => Date;
  readonly random?: () => number;
  readonly workerId: string;
  /**
   * Optional structured logger. Must not receive event/projection payloads.
   */
  readonly log?: (event: string, fields: Record<string, unknown>) => void;
  readonly onMetric?: (
    name: string,
    value: number,
    labels?: Record<string, string>,
  ) => void;
}

export interface ProcessTargetResult {
  readonly eventId: string;
  readonly projectionType: WorkplaceProjectionType;
  readonly outcome: "succeeded" | "retrying" | "exhausted" | "skipped";
  readonly attemptCount: number;
  readonly classification?: ProjectionTargetErrorClassification;
}

export interface ProjectionTargetProcessor {
  /**
   * Materialize registry-interested targets for an event and process any that
   * are not yet succeeded. Never mutates authoritative Domain state.
   */
  handleEvent(event: SimulationDomainEvent): Promise<{
    readonly materialized: number;
    readonly results: readonly ProcessTargetResult[];
    readonly eventFullySucceeded: boolean;
  }>;
  /** Claim and process a bounded batch of retryable/pending targets. */
  processClaimableBatch(batchSize: number): Promise<{
    readonly claimed: number;
    readonly results: readonly ProcessTargetResult[];
  }>;
  processOne(
    eventId: string,
    projectionType: WorkplaceProjectionType,
    eventType: string,
    simulationRunId: string,
    attemptBase: number,
  ): Promise<ProcessTargetResult>;
}

export const createProjectionTargetProcessor = (
  deps: ProjectionTargetProcessorDeps,
): ProjectionTargetProcessor => {
  const log = deps.log ?? (() => undefined);
  const metric = deps.onMetric ?? (() => undefined);
  const random = deps.random ?? Math.random;

  const processOne: ProjectionTargetProcessor["processOne"] = async (
    eventId,
    projectionType,
    eventType,
    simulationRunId,
    attemptBase,
  ) => {
    const attemptCount = attemptBase + 1;
    const started = deps.now().getTime();
    log("relay.target.start", {
      eventId,
      projectionType,
      attemptCount,
      workerId: deps.workerId,
    });

    const handler = deps.registry.handlerFor(projectionType);
    if (!handler) {
      const classification: ProjectionTargetErrorClassification =
        "missing_registration";
      const summary = `No rebuild handler registered for ${projectionType}.`;
      await deps.targets.markFailed({
        eventId,
        projectionType,
        attemptCount,
        nextAttemptAt: null,
        exhausted: true,
        classification,
        summary,
        now: deps.now(),
      });
      metric("relay_targets_exhausted_total", 1, {
        projectionType,
        result: "exhausted",
        errorClassification: classification,
      });
      log("relay.target.exhausted", {
        eventId,
        projectionType,
        attemptCount,
        classification,
      });
      return {
        eventId,
        projectionType,
        outcome: "exhausted",
        attemptCount,
        classification,
      };
    }

    try {
      const result = await handler.rebuild({
        simulationRunId: asSimulationRunId(simulationRunId),
        correlationId: asCorrelationId(`projection:${eventId}`),
        causationId: asCausationId(eventId),
        actorId: null,
        sourceEventId: asEventId(eventId),
        sourceEventType: eventType,
      });
      if (!result.ok) {
        throw Object.assign(new Error("projection_rebuild_failed"), {
          classification: "unknown" as const,
        });
      }
      await deps.targets.markSucceeded({
        eventId,
        projectionType,
        attemptCount,
        now: deps.now(),
      });
      metric("relay_targets_succeeded_total", 1, {
        projectionType,
        result: "succeeded",
      });
      metric(
        "relay_target_duration_seconds",
        (deps.now().getTime() - started) / 1000,
        { projectionType, result: "succeeded" },
      );
      log("relay.target.success", {
        eventId,
        projectionType,
        attemptCount,
        durationMs: deps.now().getTime() - started,
      });
      return {
        eventId,
        projectionType,
        outcome: "succeeded",
        attemptCount,
      };
    } catch (error) {
      const classification = classifyProjectionTargetError(error);
      const summary = summarizeProjectionTargetError(error);
      const exhausted = shouldExhaust(
        attemptCount,
        deps.policy,
        classification,
      );
      const delayMs = exhausted
        ? null
        : computeRetryDelayMsWithJitter(attemptCount, deps.policy, random);
      const nextAttemptAt =
        delayMs === null ? null : new Date(deps.now().getTime() + delayMs);
      await deps.targets.markFailed({
        eventId,
        projectionType,
        attemptCount,
        nextAttemptAt,
        exhausted,
        classification,
        summary,
        now: deps.now(),
      });
      if (exhausted) {
        metric("relay_targets_exhausted_total", 1, {
          projectionType,
          result: "exhausted",
          errorClassification: classification,
        });
        log("relay.target.exhausted", {
          eventId,
          projectionType,
          attemptCount,
          classification,
        });
        return {
          eventId,
          projectionType,
          outcome: "exhausted",
          attemptCount,
          classification,
        };
      }
      metric("relay_targets_retried_total", 1, {
        projectionType,
        result: "retrying",
        errorClassification: classification,
      });
      metric("relay_targets_failed_total", 1, {
        projectionType,
        result: "failed",
        errorClassification: classification,
      });
      log("relay.target.retry_scheduled", {
        eventId,
        projectionType,
        attemptCount,
        classification,
        nextAttemptAt: nextAttemptAt?.toISOString() ?? null,
      });
      return {
        eventId,
        projectionType,
        outcome: "retrying",
        attemptCount,
        classification,
      };
    }
  };

  return {
    processOne,
    async handleEvent(event) {
      const interested = deps.registry.projectionTypesForEvent(event.eventType);
      if (interested.length === 0) {
        return {
          materialized: 0,
          results: [],
          eventFullySucceeded: true,
        };
      }
      if (event.tenantId !== deps.tenantId || !event.simulationRunId) {
        return {
          materialized: 0,
          results: [],
          eventFullySucceeded: false,
        };
      }

      await deps.targets.materializeTargets(
        interested.map((projectionType) => ({
          tenantId: deps.tenantId,
          eventId: event.eventId,
          projectionType,
          simulationRunId: event.simulationRunId!,
          eventType: event.eventType,
        })),
      );

      const results: ProcessTargetResult[] = [];
      for (const projectionType of interested) {
        const existing = await deps.targets.getTarget(
          event.eventId,
          projectionType,
        );
        if (!existing) {
          results.push({
            eventId: event.eventId,
            projectionType,
            outcome: "skipped",
            attemptCount: 0,
          });
          continue;
        }
        if (existing.status === "succeeded") {
          results.push({
            eventId: event.eventId,
            projectionType,
            outcome: "succeeded",
            attemptCount: existing.attemptCount,
          });
          continue;
        }
        if (existing.status === "exhausted") {
          results.push({
            eventId: event.eventId,
            projectionType,
            outcome: "exhausted",
            attemptCount: existing.attemptCount,
            ...(existing.lastErrorClassification
              ? { classification: existing.lastErrorClassification }
              : {}),
          });
          continue;
        }
        const result = await processOne(
          event.eventId,
          projectionType,
          event.eventType,
          event.simulationRunId,
          existing.attemptCount,
        );
        results.push(result);
      }

      const eventFullySucceeded = await deps.targets.allTargetsSucceeded(
        event.eventId,
      );
      return {
        materialized: interested.length,
        results,
        eventFullySucceeded,
      };
    },
    async processClaimableBatch(batchSize) {
      const claimed = await deps.targets.claimTargets({
        workerId: deps.workerId,
        batchSize,
        claimLeaseMs: deps.policy.claimLeaseMs,
        now: deps.now(),
      });
      metric("relay_targets_claimed_total", claimed.length, {});
      log("relay.batch.claimed", {
        claimed: claimed.length,
        workerId: deps.workerId,
      });
      const results: ProcessTargetResult[] = [];
      for (const target of claimed) {
        results.push(
          await processOne(
            target.eventId,
            target.projectionType,
            target.eventType,
            target.simulationRunId,
            target.attemptCount,
          ),
        );
      }
      return { claimed: claimed.length, results };
    },
  };
};
