import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import { err, type Result } from "../shared-kernel/result";
import type { SimulationProjection } from "./contracts";
import { SIMULATION_PROJECTION_TYPE } from "./contracts";
import type { DecisionLogProjection } from "./decision-log-contracts";
import { DECISION_LOG_PROJECTION_TYPE } from "./decision-log-contracts";
import {
  parseDecisionLogProjection,
  serializeDecisionLogProjection,
} from "./decision-log-payload";
import type { DocumentsProjection } from "./documents-contracts";
import { DOCUMENTS_PROJECTION_TYPE } from "./documents-contracts";
import {
  parseDocumentsProjection,
  serializeDocumentsProjection,
} from "./documents-payload";
import type { NotificationsProjection } from "./notifications-contracts";
import { NOTIFICATIONS_PROJECTION_TYPE } from "./notifications-contracts";
import {
  parseNotificationsProjection,
  serializeNotificationsProjection,
} from "./notifications-payload";
import type { ActivitiesProjection } from "./activities-contracts";
import { ACTIVITIES_PROJECTION_TYPE } from "./activities-contracts";
import {
  parseActivitiesProjection,
  serializeActivitiesProjection,
} from "./activities-payload";
import type { CompletedHistoryProjection } from "./completed-history-contracts";
import { COMPLETED_HISTORY_PROJECTION_TYPE } from "./completed-history-contracts";
import {
  parseCompletedHistoryProjection,
  serializeCompletedHistoryProjection,
} from "./completed-history-payload";
import type { PerformanceProjection } from "./performance-contracts";
import { PERFORMANCE_PROJECTION_TYPE } from "./performance-contracts";
import {
  parsePerformanceProjection,
  serializePerformanceProjection,
} from "./performance-payload";
import type { LearnerProgressionProjection } from "./learner-progression-contracts";
import { LEARNER_PROGRESSION_PROJECTION_TYPE } from "./learner-progression-contracts";
import {
  parseLearnerProgressionProjection,
  serializeLearnerProgressionProjection,
} from "./learner-progression-payload";
import type { AchievementsProjection } from "./achievements-contracts";
import { ACHIEVEMENTS_PROJECTION_TYPE } from "./achievements-contracts";
import {
  parseAchievementsProjection,
  serializeAchievementsProjection,
} from "./achievements-payload";
import type { MasteryProjection } from "./mastery-contracts";
import { MASTERY_PROJECTION_TYPE } from "./mastery-contracts";
import {
  parseMasteryProjection,
  serializeMasteryProjection,
} from "./mastery-payload";
import type { CoachingProjection } from "./coaching-contracts";
import { COACHING_PROJECTION_TYPE } from "./coaching-contracts";
import {
  parseCoachingProjection,
  serializeCoachingProjection,
} from "./coaching-payload";
import type { InboxProjection } from "./inbox-contracts";
import { INBOX_PROJECTION_TYPE } from "./inbox-contracts";
import {
  parseInboxProjection,
  serializeInboxProjection,
} from "./inbox-payload";
import type { MeetingsProjection } from "./meetings-contracts";
import { MEETINGS_PROJECTION_TYPE } from "./meetings-contracts";
import {
  parseMeetingsProjection,
  serializeMeetingsProjection,
} from "./meetings-payload";
import type { MissionControlProjection } from "./mission-control-contracts";
import { MISSION_CONTROL_PROJECTION_TYPE } from "./mission-control-contracts";
import {
  parseMissionControlProjection,
  serializeMissionControlProjection,
} from "./mission-control-payload";
import {
  parseSimulationProjection,
  serializeSimulationProjection,
} from "./payload";
import type { StakeholdersProjection } from "./stakeholders-contracts";
import { STAKEHOLDERS_PROJECTION_TYPE } from "./stakeholders-contracts";
import {
  parseStakeholdersProjection,
  serializeStakeholdersProjection,
} from "./stakeholders-payload";

/**
 * Discriminated union of registered workplace projection row shapes.
 * Persistence and saveIfNewer operate on this union; public APIs remain typed.
 */
export type WorkplaceProjection =
  | SimulationProjection
  | MissionControlProjection
  | DecisionLogProjection
  | InboxProjection
  | MeetingsProjection
  | StakeholdersProjection
  | DocumentsProjection
  | NotificationsProjection
  | ActivitiesProjection
  | CompletedHistoryProjection
  | PerformanceProjection
  | LearnerProgressionProjection
  | AchievementsProjection
  | MasteryProjection
  | CoachingProjection;

export const isSimulationProjection = (
  value: WorkplaceProjection,
): value is SimulationProjection =>
  value.projectionType === SIMULATION_PROJECTION_TYPE;

export const isMissionControlProjection = (
  value: WorkplaceProjection,
): value is MissionControlProjection =>
  value.projectionType === MISSION_CONTROL_PROJECTION_TYPE;

export const isDecisionLogProjection = (
  value: WorkplaceProjection,
): value is DecisionLogProjection =>
  value.projectionType === DECISION_LOG_PROJECTION_TYPE;

export const isInboxProjection = (
  value: WorkplaceProjection,
): value is InboxProjection => value.projectionType === INBOX_PROJECTION_TYPE;

export const isMeetingsProjection = (
  value: WorkplaceProjection,
): value is MeetingsProjection =>
  value.projectionType === MEETINGS_PROJECTION_TYPE;

export const isStakeholdersProjection = (
  value: WorkplaceProjection,
): value is StakeholdersProjection =>
  value.projectionType === STAKEHOLDERS_PROJECTION_TYPE;

