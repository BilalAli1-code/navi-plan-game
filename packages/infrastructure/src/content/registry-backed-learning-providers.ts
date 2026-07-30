/**
 * Learning projection content providers backed by BusinessCaseRegistry (BC-006 W6).
 */

import type { LearningProjectionContentProvider } from "@projectsim/application";
import {
  createNorthstarCanonicalContractSet,
  mapBusinessCasePackageToLearningSafeContent,
  type BusinessCaseContentVersion,
  type ExperienceLevel,
} from "@projectsim/domain";
import type { ContentVersionLookup } from "./registry-backed-decision-providers";

const NORTHSTAR_BUSINESS_CASE_ID = "northstar-connected-care";

export const createRegistryBackedLearningProjectionContentProvider = (
  lookup: ContentVersionLookup,
  _defaultExperienceLevel: ExperienceLevel = "practitioner",
): LearningProjectionContentProvider => ({
  async listLearningSafeContent(
    _tenantId,
    contentPackageVersionId,
    _experienceLevel,
    locale,
  ) {
    const version =
      (await lookup.getVersionById?.(contentPackageVersionId)) ??
      (await lookup.getPublishedVersion(contentPackageVersionId));
    if (!version) {
      return null;
    }
    const coachingInterventions = resolveCoachingInterventions(version);
    const resolvedLocale = locale ?? version.package.manifest.defaultLocale;
    return mapBusinessCasePackageToLearningSafeContent(
      version.package,
      contentPackageVersionId,
      resolvedLocale,
      coachingInterventions,
    );
  },
});

const resolveCoachingInterventions = (version: BusinessCaseContentVersion) => {
  if (version.package.manifest.businessCaseId === NORTHSTAR_BUSINESS_CASE_ID) {
    return createNorthstarCanonicalContractSet(version.package)
      .coachingInterventions;
  }
  return [];
};
