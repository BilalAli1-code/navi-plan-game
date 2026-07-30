import {
  asCausationId,
  asCorrelationId,
  asSimulationRunId,
  type SimulationDomainEvent,
  type TenantId,
} from "@projectsim/domain";
import type { RebuildActivitiesProjectionService } from "./rebuild-activities-projection-service";
import type { RebuildCompletedHistoryProjectionService } from "./rebuild-completed-history-projection-service";
import type { RebuildDecisionLogProjectionService } from "./rebuild-decision-log-projection-service";
import type { RebuildDocumentsProjectionService } from "./rebuild-documents-projection-service";
import type { RebuildInboxProjectionService } from "./rebuild-inbox-projection-service";
import type { RebuildAchievementsProjectionService } from "./rebuild-achievements-projection-service";
import type { RebuildCoachingProjectionService } from "./rebuild-coaching-projection-service";
import type { RebuildLearnerProgressionProjectionService } from "./rebuild-learner-progression-projection-service";
import type { RebuildMasteryProjectionService } from "./rebuild-mastery-projection-service";
import type { RebuildMeetingsProjectionService } from "./rebuild-meetings-projection-service";
import type { RebuildMissionControlProjectionService } from "./rebuild-mission-control-projection-service";
import type { RebuildNotificationsProjectionService } from "./rebuild-notifications-projection-service";
import type { RebuildPerformanceProjectionService } from "./rebuild-performance-projection-service";
import type { RebuildSimulationProjectionService } from "./rebuild-simulation-projection-service";
import type { RebuildStakeholdersProjectionService } from "./rebuild-stakeholders-projection-service";
import {
  DEFAULT_RELAY_RETRY_POLICY,
  type RelayRetryPolicyConfig,
} from "./relay-retry-policy";
import type { ProjectionProcessingTargetRepository } from "./projection-processing-target";
import {
  createProjectionTargetProcessor,
  type ProjectionTargetProcessor,
} from "./projection-target-processor";
import {
  activitiesProjectionRebuildHandler,
  achievementsProjectionRebuildHandler,
  completedHistoryProjectionRebuildHandler,
  coachingProjectionRebuildHandler,
  createWorkplaceProjectionRegistry,
  decisionLogProjectionRebuildHandler,
  defaultWorkplaceProjectionFanOut,
  documentsProjectionRebuildHandler,
  inboxProjectionRebuildHandler,
  learnerProgressionProjectionRebuildHandler,
  masteryProjectionRebuildHandler,
  meetingsProjectionRebuildHandler,
  missionControlProjectionRebuildHandler,
  notificationsProjectionRebuildHandler,
  performanceProjectionRebuildHandler,
  simulationProjectionRebuildHandler,
  stakeholdersProjectionRebuildHandler,
  type WorkplaceProjectionRegistry,
} from "./workplace-projection-registry";

