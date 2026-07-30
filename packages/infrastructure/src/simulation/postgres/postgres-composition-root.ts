import {
  createGetActivitiesProjectionService,
  createGetCompletedHistoryProjectionService,
  createGetDecisionLogProjectionService,
  createGetDocumentsProjectionService,
  createGetAchievementsProjectionService,
  createGetCoachingProjectionService,
  createGetLearnerProgressionProjectionService,
  createGetMasteryProjectionService,
  createGetInboxProjectionService,
  createGetPerformanceProjectionService,
  createGetMeetingsProjectionService,
  createGetMissionControlProjectionService,
  createGetNotificationsProjectionService,
  createGetSimulationProjectionService,
  createGetStakeholdersProjectionService,
  createCapabilityProjectionOpsAuthorizer,
  createProjectionEventConsumer,
  createProjectionOperationsService,
  createRebuildActivitiesProjectionService,
  createRebuildCompletedHistoryProjectionService,
  createRebuildDecisionLogProjectionService,
  createRebuildDocumentsProjectionService,
  createRebuildAchievementsProjectionService,
  createRebuildCoachingProjectionService,
  createRebuildLearnerProgressionProjectionService,
  createRebuildMasteryProjectionService,
  createRebuildInboxProjectionService,
  createRebuildPerformanceProjectionService,
  createRebuildMeetingsProjectionService,
  createRebuildMissionControlProjectionService,
  createRebuildNotificationsProjectionService,
  createRebuildSimulationProjectionService,
  createRebuildStakeholdersProjectionService,
  createSimulationCommandApplicationService,
  createSimulationCommandDispatcher,
  createSimulationRunLifecycleService,
  type Clock,
  type DecisionDefinitionProvider,
  type DecisionProjectionContentProvider,
  type GetActivitiesProjectionService,
  type GetCompletedHistoryProjectionService,
  type GetDecisionLogProjectionService,
  type GetDocumentsProjectionService,
  type GetAchievementsProjectionService,
  type GetCoachingProjectionService,
  type GetMasteryProjectionService,
  type LearningProjectionContentProvider,
  type RebuildAchievementsProjectionService,
  type RebuildCoachingProjectionService,
  type RebuildMasteryProjectionService,
  type GetLearnerProgressionProjectionService,
  type GetInboxProjectionService,
  type GetPerformanceProjectionService,
  type GetMeetingsProjectionService,
  type GetMissionControlProjectionService,
  type GetNotificationsProjectionService,
  type GetSimulationProjectionService,
  type GetStakeholdersProjectionService,
  type IdempotencyStore,
  type IdentifierGenerator,
  type ProjectionEventConsumer,
  type ProjectionOperationsService,
  type ProjectionProcessingTargetRepository,
  type RelayRetryPolicyConfig,
  type RebuildActivitiesProjectionService,
  type RebuildCompletedHistoryProjectionService,
  type RebuildDecisionLogProjectionService,
  type RebuildDocumentsProjectionService,
  type RebuildLearnerProgressionProjectionService,
  type RebuildInboxProjectionService,
  type RebuildPerformanceProjectionService,
  type RebuildMeetingsProjectionService,
  type RebuildMissionControlProjectionService,
  type RebuildNotificationsProjectionService,
  type RebuildSimulationProjectionService,
  type RebuildStakeholdersProjectionService,
  type SimulationCommandApplicationService,
  type SimulationCommandAuthorizer,
  type SimulationProjectionAuthorizer,
  type SimulationProjectionRepository,
  type SimulationRunLifecycleAuthorizer,
  type SimulationRunLifecycleService,
  type SimulationRunRepository,
} from "@projectsim/application";
import {
  asTenantId,
  type DomainEventPublisher,
  type SimulationDomainEvent,
} from "@projectsim/domain";
import { createCapabilityAuthorizer } from "../authorization/capability-authorizer";
import { createLifecycleCapabilityAuthorizer } from "../authorization/lifecycle-authorizer";
import type { MembershipStore } from "../authorization/membership";
import { createPostgresMembershipStore } from "../authorization/postgres-membership-store";
import { createProjectionCapabilityAuthorizer } from "../authorization/projection-authorizer";
import { createSystemClock } from "../clock";
import { createInMemoryDecisionDefinitionProvider } from "../decision-definition-provider";
import { createIdentifierGenerator } from "../identifier-generator";
import { createInMemoryDecisionProjectionContentProvider } from "../projection/projection-content-provider";
import { createInMemoryLearningProjectionContentProvider } from "../projection/learning-projection-content-provider";
import {
  createPostgresDatabase,
  type PostgresDatabase,
  type PostgresDatabaseOptions,
} from "./database";
import type { EventBus } from "./event-bus";
import { createInMemoryEventBus } from "./event-bus";
import { createOutboxRelay, type OutboxRelay } from "./outbox-relay";
import { createPostgresIdempotencyStore } from "./postgres-idempotency-store";
import { createPostgresOutboxDomainEventPublisher } from "./postgres-outbox-publisher";
import {
  createPostgresProjectionEventInbox,
  createPostgresSimulationProjectionRepository,
} from "./postgres-projection-repository";
import { createPostgresProjectionProcessingTargetRepository } from "./postgres-projection-processing-target-repository";
import { createPostgresSimulationRunRepository } from "./postgres-simulation-run-repository";

