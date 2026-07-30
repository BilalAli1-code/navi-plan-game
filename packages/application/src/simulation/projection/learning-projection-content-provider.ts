import type {
  ContentPackageVersionId,
  ExperienceLevel,
  LearningSafeContent,
  TenantId,
} from "@projectsim/domain";

/**
 * Learner-safe learning content port (BC-006 Workstream 6).
 *
 * Maps authored business-case packages to learning metadata including
 * achievements, competencies, and coaching interventions.
 */
export interface LearningProjectionContentProvider {
  listLearningSafeContent(
    tenantId: TenantId,
    contentPackageVersionId: ContentPackageVersionId,
    experienceLevel?: ExperienceLevel | null,
    locale?: string,
  ): Promise<LearningSafeContent | null>;
}
