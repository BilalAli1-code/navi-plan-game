/**
 * BC-003 application ports for business-case content registry and resolution.
 */

import type {
  BusinessCaseCatalogDetails,
  BusinessCaseCatalogEntry,
  BusinessCaseContentPackage,
  BusinessCaseContentVersion,
  BusinessCaseId,
  ContentPackageVersionId,
  ContentValidationResult,
  ExperienceLevel,
  LearnerId,
  TenantId,
} from "@projectsim/domain";

export interface ListSelectableCasesInput {
  readonly tenantId: TenantId;
  readonly learnerId: LearnerId;
  readonly locale: string;
}

export interface GetCaseDetailsInput {
  readonly tenantId: TenantId;
  readonly learnerId: LearnerId;
  readonly businessCaseId: BusinessCaseId;
  readonly locale: string;
  readonly contentVersion?: string;
}

export interface ResolveExactVersionInput {
  readonly businessCaseId: BusinessCaseId;
  readonly contentVersion: string;
}

export interface BusinessCaseCatalogService {
  listSelectableCases(
    input: ListSelectableCasesInput,
  ): Promise<readonly BusinessCaseCatalogEntry[]>;
  getCaseDetails(
    input: GetCaseDetailsInput,
  ): Promise<BusinessCaseCatalogDetails | null>;
}

export interface BusinessCaseValidator {
  validatePackage(
    pkg: BusinessCaseContentPackage,
  ): Promise<ContentValidationResult>;
}

export interface ContentPublisher {
  /**
   * Publish a validated package. Rejects invalid packages and refuses to mutate
   * an already-published (businessCaseId, contentVersion) pair in place.
   */
  publishPackage(
    pkg: BusinessCaseContentPackage,
  ): Promise<BusinessCaseContentVersion>;
}

export interface ContentChecksumService {
  compute(pkg: BusinessCaseContentPackage): string;
  verify(pkg: BusinessCaseContentPackage): boolean;
}

export interface BusinessCaseRegistry {
  listInstalledVersions(
    businessCaseId: BusinessCaseId,
  ): Promise<readonly BusinessCaseContentVersion[]>;
  getPublishedVersion(
    contentPackageVersionId: ContentPackageVersionId,
  ): Promise<BusinessCaseContentVersion | null>;
  resolveExactVersion(
    input: ResolveExactVersionInput,
  ): Promise<BusinessCaseContentVersion | null>;
  resolveDefaultPublishedVersion(
    businessCaseId: BusinessCaseId,
  ): Promise<BusinessCaseContentVersion | null>;
  /** Install / upsert a draft or validated package prior to publish. */
  saveDraft(
    pkg: BusinessCaseContentPackage,
  ): Promise<BusinessCaseContentVersion>;
}

/**
 * Exact-version content resolver. Never silently falls back to another version.
 * Cache keys must include businessCaseId + contentPackageVersionId + checksum.
 */
export interface ContentResolver {
  getPublishedVersion(
    contentPackageVersionId: ContentPackageVersionId,
  ): Promise<BusinessCaseContentVersion | null>;
  resolveExactVersion(
    input: ResolveExactVersionInput,
  ): Promise<BusinessCaseContentVersion | null>;
  /** Resolve pinned version for an existing run (retired allowed). */
  resolveForPinnedRun(
    contentPackageVersionId: ContentPackageVersionId,
  ): Promise<BusinessCaseContentVersion | null>;
}

export interface CreateSimulationRunFromCaseInput {
  readonly tenantId: TenantId;
  readonly actorId: string;
  readonly learnerId: LearnerId;
  readonly businessCaseId: BusinessCaseId;
  readonly experienceLevel: ExperienceLevel;
  readonly correlationId: string;
  readonly causationId: string | null;
  readonly simulationRunId?: string;
  readonly idempotencyKey?: string;
  /** Client-supplied version is ignored for authority; accepted only for mismatch detection. */
  readonly clientContentPackageVersionId?: ContentPackageVersionId;
}

export interface CreateSimulationRunFromCaseResult {
  readonly simulationRunId: string;
  readonly businessCaseId: BusinessCaseId;
  readonly contentVersion: string;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly experienceLevel: ExperienceLevel;
  readonly status: string;
  readonly runtimeVersion: string;
}