const isPostgresDatabase = (
  value: PostgresDatabaseOptions | PostgresDatabase,
): value is PostgresDatabase =>
  typeof value === "object" &&
  value !== null &&
  "withTenantTransaction" in value &&
  "pool" in value &&
  "close" in value;

export interface PostgresSimulationCommandModuleOptions {
  /**
   * Either connection options (owns a new pool) or a shared {@link PostgresDatabase}.
   * Shared databases are not closed by `module.close()` — the owner must close them.
   */
  readonly database: PostgresDatabaseOptions | PostgresDatabase;
  readonly tenantId: string;
  readonly idempotencyRetentionSeconds?: number;
  readonly clock?: Clock;
  readonly identifiers?: IdentifierGenerator;
  readonly authorizer?: SimulationCommandAuthorizer;
  readonly lifecycleAuthorizer?: SimulationRunLifecycleAuthorizer;
  readonly projectionAuthorizer?: SimulationProjectionAuthorizer;
  readonly membershipStore?: MembershipStore;
  readonly runRepository?: SimulationRunRepository;
  readonly decisionDefinitionProvider?: DecisionDefinitionProvider;
  readonly projectionContentProvider?: DecisionProjectionContentProvider;
  readonly learningContentProvider?: LearningProjectionContentProvider;
  readonly projectionRepository?: SimulationProjectionRepository;
  readonly eventBus?: EventBus;
  /** Optional no-op/recording publisher; durable events go through the repository. */
  readonly eventPublisher?: DomainEventPublisher;
  /** Wire projection consumer to EventBus fan-out (default true). */
  readonly enableProjectionConsumer?: boolean;
  /** Override processing-target repository (tests). */
  readonly processingTargets?: ProjectionProcessingTargetRepository;
  readonly relayWorkerId?: string;
  readonly retryPolicy?: RelayRetryPolicyConfig;
}