export const isDocumentsProjection = (
  value: WorkplaceProjection,
): value is DocumentsProjection =>
  value.projectionType === DOCUMENTS_PROJECTION_TYPE;

export const isNotificationsProjection = (
  value: WorkplaceProjection,
): value is NotificationsProjection =>
  value.projectionType === NOTIFICATIONS_PROJECTION_TYPE;

export const isActivitiesProjection = (
  value: WorkplaceProjection,
): value is ActivitiesProjection =>
  value.projectionType === ACTIVITIES_PROJECTION_TYPE;

export const isCompletedHistoryProjection = (
  value: WorkplaceProjection,
): value is CompletedHistoryProjection =>
  value.projectionType === COMPLETED_HISTORY_PROJECTION_TYPE;

export const isPerformanceProjection = (
  value: WorkplaceProjection,
): value is PerformanceProjection =>
  value.projectionType === PERFORMANCE_PROJECTION_TYPE;

export const isLearnerProgressionProjection = (
  value: WorkplaceProjection,
): value is LearnerProgressionProjection =>
  value.projectionType === LEARNER_PROGRESSION_PROJECTION_TYPE;

export const isAchievementsProjection = (
  value: WorkplaceProjection,
): value is AchievementsProjection =>
  value.projectionType === ACHIEVEMENTS_PROJECTION_TYPE;

export const isMasteryProjection = (
  value: WorkplaceProjection,
): value is MasteryProjection =>
  value.projectionType === MASTERY_PROJECTION_TYPE;

export const isCoachingProjection = (
  value: WorkplaceProjection,
): value is CoachingProjection =>
  value.projectionType === COACHING_PROJECTION_TYPE;

export const parseWorkplaceProjection = (
  value: unknown,
): Result<WorkplaceProjection, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  const projectionType = (value as { projectionType?: unknown }).projectionType;
  if (projectionType === SIMULATION_PROJECTION_TYPE) {
    return parseSimulationProjection(value);
  }
  if (projectionType === MISSION_CONTROL_PROJECTION_TYPE) {
    return parseMissionControlProjection(value);
  }
  if (projectionType === DECISION_LOG_PROJECTION_TYPE) {
    return parseDecisionLogProjection(value);
  }
  if (projectionType === INBOX_PROJECTION_TYPE) {
    return parseInboxProjection(value);
  }
  if (projectionType === MEETINGS_PROJECTION_TYPE) {
    return parseMeetingsProjection(value);
  }
  if (projectionType === STAKEHOLDERS_PROJECTION_TYPE) {
    return parseStakeholdersProjection(value);
  }
  if (projectionType === DOCUMENTS_PROJECTION_TYPE) {
    return parseDocumentsProjection(value);
  }
  if (projectionType === NOTIFICATIONS_PROJECTION_TYPE) {
    return parseNotificationsProjection(value);
  }
  if (projectionType === ACTIVITIES_PROJECTION_TYPE) {
    return parseActivitiesProjection(value);
  }
  if (projectionType === COMPLETED_HISTORY_PROJECTION_TYPE) {
    return parseCompletedHistoryProjection(value);
  }
  if (projectionType === PERFORMANCE_PROJECTION_TYPE) {
    return parsePerformanceProjection(value);
  }
  if (projectionType === LEARNER_PROGRESSION_PROJECTION_TYPE) {
    return parseLearnerProgressionProjection(value);
  }
  if (projectionType === ACHIEVEMENTS_PROJECTION_TYPE) {
    return parseAchievementsProjection(value);
  }
  if (projectionType === MASTERY_PROJECTION_TYPE) {
    return parseMasteryProjection(value);
  }
  if (projectionType === COACHING_PROJECTION_TYPE) {
    return parseCoachingProjection(value);
  }
  return err(
    ruleViolationError(
      "PROJECTION_PAYLOAD_INVALID",
      `Unsupported projection type '${String(projectionType)}'.`,
    ),
  );
};

export const serializeWorkplaceProjection = (
  projection: WorkplaceProjection,
): Readonly<Record<string, unknown>> => {
  if (isMissionControlProjection(projection)) {
    return serializeMissionControlProjection(projection);
  }
  if (isDecisionLogProjection(projection)) {
    return serializeDecisionLogProjection(projection);
  }
  if (isInboxProjection(projection)) {
    return serializeInboxProjection(projection);
  }
  if (isMeetingsProjection(projection)) {
    return serializeMeetingsProjection(projection);
  }
  if (isStakeholdersProjection(projection)) {
    return serializeStakeholdersProjection(projection);
  }
  if (isDocumentsProjection(projection)) {
    return serializeDocumentsProjection(projection);
  }
  if (isNotificationsProjection(projection)) {
    return serializeNotificationsProjection(projection);
  }
  if (isActivitiesProjection(projection)) {
    return serializeActivitiesProjection(projection);
  }
  if (isCompletedHistoryProjection(projection)) {
    return serializeCompletedHistoryProjection(projection);
  }
  if (isPerformanceProjection(projection)) {
    return serializePerformanceProjection(projection);
  }
  if (isLearnerProgressionProjection(projection)) {
    return serializeLearnerProgressionProjection(projection);
  }
  if (isAchievementsProjection(projection)) {
    return serializeAchievementsProjection(projection);
  }
  if (isMasteryProjection(projection)) {
    return serializeMasteryProjection(projection);
  }
  if (isCoachingProjection(projection)) {
    return serializeCoachingProjection(projection);
  }
  return serializeSimulationProjection(projection);
};
