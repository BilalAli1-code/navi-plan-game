/**
 * Structured BC-003 validation results.
 */

import type {
  BusinessCaseId,
  ContentPackageVersionId,
} from "../../../shared-kernel/ids";

export type ContentValidationSeverity = "error" | "warning";

export interface ContentValidationIssue {
  readonly code: string;
  readonly severity: ContentValidationSeverity;
  readonly message: string;
  readonly path: string;
  readonly businessCaseId: BusinessCaseId | null;
  readonly contentVersion: string | null;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly fieldPath: string | null;
  readonly relatedEntityId: string | null;
  readonly relatedIds: readonly string[];
  readonly suggestedResolution: string | null;
}

export interface ContentValidationResult {
  readonly validationRunId: string;
  readonly contentPackageVersionId: ContentPackageVersionId | null;
  readonly businessCaseId: BusinessCaseId;
  readonly contentVersion: string;
  readonly checksum: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly status: "passed" | "failed";
  readonly errors: readonly ContentValidationIssue[];
  readonly warnings: readonly ContentValidationIssue[];
  readonly validatorVersion: string;
}

export const CONTENT_VALIDATOR_VERSION = "bc003-validator/1" as const;

export const issue = (partial: {
  readonly code: string;
  readonly severity: ContentValidationSeverity;
  readonly message: string;
  readonly path: string;
  readonly businessCaseId?: BusinessCaseId | null;
  readonly contentVersion?: string | null;
  readonly entityType?: string | null;
  readonly entityId?: string | null;
  readonly fieldPath?: string | null;
  readonly relatedEntityId?: string | null;
  readonly relatedIds?: readonly string[];
  readonly suggestedResolution?: string | null;
}): ContentValidationIssue => ({
  code: partial.code,
  severity: partial.severity,
  message: partial.message,
  path: partial.path,
  businessCaseId: partial.businessCaseId ?? null,
  contentVersion: partial.contentVersion ?? null,
  entityType: partial.entityType ?? null,
  entityId: partial.entityId ?? null,
  fieldPath: partial.fieldPath ?? null,
  relatedEntityId: partial.relatedEntityId ?? null,
  relatedIds: partial.relatedIds ?? [],
  suggestedResolution: partial.suggestedResolution ?? null,
});
