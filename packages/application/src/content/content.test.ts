import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActorId,
  asCorrelationId,
  asDecisionRecordId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asSimulationRunId,
  asTenantId,
  createHarborLogisticsRecoveryPackage,
  createNorthstarConnectedCarePackage,
  concurrencyError,
  err,
  ok,
  stampPackageChecksum,
  validateBusinessCasePackage,
  type SimulationRun,
  type TenantId,
} from "@projectsim/domain";
import type { Clock, IdentifierGenerator } from "../simulation/ports";
import type { SimulationRunRepository } from "../simulation/simulation-run-repository";
import { createSimulationRunLifecycleService } from "../simulation/simulation-run-lifecycle-service";
import { createBusinessCaseCatalogService } from "./catalog-service";
import { createSimulationRunFromCase } from "./create-run-from-case";
import {
  createBusinessCaseValidator,
  createContentPublisher,
} from "./publication-service";
import type { BusinessCaseRegistry } from "./ports";

const clock: Clock = {
  now: () => asIsoTimestamp("2026-07-27T00:00:00.000Z"),
};

const identifiers: IdentifierGenerator = {
  nextEventId: () => asEventId(`evt_${Math.random().toString(36).slice(2)}`),
  nextActionRecordId: () => asActionRecordId("action_1"),
  nextSimulationRunId: () => asSimulationRunId("run_generated"),
  nextDecisionRecordId: () => asDecisionRecordId("decision_record_1"),
};

const createRepo = (): SimulationRunRepository => {
  const runs = new Map<string, SimulationRun>();
  return {
    async getById(tid: TenantId, id) {
      return runs.get(`${tid}:${id}`) ?? null;
    },
    async save(tid, run, expected) {
      const key = `${tid}:${run.id}`;
      const existing = runs.get(key);
      if (expected === null) {
        if (existing) {
          return err(concurrencyError(0, existing.aggregateVersion));
        }
      } else if (!existing || existing.aggregateVersion !== expected) {
        return err(concurrencyError(expected, existing?.aggregateVersion ?? 0));
      }
      runs.set(key, run);
      return ok(undefined);
    },
  };
};

const createRegistryFromFixtures = (): BusinessCaseRegistry & {
  versions: Map<
    string,
    ReturnType<typeof validateBusinessCasePackage> extends never
      ? never
      : import("@projectsim/domain").BusinessCaseContentVersion
  >;
  validations: Map<string, ReturnType<typeof validateBusinessCasePackage>>;
} => {
  const versions = new Map<
    string,
    import("@projectsim/domain").BusinessCaseContentVersion
  >();
  const validations = new Map<
    string,
    ReturnType<typeof validateBusinessCasePackage>
  >();

  const install = (
    pkg: ReturnType<typeof createNorthstarConnectedCarePackage>,
  ) => {
    const validation = validateBusinessCasePackage(pkg);
    const contentPackageVersionId =
      `cpv:${pkg.manifest.businessCaseId}:${pkg.manifest.contentVersion}` as import("@projectsim/domain").ContentPackageVersionId;
    const version: import("@projectsim/domain").BusinessCaseContentVersion = {
      contentPackageVersionId,
      businessCaseId: pkg.manifest.businessCaseId,
      contentVersion: pkg.manifest.contentVersion,
      publicationStatus: pkg.manifest.publicationStatus,
      availability: pkg.manifest.availability,
      isDefaultForNewRuns:
        pkg.manifest.publicationStatus === "published" &&
        pkg.manifest.availability === "available",
      checksum: pkg.manifest.checksum,
      schemaVersion: pkg.schemaVersion,
      runtimeCompatibility: pkg.runtimeCompatibility,
      publishedAt:
        pkg.manifest.publicationStatus === "published"
          ? "2026-07-27T00:00:00.000Z"
          : null,
      package: pkg,
    };
    versions.set(
      `${version.businessCaseId}::${version.contentVersion}`,
      version,
    );
    versions.set(version.contentPackageVersionId, version);
    validations.set(version.contentPackageVersionId, {
      ...validation,
      contentPackageVersionId: version.contentPackageVersionId,
    });
    return version;
  };

  const registry: BusinessCaseRegistry & {
    versions: typeof versions;
    validations: typeof validations;
    install: typeof install;
  } = {
    versions,
    validations,
    install,
    async listInstalledVersions(businessCaseId) {
      return [...versions.values()].filter(
        (v, index, all) =>
          v.businessCaseId === businessCaseId &&
          all.findIndex(
            (x) => x.contentPackageVersionId === v.contentPackageVersionId,
          ) === index,
      );
    },
    async getPublishedVersion(id) {
      const version = versions.get(id);
      return version?.publicationStatus === "published" ? version : null;
    },
    async resolveExactVersion(input) {
      return (
        versions.get(`${input.businessCaseId}::${input.contentVersion}`) ?? null
      );
    },
    async resolveDefaultPublishedVersion(businessCaseId) {
      const all = await registry.listInstalledVersions(businessCaseId);
      return (
        all.find(
          (v) =>
            v.publicationStatus === "published" &&
            v.availability === "available" &&
            v.isDefaultForNewRuns,
        ) ?? null
      );
    },
    async saveDraft(pkg) {
      return install(pkg);
    },
  };
  return registry;
};

