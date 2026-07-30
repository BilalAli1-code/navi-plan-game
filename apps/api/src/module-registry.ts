import type {
  GetActivitiesProjectionService,
  GetCompletedHistoryProjectionService,
  GetDecisionLogProjectionService,
  GetDocumentsProjectionService,
  GetLearnerProgressionProjectionService,
  GetAchievementsProjectionService,
  GetMasteryProjectionService,
  GetCoachingProjectionService,
  GetInboxProjectionService,
  GetPerformanceProjectionService,
  GetMeetingsProjectionService,
  GetMissionControlProjectionService,
  GetNotificationsProjectionService,
  GetSimulationProjectionService,
  GetStakeholdersProjectionService,
  SimulationCommandApplicationService,
  SimulationProjectionAuthorizer,
  SimulationRunLifecycleService,
} from "@projectsim/application";
import {
  createInMemoryBusinessCaseRegistry,
  createInMemoryDecisionDefinitionProvider,
  createInMemoryDecisionProjectionContentProvider,
  createInMemoryLearningProjectionContentProvider,
  createInMemoryMembershipStore,
  createPostgresDatabase,
  createPostgresSimulationCommandModule,
  createProjectionCapabilityAuthorizer,
  createRegistryBackedDecisionDefinitionProvider,
  createRegistryBackedLearningProjectionContentProvider,
  createRegistryBackedProjectionContentProvider,
  createScaffoldLearningContentRecord,
  createScaffoldProjectionContentRecord,
  createSimulationCommandModule,
  type ContentVersionLookup,
  type PostgresDatabase,
  type PostgresSimulationCommandModule,
  type SimulationCommandModule,
} from "@projectsim/infrastructure";
import {
  asActorId,
  asContentPackageVersionId,
  asDecisionId,
  asTenantId,
  createScaffoldDecisionDefinition,
  type TenantId,
} from "@projectsim/domain";

type BusinessCaseRegistryHandle = ReturnType<
  typeof createInMemoryBusinessCaseRegistry
>;

export interface TenantSimulationServices {
  readonly tenantId: TenantId;
  readonly applicationService: SimulationCommandApplicationService;
  readonly lifecycleService: SimulationRunLifecycleService;
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
  readonly module: SimulationCommandModule | PostgresSimulationCommandModule;
}

/**
 * Tenant-scoped Application service locator used by HTTP adapters.
 * Implementations must not be selected by the browser.
 */
export interface SimulationModuleRegistry {
  get(tenantId: string): TenantSimulationServices;
  close?(): Promise<void>;
}

const scaffoldProviders = (input: {
  readonly tenantId: TenantId;
  readonly contentPackageVersionId: ReturnType<
    typeof asContentPackageVersionId
  >;
  readonly decisionId: ReturnType<typeof asDecisionId>;
}) => {
  const definition = createScaffoldDecisionDefinition({
    id: input.decisionId,
    contentPackageVersionId: input.contentPackageVersionId,
  });
  return {
    decisionDefinitionProvider: createInMemoryDecisionDefinitionProvider([
      { tenantId: input.tenantId, definition },
    ]),
    projectionContentProvider: createInMemoryDecisionProjectionContentProvider([
      createScaffoldProjectionContentRecord({
        tenantId: input.tenantId,
        contentPackageVersionId: input.contentPackageVersionId,
        decisionId: input.decisionId,
      }),
    ]),
    learningContentProvider: createInMemoryLearningProjectionContentProvider([
      createScaffoldLearningContentRecord({
        tenantId: input.tenantId,
        contentPackageVersionId: input.contentPackageVersionId,
      }),
    ]),
  };
};

/**
 * Prefer registry-backed business-case content, but keep scaffold `cpv_1`
 * available for E2E / integration fixtures that still pin the scaffold package.
 */
