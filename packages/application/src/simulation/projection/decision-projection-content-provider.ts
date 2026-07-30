import type {
  ContentPackageVersionId,
  DecisionDefinition,
  ExperienceLevel,
  ProjectionSafeContent,
  TenantId,
} from "@projectsim/domain";

/**
 * Projection-safe content port (PS-ROADMAP-006).
 *
 * Lists learner-safe decision definitions without hidden outcomes/consequences.
 * Eligibility still uses full DecisionDefinition via the companion loader.
 */
export interface DecisionProjectionContentProvider {
  listProjectionSafeContent(
    tenantId: TenantId,
    contentPackageVersionId: ContentPackageVersionId,
    experienceLevel?: ExperienceLevel | null,
  ): Promise<ProjectionSafeContent | null>;

  /** Full definitions for eligibility parity only. */
  listEligibilityDefinitions(
    tenantId: TenantId,
    contentPackageVersionId: ContentPackageVersionId,
  ): Promise<readonly DecisionDefinition[] | null>;
}
