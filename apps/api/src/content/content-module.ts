/**
 * BC-003/BC-004 content composition for the API process.
 *
 * Installs Northstar + Harbor fixtures into an in-memory registry until durable
 * content repositories are wired for production. Create-run starts the run and
 * initializes Chapter One through authoritative commands.
 */

import {
  createBusinessCaseCatalogService,
  createBusinessCaseValidator,
  createContentPublisher,
  createSimulationRunFromCase,
  initializeChapterFromContent,
  type BusinessCaseCatalogService,
  type CreateSimulationRunFromCaseInput,
  type CreateSimulationRunFromCaseResult,
} from "@projectsim/application";
import {
  createHarborLogisticsRecoveryPackage,
  createNorthstarConnectedCarePackage,
  validateBusinessCasePackage,
  type CommandError,
  type Result,
  ok,
} from "@projectsim/domain";
import {
  createInMemoryBusinessCaseRegistry,
  createInMemoryContentResolver,
} from "@projectsim/infrastructure";
import type { SimulationModuleRegistry } from "../module-registry";

export interface ContentApiModule {
  readonly catalog: BusinessCaseCatalogService;
  readonly registry: ReturnType<typeof createInMemoryBusinessCaseRegistry>;
  readonly resolver: ReturnType<typeof createInMemoryContentResolver>;
  readonly publisher: ReturnType<typeof createContentPublisher>;
  createRunFromCase(
    registry: SimulationModuleRegistry,
    input: CreateSimulationRunFromCaseInput,
  ): Promise<
    Result<
      CreateSimulationRunFromCaseResult & {
        readonly chapterId: string;
        readonly initialized: {
          readonly stakeholders: number;
          readonly documents: number;
          readonly notifications: number;
          readonly activities: number;
          readonly messages: number;
          readonly meetings: number;
        };
      },
      CommandError
    >
  >;
}

export const createContentApiModule = (options?: {
  readonly registry?: ReturnType<typeof createInMemoryBusinessCaseRegistry>;
}): ContentApiModule => {
  const registry = options?.registry ?? createInMemoryBusinessCaseRegistry();
  if (!options?.registry) {
    registry.installFixture(createNorthstarConnectedCarePackage());
    registry.installFixture(createHarborLogisticsRecoveryPackage());
  }

  const resolver = createInMemoryContentResolver(registry);
  const validator = createBusinessCaseValidator();
  const publisher = createContentPublisher({ registry, validator });

  const catalog = createBusinessCaseCatalogService({
    listCandidateVersions: async () => registry.listAllVersions(),
    getValidationResult: (version) => {
      const stored = registry.getValidation(version.contentPackageVersionId);
      if (stored) {
        return stored;
      }
      return validateBusinessCasePackage(version.package, {
        contentPackageVersionId: version.contentPackageVersionId,
      });
    },
  });

  return {
    catalog,
    registry,
    resolver,
    publisher,
    async createRunFromCase(simulationRegistry, input) {
      const services = simulationRegistry.get(input.tenantId);
      const created = await createSimulationRunFromCase(
        {
          registry,
          lifecycle: services.lifecycleService,
          getValidationResult: (contentPackageVersionId) => {
            const stored = registry.getValidation(contentPackageVersionId);
            if (stored) {
              return stored;
            }
            const version = registry.store.versions.get(
              contentPackageVersionId,
            );
            if (!version) {
              throw new Error(
                `Missing validation for content package version '${contentPackageVersionId}'.`,
              );
            }
            return validateBusinessCasePackage(version.package, {
              contentPackageVersionId: version.contentPackageVersionId,
            });
          },
        },
        input,
      );
      if (!created.ok) {
        return created;
      }

      const version = await registry.getPublishedVersion(
        created.value.contentPackageVersionId,
      );
      if (!version) {
        throw new Error(
          `Published package missing after create for ${created.value.contentPackageVersionId}`,
        );
      }

      const initialized = await initializeChapterFromContent(
        {
          lifecycle: services.lifecycleService,
          commands: services.applicationService,
        },
        {
          actorId: input.actorId,
          simulationRunId: created.value.simulationRunId,
          correlationId: input.correlationId,
          package: version.package,
          experienceLevel: input.experienceLevel,
        },
      );
      if (!initialized.ok) {
        return initialized;
      }

      return ok({
        ...created.value,
        status: initialized.value.status,
        chapterId: initialized.value.chapterId,
        initialized: initialized.value.initialized,
      });
    },
  };
};