export interface ProjectionEventConsumerDeps {
  readonly tenantId: TenantId;
  readonly rebuildService: RebuildSimulationProjectionService;
  /** Mission Control rebuild; when omitted, type is not registered. */
  readonly missionControlRebuildService?: RebuildMissionControlProjectionService;
  /** Decision Log rebuild; when omitted, type is not registered. */
  readonly decisionLogRebuildService?: RebuildDecisionLogProjectionService;
  /** Inbox rebuild; when omitted, type is not registered. */
  readonly inboxRebuildService?: RebuildInboxProjectionService;
  /** Meetings rebuild; when omitted, type is not registered. */
  readonly meetingsRebuildService?: RebuildMeetingsProjectionService;
  /** Stakeholders rebuild; when omitted, type is not registered. */
  readonly stakeholdersRebuildService?: RebuildStakeholdersProjectionService;
  /** Documents rebuild; when omitted, type is not registered. */
  readonly documentsRebuildService?: RebuildDocumentsProjectionService;
  /** Notifications rebuild; when omitted, type is not registered. */
  readonly notificationsRebuildService?: RebuildNotificationsProjectionService;
  /** Activities rebuild; when omitted, type is not registered. */
  readonly activitiesRebuildService?: RebuildActivitiesProjectionService;
  /** Completed History rebuild; when omitted, type is not registered. */
  readonly completedHistoryRebuildService?: RebuildCompletedHistoryProjectionService;
  /** Performance rebuild; when omitted, type is not registered. */
  readonly performanceRebuildService?: RebuildPerformanceProjectionService;
  /** Learner Progression rebuild; when omitted, type is not registered. */
  readonly learnerProgressionRebuildService?: RebuildLearnerProgressionProjectionService;
  /** Achievements rebuild; when omitted, type is not registered. */
  readonly achievementsRebuildService?: RebuildAchievementsProjectionService;
  /** Mastery rebuild; when omitted, type is not registered. */
  readonly masteryRebuildService?: RebuildMasteryProjectionService;
  /** Coaching rebuild; when omitted, type is not registered. */
  readonly coachingRebuildService?: RebuildCoachingProjectionService;
  /** True when this event ID was already successfully processed. */
  readonly hasProcessedEventId: (eventId: string) => Promise<boolean>;
  /** Record successful processing (event-ID dedupe; not sequenceNumber). */
  readonly rememberProcessedEventId: (eventId: string) => Promise<void>;
  /**
   * Optional registry for multi-type fan-out.
   * Defaults to registered rebuild services among workplace types.
   */
  readonly registry?: WorkplaceProjectionRegistry;
  /**
   * Optional per-projection target repository (PS-ROADMAP-023).
   * When omitted, falls back to event-level all-or-nothing fan-out.
   */
  readonly processingTargets?: ProjectionProcessingTargetRepository;
  readonly retryPolicy?: RelayRetryPolicyConfig;
  readonly workerId?: string;
  readonly now?: () => Date;
  readonly log?: (event: string, fields: Record<string, unknown>) => void;
}

/**
 * Idempotent event-triggered projection rebuild consumer.
 *
 * Deduplicates by event ID (not sequenceNumber). Loads latest authoritative run
 * via rebuild handlers; never mutates SimulationRun or reapplies consequences.
 *
 * Fan-out (ADR-006): one Domain event may rebuild multiple registered
 * projection types.
 *
 * PS-ROADMAP-023: when `processingTargets` is provided, each projection target
 * is materialized and retried independently. Event-level inbox is written only
 * when every interested target has succeeded.
 *
 * Failure isolation:
 * - Never throws to EventBus/relay (authoritative delivery must not stall).
 * - One projection type failure does not erase other successful targets.
 */
export interface ProjectionEventConsumer {
  handle(event: SimulationDomainEvent): Promise<void>;
  /**
   * When all projection targets for an event have succeeded, record the
   * event-level inbox receipt (used by the worker retry loop).
   */
  settleEventIfComplete(eventId: string): Promise<boolean>;
  /** Exposed for the production worker retry loop. */
  readonly targetProcessor: ProjectionTargetProcessor | null;
  readonly registry: WorkplaceProjectionRegistry;
}