const composeRegistryWithScaffoldFallback = (input: {
  readonly tenantId: TenantId;
  readonly contentLookup: ContentVersionLookup;
  readonly scaffoldContentPackageVersionId: ReturnType<
    typeof asContentPackageVersionId
  >;
  readonly scaffoldDecisionId: ReturnType<typeof asDecisionId>;
}) => {
  const registryDecision = createRegistryBackedDecisionDefinitionProvider(
    input.contentLookup,
  );
  const registryProjection = createRegistryBackedProjectionContentProvider(
    input.contentLookup,
  );
  const registryLearning =
    createRegistryBackedLearningProjectionContentProvider(input.contentLookup);
  const scaffold = scaffoldProviders({
    tenantId: input.tenantId,
    contentPackageVersionId: input.scaffoldContentPackageVersionId,
    decisionId: input.scaffoldDecisionId,
  });

  return {
    decisionDefinitionProvider: {
      async getDecisionDefinition(
        tenantId: TenantId,
        contentPackageVersionId: ReturnType<typeof asContentPackageVersionId>,
        decisionDefinitionId: ReturnType<typeof asDecisionId>,
      ) {
        const fromRegistry = await registryDecision.getDecisionDefinition(
          tenantId,
          contentPackageVersionId,
          decisionDefinitionId,
        );
        if (fromRegistry !== null) {
          return fromRegistry;
        }
        return scaffold.decisionDefinitionProvider.getDecisionDefinition(
          tenantId,
          contentPackageVersionId,
          decisionDefinitionId,
        );
      },
    },
    projectionContentProvider: {
      async listProjectionSafeContent(
        tenantId: TenantId,
        contentPackageVersionId: ReturnType<typeof asContentPackageVersionId>,
        experienceLevel?: Parameters<
          typeof scaffold.projectionContentProvider.listProjectionSafeContent
        >[2],
      ) {
        const fromRegistry = await registryProjection.listProjectionSafeContent(
          tenantId,
          contentPackageVersionId,
          experienceLevel,
        );
        if (fromRegistry !== null) {
          return fromRegistry;
        }
        return scaffold.projectionContentProvider.listProjectionSafeContent(
          tenantId,
          contentPackageVersionId,
          experienceLevel,
        );
      },
      async listEligibilityDefinitions(
        tenantId: TenantId,
        contentPackageVersionId: ReturnType<typeof asContentPackageVersionId>,
      ) {
        const fromRegistry =
          await registryProjection.listEligibilityDefinitions(
            tenantId,
            contentPackageVersionId,
          );
        if (fromRegistry !== null) {
          return fromRegistry;
        }
        return scaffold.projectionContentProvider.listEligibilityDefinitions(
          tenantId,
          contentPackageVersionId,
        );
      },
    },
    learningContentProvider: {
      async listLearningSafeContent(
        tenantId: TenantId,
        contentPackageVersionId: ReturnType<typeof asContentPackageVersionId>,
        experienceLevel?: Parameters<
          typeof scaffold.learningContentProvider.listLearningSafeContent
        >[2],
        locale?: Parameters<
          typeof scaffold.learningContentProvider.listLearningSafeContent
        >[3],
      ) {
        const fromRegistry = await registryLearning.listLearningSafeContent(
          tenantId,
          contentPackageVersionId,
          experienceLevel,
          locale,
        );
        if (fromRegistry !== null) {
          return fromRegistry;
        }
        return scaffold.learningContentProvider.listLearningSafeContent(
          tenantId,
          contentPackageVersionId,
          experienceLevel,
          locale,
        );
      },
    },
  };
};

/**
 * In-memory authoritative store for focused tests and explicit local demo mode.
 * Never selected implicitly by missing DATABASE_URL.
 */
