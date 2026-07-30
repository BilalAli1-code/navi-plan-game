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
  asContentPackageVersionId,
  asTenantId,
  type DomainEventPublisher,
} from "@projectsim/domain";
import { createPermitAllAuthorizer } from "./authorizer";
import { createPermitAllLifecycleAuthorizer } from "./authorization/lifecycle-authorizer";
import {
  createInMemoryMembershipStore,
  type MembershipStore,
} from "./authorization/membership";
import { createPermitAllProjectionAuthorizer } from "./authorization/projection-authorizer";
import { createSystemClock } from "./clock";
import { createInMemoryDecisionDefinitionProvider } from "./decision-definition-provider";
import { createInMemoryDomainEventPublisher } from "./event-publisher";
import { createIdentifierGenerator } from "./identifier-generator";
import { createInMemoryIdempotencyStore } from "./idempotency-store";
import { createInMemoryProjectionEventInbox } from "./projection/in-memory-projection-event-inbox";
import { createInMemoryProjectionProcessingTargetRepository } from "./projection/in-memory-projection-processing-target-repository";
import { createInMemorySimulationProjectionRepository } from "./projection/in-memory-projection-repository";
import {
  createInMemoryDecisionProjectionContentProvider,
  createScaffoldProjectionContentRecord,
} from "./projection/projection-content-provider";
import {
  createInMemoryLearningProjectionContentProvider,
  createScaffoldLearningContentRecord,
} from "./projection/learning-projection-content-provider";
import { createInMemorySimulationRunRepository } from "./simulation-run-repository";

export interface SimulationCommandModuleOverrides {
  readonly tenantId?: string;
  readonly clock?: Clock;
  readonly identifiers?: IdentifierGenerator;
  readonly authorizer?: SimulationCommandAuthorizer;
  readonly lifecycleAuthorizer?: SimulationRunLifecycleAuthorizer;
  readonly projectionAuthorizer?: SimulationProjectionAuthorizer;
  readonly runRepository?: SimulationRunRepository;
  readonly decisionDefinitionProvider?: DecisionDefinitionProvider;
  readonly projectionContentProvider?: DecisionProjectionContentProvider;
  readonly learningContentProvider?: LearningProjectionContentProvider;
  readonly seedScaffoldLearningContent?: boolean;
  readonly projectionRepository?: SimulationProjectionRepository;
  readonly idempotencyStore?: IdempotencyStore;
  readonly eventPublisher?: DomainEventPublisher;
  /**
   * Seed scaffold projection-safe content. Defaults to false so existing
   * command-module tests are not coupled to projection fixtures.
   */
  readonly seedScaffoldProjectionContent?: boolean;
  readonly scaffoldContentPackageVersionId?: string;
  readonly processingTargets?: ProjectionProcessingTargetRepository;
  /** When false, omit target repository (legacy event-level fan-out). Default true. */
  readonly enableProcessingTargets?: boolean;
  readonly membershipStore?: MembershipStore;
}

export interface SimulationCommandModule {
  readonly tenantId: string;
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
  readonly processingTargets: ProjectionProcessingTargetRepository | null;
  readonly projectionOperationsService: ProjectionOperationsService | null;
  readonly membershipStore: MembershipStore;
  readonly clock: Clock;
  readonly identifiers: IdentifierGenerator;
  readonly authorizer: SimulationCommandAuthorizer;
  readonly lifecycleAuthorizer: SimulationRunLifecycleAuthorizer;
  readonly projectionAuthorizer: SimulationProjectionAuthorizer;
  readonly runRepository: SimulationRunRepository;
  readonly decisionDefinitionProvider: DecisionDefinitionProvider;
  readonly projectionContentProvider: DecisionProjectionContentProvider;
  readonly learningContentProvider: LearningProjectionContentProvider;
  readonly projectionRepository: SimulationProjectionRepository;
  readonly idempotencyStore: IdempotencyStore;
  readonly eventPublisher: DomainEventPublisher;
}

/**
 * In-memory composition root — wires PS-004A adapters to the command and
 * lifecycle application services against the canonical SimulationRunRepository,
 * plus PS-ROADMAP-006 projection rebuild/query services.
 */