export interface PostgresSimulationCommandModule {
  readonly applicationService: SimulationCommandApplicationService;
  readonly lifecycleService: SimulationRunLifecycleService;
  readonly rebuildProjectionService: RebuildSimulationProjectionService;
  readonly rebuildMissionControlProjectionService: RebuildMissionControlProjectionService;
  readonly rebuildDecisionLogProjectionService: RebuildDecisionLogProjectionService;
  readonly rebuildInboxProjectionService: RebuildInboxProjectionService;
  readonly rebuildPerformanceProjectionService: RebuildPerformanceProjectionService;
  readonly rebuildLearnerProgressionProjectionService: RebuildLearnerProgressionProjectionService;
  readonly rebuildAchievementsProjectionService: RebuildAchievementsProjectionService;
  readonly rebuildMasteryProjectionService: RebuildMasteryProjectionService;
  readonly rebuildCoachingProjectionService: RebuildCoachingProjectionService;
  readonly rebuildMeetingsProjectionService: RebuildMeetingsProjectionService;
  readonly rebuildStakeholdersProjectionService: RebuildStakeholdersProjectionService;
  readonly rebuildDocumentsProjectionService: RebuildDocumentsProjectionService;
  readonly rebuildNotificationsProjectionService: RebuildNotificationsProjectionService;
  readonly rebuildActivitiesProjectionService: RebuildActivitiesProjectionService;
  readonly rebuildCompletedHistoryProjectionService: RebuildCompletedHistoryProjectionService;
  readonly getProjectionService: GetSimulationProjectionService;
  readonly getMissionControlProjectionService: GetMissionControlProjectionService;
  readonly getDecisionLogProjectionService: GetDecisionLogProjectionService;
  readonly getInboxProjectionService: GetInboxProjectionService;
  readonly getMeetingsProjectionService: GetMeetingsProjectionService;
  readonly getStakeholdersProjectionService: GetStakeholdersProjectionService;
  readonly getDocumentsProjectionService: GetDocumentsProjectionService;
  readonly getPerformanceProjectionService: GetPerformanceProjectionService;
  readonly getLearnerProgressionProjectionService: GetLearnerProgressionProjectionService;
  readonly getAchievementsProjectionService: GetAchievementsProjectionService;
  readonly getMasteryProjectionService: GetMasteryProjectionService;
  readonly getCoachingProjectionService: GetCoachingProjectionService;
  readonly getNotificationsProjectionService: GetNotificationsProjectionService;
  readonly getActivitiesProjectionService: GetActivitiesProjectionService;
  readonly getCompletedHistoryProjectionService: GetCompletedHistoryProjectionService;
  readonly projectionEventConsumer: ProjectionEventConsumer;
  readonly processingTargets: ProjectionProcessingTargetRepository;
  readonly projectionOperationsService: ProjectionOperationsService;
  readonly database: PostgresDatabase;
  readonly tenantId: string;
  readonly clock: Clock;
  readonly identifiers: IdentifierGenerator;
  readonly authorizer: SimulationCommandAuthorizer;
  readonly lifecycleAuthorizer: SimulationRunLifecycleAuthorizer;
  readonly projectionAuthorizer: SimulationProjectionAuthorizer;
  readonly membershipStore: MembershipStore;
  readonly runRepository: SimulationRunRepository;
  readonly decisionDefinitionProvider: DecisionDefinitionProvider;
  readonly projectionContentProvider: DecisionProjectionContentProvider;
  readonly learningContentProvider: LearningProjectionContentProvider;
  readonly projectionRepository: SimulationProjectionRepository;
  readonly idempotencyStore: IdempotencyStore;
  readonly eventBus: EventBus;
  readonly outboxRelay: OutboxRelay;
  close(): Promise<void>;
}