export const createInMemorySimulationModuleRegistry = (options?: {
  readonly contentPackageVersionId?: string;
  readonly decisionId?: string;
  /** When set, decision/projection content is resolved from installed packages. */
  readonly businessCaseRegistry?: BusinessCaseRegistryHandle;
  readonly authorizedActorsByTenant?: Readonly<
    Record<string, readonly string[]>
  >;
  readonly projectionAuthorizerFactory?: (input: {
    readonly tenantId: string;
  }) => SimulationProjectionAuthorizer;
}): SimulationModuleRegistry => {
  const contentPackageVersionId = asContentPackageVersionId(
    options?.contentPackageVersionId ?? "cpv_1",
  );
  const decisionId = asDecisionId(options?.decisionId ?? "decision_1");
  const cache = new Map<string, TenantSimulationServices>();
  const contentLookup = options?.businessCaseRegistry
    ? {
        getPublishedVersion: (
          id: ReturnType<typeof asContentPackageVersionId>,
        ) => options.businessCaseRegistry!.getPublishedVersion(id),
        getVersionById: async (
          id: ReturnType<typeof asContentPackageVersionId>,
        ) => options.businessCaseRegistry!.store.versions.get(id) ?? null,
      }
    : null;

  return {
    get(tenantId) {
      const brandedTenant = asTenantId(tenantId);
      const existing = cache.get(tenantId);
      if (existing) {
        return existing;
      }
      const providers = contentLookup
        ? composeRegistryWithScaffoldFallback({
            tenantId: brandedTenant,
            contentLookup,
            scaffoldContentPackageVersionId: contentPackageVersionId,
            scaffoldDecisionId: decisionId,
          })
        : scaffoldProviders({
            tenantId: brandedTenant,
            contentPackageVersionId,
            decisionId,
          });

      let projectionAuthorizer: SimulationProjectionAuthorizer | undefined;
      if (options?.projectionAuthorizerFactory) {
        projectionAuthorizer = options.projectionAuthorizerFactory({
          tenantId,
        });
      } else if (options?.authorizedActorsByTenant) {
        const actors = options.authorizedActorsByTenant[tenantId] ?? [];
        const membershipStore = createInMemoryMembershipStore(
          actors.map((actorId) => ({
            actorId: asActorId(actorId),
            tenantId,
            roles: ["learner"],
            capabilities: ["simulation.run.view", "simulation.run.start"],
          })),
        );
        projectionAuthorizer = createProjectionCapabilityAuthorizer({
          tenantId,
          membershipStore,
        });
      }

      const membershipStoreForModule = options?.authorizedActorsByTenant
        ? createInMemoryMembershipStore(
            (options.authorizedActorsByTenant[tenantId] ?? []).map(
              (actorId) => ({
                actorId: asActorId(actorId),
                tenantId,
                roles: ["learner"],
                capabilities: ["simulation.run.view", "simulation.run.start"],
              }),
            ),
          )
        : createInMemoryMembershipStore();

      const module = createSimulationCommandModule({
        tenantId,
        decisionDefinitionProvider: providers.decisionDefinitionProvider,
        projectionContentProvider: providers.projectionContentProvider,
        learningContentProvider: providers.learningContentProvider,
        seedScaffoldProjectionContent: false,
        seedScaffoldLearningContent: false,
        membershipStore: membershipStoreForModule,
        ...(projectionAuthorizer ? { projectionAuthorizer } : {}),
      });
      const services: TenantSimulationServices = {
        tenantId: brandedTenant,
        applicationService: module.applicationService,
        lifecycleService: module.lifecycleService,
        getProjectionService: module.getProjectionService,
        getMissionControlProjectionService:
          module.getMissionControlProjectionService,
        getDecisionLogProjectionService: module.getDecisionLogProjectionService,
        getInboxProjectionService: module.getInboxProjectionService,
        getMeetingsProjectionService: module.getMeetingsProjectionService,
        getStakeholdersProjectionService:
          module.getStakeholdersProjectionService,
        getDocumentsProjectionService: module.getDocumentsProjectionService,
        getPerformanceProjectionService: module.getPerformanceProjectionService,
        getLearnerProgressionProjectionService:
          module.getLearnerProgressionProjectionService,
        getAchievementsProjectionService:
          module.getAchievementsProjectionService,
        getMasteryProjectionService: module.getMasteryProjectionService,
        getCoachingProjectionService: module.getCoachingProjectionService,
        getNotificationsProjectionService:
          module.getNotificationsProjectionService,
        getActivitiesProjectionService: module.getActivitiesProjectionService,
        getCompletedHistoryProjectionService:
          module.getCompletedHistoryProjectionService,
        module,
      };
      cache.set(tenantId, services);
      return services;
    },
  };
};

