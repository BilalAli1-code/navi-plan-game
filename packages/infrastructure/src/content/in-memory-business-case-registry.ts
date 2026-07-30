/**
 * In-memory BusinessCaseRegistry / ContentResolver (BC-003).
 *
 * Suitable for tests and local composition. Cache keys include case + version + checksum.
 */

import {
  asContentPackageVersionId,
  computeBusinessCasePackageChecksum,
  validateBusinessCasePackage,
  type BusinessCaseContentPackage,
  type BusinessCaseContentVersion,
  type BusinessCaseId,
  type ContentPackageVersionId,
  type ContentValidationResult,
} from "@projectsim/domain";
import type {
  BusinessCaseRegistry,
  ContentResolver,
} from "@projectsim/application";

export interface InMemoryContentStore {
  readonly versions: Map<string, BusinessCaseContentVersion>;
  readonly validations: Map<string, ContentValidationResult>;
  readonly cache: Map<string, BusinessCaseContentVersion>;
}

export const createInMemoryContentStore = (): InMemoryContentStore => ({
  versions: new Map(),
  validations: new Map(),
  cache: new Map(),
});

const versionKey = (
  businessCaseId: BusinessCaseId | string,
  contentVersion: string,
): string => `${businessCaseId}::${contentVersion}`;

const cacheKey = (
  businessCaseId: string,
  contentPackageVersionId: string,
  checksum: string,
): string => `content:${businessCaseId}:${contentPackageVersionId}:${checksum}`;

const toContentPackageVersionId = (
  businessCaseId: string,
  contentVersion: string,
): ContentPackageVersionId =>
  asContentPackageVersionId(`cpv:${businessCaseId}:${contentVersion}`);

const toStoredVersion = (
  pkg: BusinessCaseContentPackage,
  existingId?: ContentPackageVersionId,
): BusinessCaseContentVersion => {
  const checksum = computeBusinessCasePackageChecksum(pkg);
  const contentPackageVersionId =
    existingId ??
    toContentPackageVersionId(
      pkg.manifest.businessCaseId,
      pkg.manifest.contentVersion,
    );
  return {
    contentPackageVersionId,
    businessCaseId: pkg.manifest.businessCaseId,
    contentVersion: pkg.manifest.contentVersion,
    publicationStatus: pkg.manifest.publicationStatus,
    availability: pkg.manifest.availability,
    isDefaultForNewRuns:
      pkg.manifest.publicationStatus === "published" &&
      pkg.manifest.availability === "available",
    checksum,
    schemaVersion: pkg.schemaVersion,
    runtimeCompatibility: pkg.runtimeCompatibility,
    publishedAt:
      pkg.manifest.publicationStatus === "published"
        ? new Date(0).toISOString()
        : null,
    package: {
      ...pkg,
      manifest: {
        ...pkg.manifest,
        checksum,
      },
    },
  };
};

export const createInMemoryBusinessCaseRegistry = (
  store: InMemoryContentStore = createInMemoryContentStore(),
): BusinessCaseRegistry & {
  readonly store: InMemoryContentStore;
  installFixture(pkg: BusinessCaseContentPackage): BusinessCaseContentVersion;
  listAllVersions(): BusinessCaseContentVersion[];
  getValidation(
    contentPackageVersionId: ContentPackageVersionId | string,
  ): ContentValidationResult | null;
} => {
  const api: BusinessCaseRegistry & {
    readonly store: InMemoryContentStore;
    installFixture(pkg: BusinessCaseContentPackage): BusinessCaseContentVersion;
    listAllVersions(): BusinessCaseContentVersion[];
    getValidation(
      contentPackageVersionId: ContentPackageVersionId | string,
    ): ContentValidationResult | null;
  } = {
    store,

    installFixture(pkg) {
      const stored = toStoredVersion(pkg);
      const key = versionKey(stored.businessCaseId, stored.contentVersion);
      store.versions.set(key, stored);
      store.versions.set(stored.contentPackageVersionId, stored);
      const validation = validateBusinessCasePackage(stored.package, {
        contentPackageVersionId: stored.contentPackageVersionId,
      });
      store.validations.set(stored.contentPackageVersionId, validation);
      store.cache.set(
        cacheKey(
          stored.businessCaseId,
          stored.contentPackageVersionId,
          stored.checksum,
        ),
        stored,
      );
      return stored;
    },

    listAllVersions() {
      const seen = new Set<string>();
      const out: BusinessCaseContentVersion[] = [];
      for (const version of store.versions.values()) {
        if (seen.has(version.contentPackageVersionId)) continue;
        seen.add(version.contentPackageVersionId);
        out.push(version);
      }
      return out;
    },

    getValidation(contentPackageVersionId) {
      return store.validations.get(contentPackageVersionId) ?? null;
    },

    async listInstalledVersions(businessCaseId) {
      return api
        .listAllVersions()
        .filter((v) => v.businessCaseId === businessCaseId);
    },

    async getPublishedVersion(contentPackageVersionId) {
      const version = store.versions.get(contentPackageVersionId) ?? null;
      if (!version || version.publicationStatus !== "published") {
        return null;
      }
      return version;
    },

    async resolveExactVersion(input) {
      return (
        store.versions.get(
          versionKey(input.businessCaseId, input.contentVersion),
        ) ?? null
      );
    },

    async resolveDefaultPublishedVersion(businessCaseId) {
      const versions = (await api.listInstalledVersions(businessCaseId)).filter(
        (v) =>
          v.publicationStatus === "published" &&
          v.availability === "available" &&
          v.isDefaultForNewRuns,
      );
      // Prefer highest semver-ish string order among defaults.
      return (
        versions.sort((a, b) =>
          b.contentVersion.localeCompare(a.contentVersion),
        )[0] ?? null
      );
    },

    async saveDraft(pkg) {
      const key = versionKey(
        pkg.manifest.businessCaseId,
        pkg.manifest.contentVersion,
      );
      const existing = store.versions.get(key);
      if (
        existing &&
        existing.publicationStatus === "published" &&
        existing.checksum !== computeBusinessCasePackageChecksum(pkg)
      ) {
        throw new Error(
          "Published content cannot be changed in place; bump content_version.",
        );
      }
      const stored = toStoredVersion(pkg, existing?.contentPackageVersionId);
      store.versions.set(key, stored);
      store.versions.set(stored.contentPackageVersionId, stored);
      const validation = validateBusinessCasePackage(stored.package, {
        contentPackageVersionId: stored.contentPackageVersionId,
      });
      store.validations.set(stored.contentPackageVersionId, validation);
      store.cache.set(
        cacheKey(
          stored.businessCaseId,
          stored.contentPackageVersionId,
          stored.checksum,
        ),
        stored,
      );
      return stored;
    },
  };

  return api;
};

export const createInMemoryContentResolver = (
  registry: ReturnType<typeof createInMemoryBusinessCaseRegistry>,
): ContentResolver => ({
  async getPublishedVersion(contentPackageVersionId) {
    return registry.getPublishedVersion(contentPackageVersionId);
  },
  async resolveExactVersion(input) {
    return registry.resolveExactVersion(input);
  },
  async resolveForPinnedRun(contentPackageVersionId) {
    // Retired versions remain resolvable for pinned runs.
    return registry.store.versions.get(contentPackageVersionId) ?? null;
  },
});