export const createProjectionEventConsumer = (
  deps: ProjectionEventConsumerDeps,
): ProjectionEventConsumer => {
  const handlers = [
    simulationProjectionRebuildHandler(deps.rebuildService),
    ...(deps.missionControlRebuildService
      ? [
          missionControlProjectionRebuildHandler(
            deps.missionControlRebuildService,
          ),
        ]
      : []),
    ...(deps.decisionLogRebuildService
      ? [decisionLogProjectionRebuildHandler(deps.decisionLogRebuildService)]
      : []),
    ...(deps.inboxRebuildService
      ? [inboxProjectionRebuildHandler(deps.inboxRebuildService)]
      : []),
    ...(deps.meetingsRebuildService
      ? [meetingsProjectionRebuildHandler(deps.meetingsRebuildService)]
      : []),
    ...(deps.stakeholdersRebuildService
      ? [stakeholdersProjectionRebuildHandler(deps.stakeholdersRebuildService)]
      : []),
    ...(deps.documentsRebuildService
      ? [documentsProjectionRebuildHandler(deps.documentsRebuildService)]
      : []),
    ...(deps.notificationsRebuildService
      ? [
          notificationsProjectionRebuildHandler(
            deps.notificationsRebuildService,
          ),
        ]
      : []),
    ...(deps.activitiesRebuildService
      ? [activitiesProjectionRebuildHandler(deps.activitiesRebuildService)]
      : []),
    ...(deps.completedHistoryRebuildService
      ? [
          completedHistoryProjectionRebuildHandler(
            deps.completedHistoryRebuildService,
          ),
        ]
      : []),
    ...(deps.performanceRebuildService
      ? [performanceProjectionRebuildHandler(deps.performanceRebuildService)]
      : []),
    ...(deps.learnerProgressionRebuildService
      ? [
          learnerProgressionProjectionRebuildHandler(
            deps.learnerProgressionRebuildService,
          ),
        ]
      : []),
    ...(deps.achievementsRebuildService
      ? [achievementsProjectionRebuildHandler(deps.achievementsRebuildService)]
      : []),
    ...(deps.masteryRebuildService
      ? [masteryProjectionRebuildHandler(deps.masteryRebuildService)]
      : []),
    ...(deps.coachingRebuildService
      ? [coachingProjectionRebuildHandler(deps.coachingRebuildService)]
      : []),
  ];
  const registry =
    deps.registry ??
    createWorkplaceProjectionRegistry({
      handlers,
      fanOut: defaultWorkplaceProjectionFanOut,
    });

  const targetProcessor = deps.processingTargets
    ? createProjectionTargetProcessor({
        tenantId: deps.tenantId,
        registry,
        targets: deps.processingTargets,
        policy: deps.retryPolicy ?? DEFAULT_RELAY_RETRY_POLICY,
        now: deps.now ?? (() => new Date()),
        workerId: deps.workerId ?? "inline-consumer",
        ...(deps.log ? { log: deps.log } : {}),
      })
    : null;

  return {
    registry,
    targetProcessor,
    async settleEventIfComplete(eventId) {
      if (!deps.processingTargets) {
        return false;
      }
      const complete =
        await deps.processingTargets.allTargetsSucceeded(eventId);
      if (!complete) {
        return false;
      }
      await deps.rememberProcessedEventId(eventId);
      return true;
    },
    async handle(event) {
      try {
        const targets = registry.projectionTypesForEvent(event.eventType);
        if (targets.length === 0) {
          return;
        }
        if (event.tenantId !== deps.tenantId) {
          return;
        }
        if (!event.simulationRunId) {
          return;
        }

        if (await deps.hasProcessedEventId(event.eventId)) {
          return;
        }

        if (targetProcessor) {
          const outcome = await targetProcessor.handleEvent(event);
          if (outcome.eventFullySucceeded) {
            await deps.rememberProcessedEventId(event.eventId);
          }
          return;
        }

        // Legacy event-level path (memory tests without target repository).
        let allOk = true;
        for (const projectionType of targets) {
          const handler = registry.handlerFor(projectionType);
          if (!handler) {
            allOk = false;
            continue;
          }
          const result = await handler.rebuild({
            simulationRunId: asSimulationRunId(event.simulationRunId),
            correlationId:
              event.correlationId ??
              asCorrelationId(`projection:${event.eventId}`),
            causationId: asCausationId(event.eventId),
            actorId: null,
            sourceEventId: event.eventId,
            sourceEventType: event.eventType,
          });
          if (!result.ok) {
            allOk = false;
          }
        }

        if (allOk) {
          await deps.rememberProcessedEventId(event.eventId);
        }
      } catch {
        // Unexpected Infrastructure exceptions are swallowed so EventBus publish
        // and unrelated subscribers are not blocked.
      }
    },
  };
};
