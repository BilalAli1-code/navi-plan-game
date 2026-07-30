/**
 * Content validation + publication orchestration (BC-003).
 */

import {
  computeBusinessCasePackageChecksum,
  stampPackageChecksum,
  validateBusinessCasePackage,
  type BusinessCaseContentPackage,
  type BusinessCaseContentVersion,
  type ContentValidationResult,
  ruleViolationError,
} from "@projectsim/domain";
import type {
  BusinessCaseRegistry,
  BusinessCaseValidator,
  ContentChecksumService,
  ContentPublisher,
} from "./ports";

export const createBusinessCaseValidator = (): BusinessCaseValidator => ({
  async validatePackage(pkg) {
    return validateBusinessCasePackage(pkg);
  },
});

export const createContentChecksumService = (): ContentChecksumService => ({
  compute(pkg) {
    return computeBusinessCasePackageChecksum(pkg);
  },
  verify(pkg) {
    if (!pkg.manifest.checksum) {
      return false;
    }
    return computeBusinessCasePackageChecksum(pkg) === pkg.manifest.checksum;
  },
});

export const createContentPublisher = (deps: {
  readonly registry: BusinessCaseRegistry;
  readonly validator: BusinessCaseValidator;
}): ContentPublisher => ({
  async publishPackage(pkg: BusinessCaseContentPackage) {
    const stamped = stampPackageChecksum({
      ...pkg,
      manifest: {
        ...pkg.manifest,
        publicationStatus: "published",
        checksum: "",
      },
    });

    const validation: ContentValidationResult =
      await deps.validator.validatePackage(stamped);
    if (validation.status !== "passed") {
      throw ruleViolationError(
        "CONTENT_PACKAGE_VERSION_IMMUTABLE",
        "Cannot publish invalid business-case content.",
        {
          businessCaseId: stamped.manifest.businessCaseId,
          contentVersion: stamped.manifest.contentVersion,
          errorCount: validation.errors.length,
          errors: validation.errors.slice(0, 10).map((e) => ({
            code: e.code,
            path: e.path,
            message: e.message,
          })),
        },
      );
    }

    const existing = await deps.registry.resolveExactVersion({
      businessCaseId: stamped.manifest.businessCaseId,
      contentVersion: stamped.manifest.contentVersion,
    });
    if (existing && existing.publicationStatus === "published") {
      if (existing.checksum !== stamped.manifest.checksum) {
        throw ruleViolationError(
          "CONTENT_PACKAGE_VERSION_IMMUTABLE",
          "Published content cannot be changed in place; publish a new semantic version.",
          {
            businessCaseId: stamped.manifest.businessCaseId,
            contentVersion: stamped.manifest.contentVersion,
          },
        );
      }
      return existing;
    }

    const draft: BusinessCaseContentVersion =
      await deps.registry.saveDraft(stamped);
    // Registry adapters mark publication on save when status is published.
    return draft;
  },
});