/**
 * PostgreSQL-backed registry for production-capable API processes.
 * Uses durable run/projection/idempotency/outbox adapters and membership RLS.
 *
 * Scaffold decision/projection content providers remain temporary content
 * adapters until the persistent Content Aggregate exists — they are not an
 * in-memory authoritative SimulationRun store.
 */
export const createPostgresSimulationModuleRegistry = (options: {
  readonly connectionString: string;
  readonly contentPackageVersionId?: string;
  readonly decisionId?: string;
  readonly businessCaseRegistry?: BusinessCaseRegistryHandle;
  readonly database?: PostgresDatabase;
}): SimulationModuleRegistry & { readonly database: PostgresDatabase } => {
  const contentPackageVersionId = asContentPackageVersionId(
    options.contentPackageVersionId ?? "cpv_1",
  );
  const decisionId = asDecisionId(options.decisionId ?? "decision_1");
  const ownsDatabase = options.database === undefined;
  const database =
    options.database ??
    createPostgresDatabase({ connectionString: options.connectionString });
  const cache = new Map<string, TenantSimulationServices>();
  const contentLookup = options.businessCaseRegistry
    ? {
        getPublishedVersion: (
          id: ReturnType<typeof asContentPackageVersionId>,
        ) => options.businessCaseRegistry!.getPublishedVersion(id),
        getVersionById: async (
          id: ReturnType<typeof asContentPackageVersionId>,
        ) => options.businessCaseRegistry!.store.versions.get(id) ?? null,
      }
    : null;

  return {
    database,
    get(tenantId) {
      const brandedTenant = asTenantId(tenantId);
      const existing = cache.get(tenantId);
      if (existing) {
        return existing;
      }
      const providers = contentLookup
        ? composeRegistryWithScaffoldFallback({
            tenantId: brandedTenant,
            contentLookup,
            scaffoldContentPackageVersionId: contentPackageVersionId,
            scaffoldDecisionId: decisionId,
          })
        : scaffoldProviders({
            tenantId: brandedTenant,
            contentPackageVersionId,
            decisionId,
          });
      const module = createPostgresSimulationCommandModule({
        database,
        tenantId,
        decisionDefinitionProvider: providers.decisionDefinitionProvider,
        projectionContentProvider: providers.projectionContentProvider,
        learningContentProvider: providers.learningContentProvider,
      });
      const services: TenantSimulationServices = {
        tenantId: brandedTenant,
        applicationService: module.applicationService,
        lifecycleService: module.lifecycleService,
        getProjectionService: module.getProjectionService,
        getMissionControlProjectionService:
          module.getMissionControlProjectionService,
        getDecisionLogProjectionService: module.getDecisionLogProjectionService,
        getInboxProjectionService: module.getInboxProjectionService,
        getMeetingsProjectionService: module.getMeetingsProjectionService,
        getStakeholdersProjectionService:
          module.getStakeholdersProjectionService,
        getDocumentsProjectionService: module.getDocumentsProjectionService,
        getPerformanceProjectionService: module.getPerformanceProjectionService,
        getLearnerProgressionProjectionService:
          module.getLearnerProgressionProjectionService,
        getAchievementsProjectionService:
          module.getAchievementsProjectionService,
        getMasteryProjectionService: module.getMasteryProjectionService,
        getCoachingProjectionService: module.getCoachingProjectionService,
        getNotificationsProjectionService:
          module.getNotificationsProjectionService,
        getActivitiesProjectionService: module.getActivitiesProjectionService,
        getCompletedHistoryProjectionService:
          module.getCompletedHistoryProjectionService,
        module,
      };
      cache.set(tenantId, services);
      return services;
    },
    async close() {
      for (const services of cache.values()) {
        const mod = services.module as PostgresSimulationCommandModule;
        if (typeof mod.close === "function") {
          await mod.close();
        }
      }
      cache.clear();
      if (ownsDatabase) {
        await database.close();
      }
    },
  };
};
