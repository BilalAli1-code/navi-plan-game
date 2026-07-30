/**
 * BC-003 content-package identifiers and format rules.
 *
 * Complements shared-kernel brands. Local entity IDs are scoped to one
 * (businessCaseId, contentVersion) package — not globally unique.
 */

import {
  asId,
  type Brand,
  type BusinessCaseId,
  type ContentPackageVersionId,
  type Id,
} from "../../../shared-kernel/ids";
import { err, ok, type Result } from "../../../shared-kernel/result";
import {
  validationError,
  type ValidationError,
} from "../../../shared-kernel/errors";

export type LocaleCode = Brand<string, "LocaleCode">;
export type AssetId = Id<"AssetId">;
export type CrisisId = Id<"CrisisId">;
export type AchievementId = Id<"AchievementId">;
export type OutcomeId = Id<"OutcomeId">;
export type LearningObjectiveId = Id<"LearningObjectiveId">;
export type CompetencyId = Id<"CompetencyId">;
export type EvidenceTag = Brand<string, "EvidenceTag">;
export type NarrativeFlag = Brand<string, "NarrativeFlag">;
export type ContentEventId = Id<"ContentEventId">;
export type MessageDefinitionId = Id<"MessageDefinitionId">;
export type PmbokAlignmentTag = Brand<string, "PmbokAlignmentTag">;

export const asLocaleCode = (value: string): LocaleCode => value as LocaleCode;
export const asAssetId = (value: string): AssetId => asId(value);
export const asCrisisId = (value: string): CrisisId => asId(value);
export const asAchievementId = (value: string): AchievementId => asId(value);
export const asOutcomeId = (value: string): OutcomeId => asId(value);
export const asLearningObjectiveId = (value: string): LearningObjectiveId =>
  asId(value);
export const asCompetencyId = (value: string): CompetencyId => asId(value);
export const asEvidenceTag = (value: string): EvidenceTag =>
  value as EvidenceTag;
export const asNarrativeFlag = (value: string): NarrativeFlag =>
  value as NarrativeFlag;
export const asContentEventId = (value: string): ContentEventId => asId(value);
export const asMessageDefinitionId = (value: string): MessageDefinitionId =>
  asId(value);
export const asPmbokAlignmentTag = (value: string): PmbokAlignmentTag =>
  value as PmbokAlignmentTag;

/** Public business-case id: lowercase kebab-case, 3–80 chars, starts with letter. */
export const BUSINESS_CASE_ID_PATTERN = /^[a-z][a-z0-9-]{2,79}$/;

/** Semantic version without `v` prefix. */
export const CONTENT_VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** Locale like en-US. */
export const LOCALE_CODE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

/** Local entity id: lowercase kebab / dotted segments. */
export const LOCAL_ENTITY_ID_PATTERN = /^[a-z][a-z0-9._-]{1,119}$/;

export const validateBusinessCaseIdFormat = (
  value: string,
): Result<BusinessCaseId, ValidationError> => {
  if (!BUSINESS_CASE_ID_PATTERN.test(value)) {
    return err(
      validationError(
        [
          {
            path: "businessCaseId",
            reason: "invalid",
            message:
              "business_case_id must be lowercase kebab-case (3–80 chars, start with a letter).",
          },
        ],
        "business_case_id format is invalid.",
      ),
    );
  }
  return ok(value as BusinessCaseId);
};

export const validateContentVersionFormat = (
  value: string,
): Result<string, ValidationError> => {
  if (!CONTENT_VERSION_PATTERN.test(value)) {
    return err(
      validationError(
        [
          {
            path: "contentVersion",
            reason: "invalid",
            message:
              "content_version must be MAJOR.MINOR.PATCH semantic version without a v prefix.",
          },
        ],
        "content_version format is invalid.",
      ),
    );
  }
  return ok(value);
};

export const validateLocaleCodeFormat = (
  value: string,
): Result<LocaleCode, ValidationError> => {
  if (!LOCALE_CODE_PATTERN.test(value)) {
    return err(
      validationError(
        [
          {
            path: "locale",
            reason: "invalid",
            message: "locale must look like en or en-US.",
          },
        ],
        "locale format is invalid.",
      ),
    );
  }
  return ok(asLocaleCode(value));
};

export const validateLocalEntityIdFormat = (
  value: string,
  field: string,
): Result<string, ValidationError> => {
  if (!LOCAL_ENTITY_ID_PATTERN.test(value)) {
    return err(
      validationError(
        [
          {
            path: field,
            reason: "invalid",
            message: `${field} must be a stable local entity id (lowercase, dotted/kebab).`,
          },
        ],
        `${field} format is invalid.`,
      ),
    );
  }
  return ok(value);
};

export const isValidContentVersion = (value: string): boolean =>
  CONTENT_VERSION_PATTERN.test(value);

export const isValidLocalEntityId = (value: string): boolean =>
  LOCAL_ENTITY_ID_PATTERN.test(value);

export const isValidBusinessCaseId = (value: string): boolean =>
  BUSINESS_CASE_ID_PATTERN.test(value);

export type { BusinessCaseId, ContentPackageVersionId };
