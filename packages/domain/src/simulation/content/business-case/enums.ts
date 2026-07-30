/**
 * BC-003 enums and publication/catalog status values.
 */

export const EXPERIENCE_LEVELS = [
  "explorer",
  "practitioner",
  "leader",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const isExperienceLevel = (value: string): value is ExperienceLevel =>
  (EXPERIENCE_LEVELS as readonly string[]).includes(value);

export const CONTENT_PUBLICATION_STATUSES = [
  "draft",
  "validating",
  "validated",
  "in_review",
  "approved",
  "published",
  "retired",
] as const;
export type ContentPublicationStatus =
  (typeof CONTENT_PUBLICATION_STATUSES)[number];

export const CASE_AVAILABILITIES = [
  "available",
  "coming_soon",
  "restricted",
  "retired",
] as const;
export type CaseAvailability = (typeof CASE_AVAILABILITIES)[number];

export const DIFFICULTIES = [
  "introductory",
  "intermediate",
  "advanced",
  "adaptive",
] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Current runtime compatibility token required for publication / selection. */
export const CURRENT_RUNTIME_COMPATIBILITY = "projectsim-runtime/1" as const;

/** Content package schema version implemented by this codebase. */
export const BUSINESS_CASE_CONTENT_SCHEMA_VERSION = 1 as const;