export const createPostgresSimulationCommandModule = (
  options: PostgresSimulationCommandModuleOptions,
): PostgresSimulationCommandModule => {
  const ownsDatabase = !isPostgresDatabase(options.database);
  const database = ownsDatabase
    ? createPostgresDatabase(options.database)
    : options.database;
  const { tenantId } = options;

  const clock = options.clock ?? createSystemClock();
  const identifiers = options.identifiers ?? createIdentifierGenerator();
  const membershipStore =
    options.membershipStore ??
    createPostgresMembershipStore(database, tenantId);
  const authorizer =
    options.authorizer ??
    createCapabilityAuthorizer({ tenantId, membershipStore });
  const lifecycleAuthorizer =
    options.lifecycleAuthorizer ??
    createLifecycleCapabilityAuthorizer({ tenantId, membershipStore });
  const projectionAuthorizer =
    options.projectionAuthorizer ??
    createProjectionCapabilityAuthorizer({ tenantId, membershipStore });
  const runRepository =
    options.runRepository ??
    createPostgresSimulationRunRepository(database, tenantId);
  const decisionDefinitionProvider =
    options.decisionDefinitionProvider ??
    createInMemoryDecisionDefinitionProvider();
  const projectionContentProvider =
    options.projectionContentProvider ??
    createInMemoryDecisionProjectionContentProvider();
  const learningContentProvider =
    options.learningContentProvider ??
    createInMemoryLearningProjectionContentProvider();
  const idempotencyStore = createPostgresIdempotencyStore(
    database,
    tenantId,
    options.idempotencyRetentionSeconds === undefined
      ? {}
      : { retentionSeconds: options.idempotencyRetentionSeconds },
  );
  const eventBus = options.eventBus ?? createInMemoryEventBus();
  const projectionRepository =
    options.projectionRepository ??
    createPostgresSimulationProjectionRepository(database, tenantId);
  const projectionInbox = createPostgresProjectionEventInbox(
    database,
    tenantId,
  );
  const processingTargets =
    options.processingTargets ??
    createPostgresProjectionProcessingTargetRepository(database, tenantId);

  const applicationService = createSimulationCommandApplicationService({
    tenantId: asTenantId(tenantId),
    dispatcher: createSimulationCommandDispatcher(),
    authorizer,
    idempotencyStore,
    runRepository,
    decisionDefinitionProvider,
    clock,
    identifiers,
  });
  const lifecycleService = createSimulationRunLifecycleService({
    tenantId: asTenantId(tenantId),
    repository: runRepository,
    clock,
    identifiers,
    authorizer: lifecycleAuthorizer,
  });

  const projectionEventPublisher =
    options.eventPublisher ??
    createPostgresOutboxDomainEventPublisher(database, tenantId);

  const rebuildProjectionService = createRebuildSimulationProjectionService({
    tenantId: asTenantId(tenantId),
    runRepository,
    projectionRepository,
    contentProvider: projectionContentProvider,
    clock,
    identifiers,
    projectionEventPublisher,
  });
  const rebuildMissionControlProjectionService =
    createRebuildMissionControlProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildDecisionLogProjectionService =
    createRebuildDecisionLogProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildInboxProjectionService = createRebuildInboxProjectionService({
    tenantId: asTenantId(tenantId),
    runRepository,
    projectionRepository,
    contentProvider: projectionContentProvider,
    clock,
    identifiers,
    projectionEventPublisher,
  });
  const rebuildPerformanceProjectionService =
    createRebuildPerformanceProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildLearnerProgressionProjectionService =
    createRebuildLearnerProgressionProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildAchievementsProjectionService =
    createRebuildAchievementsProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: learningContentProvider,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildMasteryProjectionService = createRebuildMasteryProjectionService(
    {
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: learningContentProvider,
      clock,
      identifiers,
      projectionEventPublisher,
    },
  );
  const rebuildCoachingProjectionService =
    createRebuildCoachingProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: learningContentProvider,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const getProjectionService = createGetSimulationProjectionService({
    tenantId: asTenantId(tenantId),
    authorizer: projectionAuthorizer,
    runRepository,
    projectionRepository,
    rebuildService: rebuildProjectionService,
  });
  const getMissionControlProjectionService =
    createGetMissionControlProjectionService({
      tenantId: asTenantId(tenantId),
      authorizer: projectionAuthorizer,
      runRepository,
      projectionRepository,
      rebuildService: rebuildMissionControlProjectionService,
    });
  const getDecisionLogProjectionService = createGetDecisionLogProjectionService(
    {
      tenantId: asTenantId(tenantId),
      authorizer: projectionAuthorizer,
      runRepository,
      projectionRepository,
      rebuildService: rebuildDecisionLogProjectionService,
    },
  );
  const getInboxProjectionService = createGetInboxProjectionService({
    tenantId: asTenantId(tenantId),
    authorizer: projectionAuthorizer,
    runRepository,
    projectionRepository,
    rebuildService: rebuildInboxProjectionService,
  });
  const rebuildMeetingsProjectionService =
    createRebuildMeetingsProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const getMeetingsProjectionService = createGetMeetingsProjectionService({
    tenantId: asTenantId(tenantId),
    authorizer: projectionAuthorizer,
    runRepository,
    projectionRepository,
    rebuildService: rebuildMeetingsProjectionService,
  });
  const rebuildStakeholdersProjectionService =
    createRebuildStakeholdersProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildDocumentsProjectionService =
    createRebuildDocumentsProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildNotificationsProjectionService =
    createRebuildNotificationsProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildActivitiesProjectionService =
    createRebuildActivitiesProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const rebuildCompletedHistoryProjectionService =
    createRebuildCompletedHistoryProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher,
    });
  const getStakeholdersProjectionService =
    createGetStakeholdersProjectionService({
      tenantId: asTenantId(tenantId),
      authorizer: projectionAuthorizer,
      runRepository,
      projectionRepository,
      rebuildService: rebuildStakeholdersProjectionService,
    });
  const getDocumentsProjectionService = createGetDocumentsProjectionService({
    tenantId: asTenantId(tenantId),
    authorizer: projectionAuthorizer,
    runRepository,
    projectionRepository,
    rebuildService: rebuildDocumentsProjectionService,
  });
  const getPerformanceProjectionService = createGetPerformanceProjectionService(
    {
      tenantId: asTenantId(tenantId),
      authorizer: projectionAuthorizer,
      runRepository,
      projectionRepository,
      rebuildService: rebuildPerformanceProjectionService,
    },
  );
  const getLearnerProgressionProjectionService =
    createGetLearnerProgressionProjectionService({
      tenantId: asTenantId(tenantId),
      authorizer: projectionAuthorizer,
      runRepository,
      projectionRepository,
      rebuildService: rebuildLearnerProgressionProjectionService,
    });
  const getAchievementsProjectionService =
    createGetAchievementsProjectionService({
      tenantId: asTenantId(tenantId),
      authorizer: projectionAuthorizer,
      runRepository,
      projectionRepository,
      rebuildService: rebuildAchievementsProjectionService,
    });
  const getMasteryProjectionService = createGetMasteryProjectionService({
    tenantId: asTenantId(tenantId),
    authorizer: projectionAuthorizer,
    runRepository,
    projectionRepository,
    rebuildService: rebuildMasteryProjectionService,
  });
  const getCoachingProjectionService = createGetCoachingProjectionService({
    tenantId: asTenantId(tenantId),
    authorizer: projectionAuthorizer,
    runRepository,
    projectionRepository,
    rebuildService: rebuildCoachingProjectionService,
  });
  const getNotificationsProjectionService =
    createGetNotificationsProjectionService({
      tenantId: asTenantId(tenantId),
      authorizer: projectionAuthorizer,
      runRepository,
      projectionRepository,
      rebuildService: rebuildNotificationsProjectionService,
    });
  const getActivitiesProjectionService = createGetActivitiesProjectionService({
    tenantId: asTenantId(tenantId),
    authorizer: projectionAuthorizer,
    runRepository,
    projectionRepository,
    rebuildService: rebuildActivitiesProjectionService,
  });
  const getCompletedHistoryProjectionService =
    createGetCompletedHistoryProjectionService({
      tenantId: asTenantId(tenantId),
      authorizer: projectionAuthorizer,
      runRepository,
      projectionRepository,
      rebuildService: rebuildCompletedHistoryProjectionService,
    });
  const projectionEventConsumer = createProjectionEventConsumer({
    tenantId: asTenantId(tenantId),
    rebuildService: rebuildProjectionService,
    missionControlRebuildService: rebuildMissionControlProjectionService,
    decisionLogRebuildService: rebuildDecisionLogProjectionService,
    inboxRebuildService: rebuildInboxProjectionService,
    performanceRebuildService: rebuildPerformanceProjectionService,
    learnerProgressionRebuildService:
      rebuildLearnerProgressionProjectionService,
    achievementsRebuildService: rebuildAchievementsProjectionService,
    masteryRebuildService: rebuildMasteryProjectionService,
    coachingRebuildService: rebuildCoachingProjectionService,
    meetingsRebuildService: rebuildMeetingsProjectionService,
    stakeholdersRebuildService: rebuildStakeholdersProjectionService,
    documentsRebuildService: rebuildDocumentsProjectionService,
    notificationsRebuildService: rebuildNotificationsProjectionService,
    activitiesRebuildService: rebuildActivitiesProjectionService,
    completedHistoryRebuildService: rebuildCompletedHistoryProjectionService,
    hasProcessedEventId: projectionInbox.hasProcessedEventId,
    rememberProcessedEventId: projectionInbox.rememberProcessedEventId,
    processingTargets,
    workerId: options.relayWorkerId ?? `api:${tenantId}`,
    now: () => new Date(clock.now()),
    ...(options.retryPolicy ? { retryPolicy: options.retryPolicy } : {}),
    ...(process.env.PROJECTSIM_RELAY_LOG === "1"
      ? {
          log: (event: string, fields: Record<string, unknown>) => {
            console.log(JSON.stringify({ event, ...fields }));
          },
        }
      : {}),
  });
  const projectionOperationsService = createProjectionOperationsService({
    tenantId: asTenantId(tenantId),
    authorizer: createCapabilityProjectionOpsAuthorizer(),
    registry: projectionEventConsumer.registry,
    targets: processingTargets,
    now: () => new Date(clock.now()),
    ...(process.env.PROJECTSIM_RELAY_LOG === "1"
      ? {
          log: (event: string, fields: Record<string, unknown>) => {
            console.log(JSON.stringify({ event, ...fields }));
          },
        }
      : {}),
  });

  if (
    options.enableProjectionConsumer !== false &&
    typeof eventBus.subscribe === "function"
  ) {
    eventBus.subscribe(async (event) => {
      // Projection technical events must not re-enter the rebuild consumer.
      if (
        event.eventType === "ProjectionRebuilt" ||
        event.eventType === "ProjectionBuildFailed"
      ) {
        return;
      }
      // Consumer is responsible for never throwing; keep a final guard so
      // authoritative relay publish cannot be blocked by projection work.
      try {
        await projectionEventConsumer.handle(event as SimulationDomainEvent);
      } catch {
        // Isolated — retry via later triggers or GetSimulationProjection.
      }
    });
  }

  const outboxRelay = createOutboxRelay({
    database,
    tenantId,
    eventBus,
  });

  return {
    applicationService,
    lifecycleService,
    rebuildProjectionService,
    rebuildMissionControlProjectionService,
    rebuildDecisionLogProjectionService,
    rebuildInboxProjectionService,
    rebuildPerformanceProjectionService,
    rebuildLearnerProgressionProjectionService,
    rebuildAchievementsProjectionService,
    rebuildMasteryProjectionService,
    rebuildCoachingProjectionService,
    rebuildMeetingsProjectionService,
    rebuildStakeholdersProjectionService,
    rebuildDocumentsProjectionService,
    rebuildNotificationsProjectionService,
    rebuildActivitiesProjectionService,
    rebuildCompletedHistoryProjectionService,
    getProjectionService,
    getMissionControlProjectionService,
    getDecisionLogProjectionService,
    getInboxProjectionService,
    getMeetingsProjectionService,
    getStakeholdersProjectionService,
    getDocumentsProjectionService,
    getPerformanceProjectionService,
    getLearnerProgressionProjectionService,
    getAchievementsProjectionService,
    getMasteryProjectionService,
    getCoachingProjectionService,
    getNotificationsProjectionService,
    getActivitiesProjectionService,
    getCompletedHistoryProjectionService,
    projectionEventConsumer,
    processingTargets,
    projectionOperationsService,
    database,
    tenantId,
    clock,
    identifiers,
    authorizer,
    lifecycleAuthorizer,
    projectionAuthorizer,
    membershipStore,
    runRepository,
    decisionDefinitionProvider,
    projectionContentProvider,
    learningContentProvider,
    projectionRepository,
    idempotencyStore,
    eventBus,
    outboxRelay,
    close: async () => {
      if (ownsDatabase) {
        await database.close();
      }
    },
  };
};