export const createSimulationCommandModule = (
  overrides: SimulationCommandModuleOverrides = {},
): SimulationCommandModule => {
  const tenantId = overrides.tenantId ?? "tenant_local";
  const clock = overrides.clock ?? createSystemClock();
  const identifiers = overrides.identifiers ?? createIdentifierGenerator();
  const authorizer = overrides.authorizer ?? createPermitAllAuthorizer();
  const lifecycleAuthorizer =
    overrides.lifecycleAuthorizer ?? createPermitAllLifecycleAuthorizer();
  const projectionAuthorizer =
    overrides.projectionAuthorizer ?? createPermitAllProjectionAuthorizer();
  const eventPublisher =
    overrides.eventPublisher ?? createInMemoryDomainEventPublisher();
  const runRepository =
    overrides.runRepository ??
    createInMemorySimulationRunRepository({ eventPublisher });
  const decisionDefinitionProvider =
    overrides.decisionDefinitionProvider ??
    createInMemoryDecisionDefinitionProvider();
  const projectionContentProvider =
    overrides.projectionContentProvider ??
    createInMemoryDecisionProjectionContentProvider(
      overrides.seedScaffoldProjectionContent
        ? [
            createScaffoldProjectionContentRecord({
              tenantId: asTenantId(tenantId),
              contentPackageVersionId: asContentPackageVersionId(
                overrides.scaffoldContentPackageVersionId ?? "cpv_1",
              ),
            }),
          ]
        : [],
    );
  const learningContentProvider =
    overrides.learningContentProvider ??
    createInMemoryLearningProjectionContentProvider(
      overrides.seedScaffoldLearningContent ||
        overrides.seedScaffoldProjectionContent
        ? [
            createScaffoldLearningContentRecord({
              tenantId: asTenantId(tenantId),
              contentPackageVersionId: asContentPackageVersionId(
                overrides.scaffoldContentPackageVersionId ?? "cpv_1",
              ),
            }),
          ]
        : [],
    );
  const idempotencyStore =
    overrides.idempotencyStore ?? createInMemoryIdempotencyStore();
  const projectionRepository =
    overrides.projectionRepository ??
    createInMemorySimulationProjectionRepository({ eventPublisher });
  const projectionInbox = createInMemoryProjectionEventInbox();
  const processingTargets =
    overrides.processingTargets ??
    (overrides.enableProcessingTargets === false
      ? null
      : createInMemoryProjectionProcessingTargetRepository(tenantId));
  const membershipStore =
    overrides.membershipStore ?? createInMemoryMembershipStore();

  const dispatcher = createSimulationCommandDispatcher();
  const applicationService = createSimulationCommandApplicationService({
    tenantId: asTenantId(tenantId),
    dispatcher,
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

  const rebuildProjectionService = createRebuildSimulationProjectionService({
    tenantId: asTenantId(tenantId),
    runRepository,
    projectionRepository,
    contentProvider: projectionContentProvider,
    clock,
    identifiers,
    projectionEventPublisher: eventPublisher,
  });
  const rebuildMissionControlProjectionService =
    createRebuildMissionControlProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildDecisionLogProjectionService =
    createRebuildDecisionLogProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildInboxProjectionService = createRebuildInboxProjectionService({
    tenantId: asTenantId(tenantId),
    runRepository,
    projectionRepository,
    contentProvider: projectionContentProvider,
    clock,
    identifiers,
    projectionEventPublisher: eventPublisher,
  });
  const rebuildPerformanceProjectionService =
    createRebuildPerformanceProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildLearnerProgressionProjectionService =
    createRebuildLearnerProgressionProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildAchievementsProjectionService =
    createRebuildAchievementsProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: learningContentProvider,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildMasteryProjectionService = createRebuildMasteryProjectionService(
    {
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: learningContentProvider,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
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
      projectionEventPublisher: eventPublisher,
    });
  const rebuildMeetingsProjectionService =
    createRebuildMeetingsProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      contentProvider: projectionContentProvider,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildStakeholdersProjectionService =
    createRebuildStakeholdersProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildDocumentsProjectionService =
    createRebuildDocumentsProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildNotificationsProjectionService =
    createRebuildNotificationsProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildActivitiesProjectionService =
    createRebuildActivitiesProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
    });
  const rebuildCompletedHistoryProjectionService =
    createRebuildCompletedHistoryProjectionService({
      tenantId: asTenantId(tenantId),
      runRepository,
      projectionRepository,
      clock,
      identifiers,
      projectionEventPublisher: eventPublisher,
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
  const getMeetingsProjectionService = createGetMeetingsProjectionService({
    tenantId: asTenantId(tenantId),
    authorizer: projectionAuthorizer,
    runRepository,
    projectionRepository,
    rebuildService: rebuildMeetingsProjectionService,
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
    ...(processingTargets
      ? {
          processingTargets,
          workerId: `memory:${tenantId}`,
          now: () => new Date(clock.now()),
        }
      : {}),
  });
  const projectionOperationsService = processingTargets
    ? createProjectionOperationsService({
        tenantId: asTenantId(tenantId),
        authorizer: createCapabilityProjectionOpsAuthorizer(),
        registry: projectionEventConsumer.registry,
        targets: processingTargets,
        now: () => new Date(clock.now()),
      })
    : null;

  return {
    tenantId,
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
    membershipStore,
    clock,
    identifiers,
    authorizer,
    lifecycleAuthorizer,
    projectionAuthorizer,
    runRepository,
    decisionDefinitionProvider,
    projectionContentProvider,
    learningContentProvider,
    projectionRepository,
    idempotencyStore,
    eventPublisher,
  };
};
