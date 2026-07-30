/**
 * Workplace projection type discriminators (PS-ROADMAP-009 / ADR-006).
 *
 * Executable registrations include Milestone 2 workplace surfaces plus BC-006
 * Workstream 5 `performance` and `learner_progression` (authoritative evidence
 * only — no XP/mastery/achievements/reflection).
 */

export const WORKPLACE_PROJECTION_TYPES = [
  "simulation",
  "mission_control",
  "inbox",
  "meetings",
  "stakeholders",
  "decision_log",
  "documents",
  "notifications",
  "activities",
  "completed_history",
  "performance",
  "learner_progression",
  "achievements",
  "mastery",
  "coaching",
] as const;

export type WorkplaceProjectionType =
  (typeof WORKPLACE_PROJECTION_TYPES)[number];

export const isWorkplaceProjectionType = (
  value: string,
): value is WorkplaceProjectionType =>
  (WORKPLACE_PROJECTION_TYPES as readonly string[]).includes(value);
