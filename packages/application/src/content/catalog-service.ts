/**
 * Learner-safe business-case catalog use cases (BC-003).
 */

import {
  CURRENT_RUNTIME_COMPATIBILITY,
  isSelectableForNewRuns,
  resolveLocalizedText,
  type BusinessCaseCatalogDetails,
  type BusinessCaseCatalogEntry,
  type BusinessCaseContentVersion,
  type ContentValidationResult,
} from "@projectsim/domain";
import type {
  BusinessCaseCatalogService,
  GetCaseDetailsInput,
  ListSelectableCasesInput,
} from "./ports";

const toCatalogEntry = (
  version: BusinessCaseContentVersion,
  locale: string,
  selectable: boolean,
): BusinessCaseCatalogEntry => {
  const { manifest } = version.package;
  const text = (localized: {
    readonly values: Readonly<Record<string, string>>;
  }) => resolveLocalizedText(localized, locale, manifest.defaultLocale) ?? "";

  return {
    businessCaseId: version.businessCaseId,
    contentVersion: version.contentVersion,
    contentPackageVersionId: version.contentPackageVersionId,
    title: text(manifest.title),
    shortTitle: text(manifest.shortTitle),
    summary: text(manifest.summary),
    industry: text(manifest.industry),
    organizationType: text(manifest.organizationType),
    projectType: text(manifest.projectType),
    estimatedMinutes: manifest.estimatedMinutes,
    learningDays: manifest.learningDays,
    difficulty: manifest.difficulty,
    supportedExperienceLevels: manifest.supportedExperienceLevels,
    availability: manifest.availability,
    selectable,
    accessibilitySummary: text(manifest.accessibilitySummary),
  };
};

export const createBusinessCaseCatalogService = (deps: {
  readonly listCandidateVersions: () => Promise<
    readonly BusinessCaseContentVersion[]
  >;
  readonly getValidationResult: (
    version: BusinessCaseContentVersion,
  ) => ContentValidationResult;
}): BusinessCaseCatalogService => ({
  async listSelectableCases(input: ListSelectableCasesInput) {
    void input.tenantId;
    void input.learnerId;
    const candidates = await deps.listCandidateVersions();
    const entries: BusinessCaseCatalogEntry[] = [];
    for (const version of candidates) {
      if (
        version.package.runtimeCompatibility !== CURRENT_RUNTIME_COMPATIBILITY
      ) {
        continue;
      }
      const validation = deps.getValidationResult(version);
      if (!isSelectableForNewRuns(version.package, validation)) {
        continue;
      }
      entries.push(toCatalogEntry(version, input.locale, true));
    }
    return entries.sort((a, b) => a.title.localeCompare(b.title));
  },

  async getCaseDetails(input: GetCaseDetailsInput) {
    const candidates = await deps.listCandidateVersions();
    const match = candidates.find((version) => {
      if (version.businessCaseId !== input.businessCaseId) {
        return false;
      }
      if (input.contentVersion !== undefined) {
        return version.contentVersion === input.contentVersion;
      }
      return (
        version.isDefaultForNewRuns && version.publicationStatus === "published"
      );
    });
    if (!match) {
      return null;
    }
    const validation = deps.getValidationResult(match);
    if (!isSelectableForNewRuns(match.package, validation)) {
      return null;
    }
    const entry = toCatalogEntry(match, input.locale, true);
    const { manifest } = match.package;
    const text = (localized: {
      readonly values: Readonly<Record<string, string>>;
    }) =>
      resolveLocalizedText(localized, input.locale, manifest.defaultLocale) ??
      "";
    const details: BusinessCaseCatalogDetails = {
      ...entry,
      learningFocus: manifest.learningFocus.map((item) => text(item)),
      learnerRole: text(manifest.learnerRole),
      prerequisites: manifest.prerequisites.map((item) => text(item)),
      chapterCount: manifest.chapterCount,
      pmbokAlignment: [...manifest.pmbokAlignment],
    };
    return details;
  },
});
