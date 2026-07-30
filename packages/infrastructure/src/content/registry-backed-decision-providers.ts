/**
 * Decision / projection content providers backed by BusinessCaseRegistry (BC-004).
 *
 * Maps validated authored packages onto runtime DecisionDefinition and
 * projection-safe content for the run's pinned contentPackageVersionId.
 */

import type {
  DecisionDefinitionProvider,
  DecisionProjectionContentProvider,
} from "@projectsim/application";
import {
  mapBusinessCasePackageToProjectionSafeContent,
  mapBusinessCasePackageToRuntimeDecisions,
  type BusinessCaseContentVersion,
  type ContentPackageVersionId,
  type DecisionDefinition,
  type DecisionId,
  type ExperienceLevel,
  type TenantId,
} from "@projectsim/domain";

export interface ContentVersionLookup {
  getPublishedVersion(
    contentPackageVersionId: ContentPackageVersionId,
  ): Promise<BusinessCaseContentVersion | null>;
  /** Include retired/draft for pinned-run resolution when needed. */
  getVersionById?(
    contentPackageVersionId: ContentPackageVersionId,
  ): Promise<BusinessCaseContentVersion | null>;
}

export const createRegistryBackedDecisionDefinitionProvider = (
  lookup: ContentVersionLookup,
): DecisionDefinitionProvider => ({
  async getDecisionDefinition(
    _tenantId: TenantId,
    contentPackageVersionId: ContentPackageVersionId,
    decisionDefinitionId: DecisionId,
  ): Promise<DecisionDefinition | null> {
    const version =
      (await lookup.getVersionById?.(contentPackageVersionId)) ??
      (await lookup.getPublishedVersion(contentPackageVersionId));
    if (!version) {
      return null;
    }
    const definitions = mapBusinessCasePackageToRuntimeDecisions(
      version.package,
      contentPackageVersionId,
    );
    return definitions.find((d) => d.id === decisionDefinitionId) ?? null;
  },
});

export const createRegistryBackedProjectionContentProvider = (
  lookup: ContentVersionLookup,
  defaultExperienceLevel: ExperienceLevel = "practitioner",
): DecisionProjectionContentProvider => ({
  async listProjectionSafeContent(
    tenantId,
    contentPackageVersionId,
    experienceLevel,
  ) {
    void tenantId;
    const version =
      (await lookup.getVersionById?.(contentPackageVersionId)) ??
      (await lookup.getPublishedVersion(contentPackageVersionId));
    if (!version) {
      return null;
    }
    return mapBusinessCasePackageToProjectionSafeContent(
      version.package,
      contentPackageVersionId,
      experienceLevel ?? defaultExperienceLevel,
    );
  },
  async listEligibilityDefinitions(tenantId, contentPackageVersionId) {
    void tenantId;
    const version =
      (await lookup.getVersionById?.(contentPackageVersionId)) ??
      (await lookup.getPublishedVersion(contentPackageVersionId));
    if (!version) {
      return null;
    }
    return mapBusinessCasePackageToRuntimeDecisions(
      version.package,
      contentPackageVersionId,
    );
  },
});