describe("BC-003 content application services", () => {
  it("lists both published fixtures in the catalog", async () => {
    const registry = createRegistryFromFixtures();
    registry.install(createNorthstarConnectedCarePackage());
    registry.install(createHarborLogisticsRecoveryPackage());

    const catalog = createBusinessCaseCatalogService({
      listCandidateVersions: async () =>
        [...registry.versions.values()].filter(
          (v, i, all) =>
            all.findIndex(
              (x) => x.contentPackageVersionId === v.contentPackageVersionId,
            ) === i,
        ),
      getValidationResult: (version) =>
        registry.validations.get(version.contentPackageVersionId)!,
    });

    const cases = await catalog.listSelectableCases({
      tenantId: asTenantId("tenant_1"),
      learnerId: asLearnerId("learner_1"),
      locale: "en-US",
    });
    expect(cases.map((c) => c.businessCaseId).sort()).toEqual([
      "harbor-logistics-recovery",
      "northstar-connected-care",
    ]);
  });

  it("does not list draft cases", async () => {
    const registry = createRegistryFromFixtures();
    registry.install(createNorthstarConnectedCarePackage());
    registry.install(
      stampPackageChecksum({
        ...createHarborLogisticsRecoveryPackage(),
        manifest: {
          ...createHarborLogisticsRecoveryPackage().manifest,
          publicationStatus: "draft",
          checksum: "",
        },
      }),
    );

    const catalog = createBusinessCaseCatalogService({
      listCandidateVersions: async () =>
        [...registry.versions.values()].filter(
          (v, i, all) =>
            all.findIndex(
              (x) => x.contentPackageVersionId === v.contentPackageVersionId,
            ) === i,
        ),
      getValidationResult: (version) =>
        validateBusinessCasePackage(version.package, {
          contentPackageVersionId: version.contentPackageVersionId,
        }),
    });

    const cases = await catalog.listSelectableCases({
      tenantId: asTenantId("tenant_1"),
      learnerId: asLearnerId("learner_1"),
      locale: "en-US",
    });
    expect(cases.map((c) => c.businessCaseId)).toEqual([
      "northstar-connected-care",
    ]);
  });

  it("publishes immutably and rejects in-place mutation", async () => {
    const registry = createRegistryFromFixtures();
    const validator = createBusinessCaseValidator();
    const publisher = createContentPublisher({ registry, validator });
    const pkg = createHarborLogisticsRecoveryPackage();
    const published = await publisher.publishPackage(pkg);
    expect(published.publicationStatus).toBe("published");

    await expect(
      publisher.publishPackage({
        ...pkg,
        manifest: {
          ...pkg.manifest,
          summary: { values: { "en-US": "Changed summary" } },
          checksum: "",
        },
      }),
    ).rejects.toMatchObject({
      code: "CONTENT_PACKAGE_VERSION_IMMUTABLE",
    });
  });

  it("pins case, version, and experience level; rejects unauthorized client version", async () => {
    const registry = createRegistryFromFixtures();
    const northstar = registry.install(createNorthstarConnectedCarePackage());
    const harbor = registry.install(createHarborLogisticsRecoveryPackage());

    const lifecycle = createSimulationRunLifecycleService({
      tenantId: asTenantId("tenant_1"),
      repository: createRepo(),
      clock,
      identifiers,
      authorizer: { authorize: async () => ok(undefined) },
    });

    const created = await createSimulationRunFromCase(
      {
        registry,
        lifecycle,
        getValidationResult: (id) => registry.validations.get(id)!,
      },
      {
        tenantId: asTenantId("tenant_1"),
        actorId: asActorId("actor_1"),
        learnerId: asLearnerId("learner_1"),
        businessCaseId: northstar.businessCaseId,
        experienceLevel: "explorer",
        correlationId: asCorrelationId("corr_bc003"),
        causationId: null,
        simulationRunId: "run_northstar_1",
      },
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.value.businessCaseId).toBe("northstar-connected-care");
    expect(created.value.contentPackageVersionId).toBe(
      northstar.contentPackageVersionId,
    );
    expect(created.value.experienceLevel).toBe("explorer");

    const rejected = await createSimulationRunFromCase(
      {
        registry,
        lifecycle,
        getValidationResult: (id) => registry.validations.get(id)!,
      },
      {
        tenantId: asTenantId("tenant_1"),
        actorId: asActorId("actor_1"),
        learnerId: asLearnerId("learner_1"),
        businessCaseId: northstar.businessCaseId,
        experienceLevel: "leader",
        correlationId: asCorrelationId("corr_bc003_b"),
        causationId: null,
        simulationRunId: "run_northstar_2",
        clientContentPackageVersionId: harbor.contentPackageVersionId,
      },
    );
    expect(rejected.ok).toBe(false);

    const loaded = await lifecycle.load(
      asActorId("actor_1"),
      asSimulationRunId(created.value.simulationRunId),
    );
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.experienceLevel).toBe("explorer");
    expect(loaded.value.contentPackageVersionId).not.toBe(
      harbor.contentPackageVersionId,
    );
  });
});
