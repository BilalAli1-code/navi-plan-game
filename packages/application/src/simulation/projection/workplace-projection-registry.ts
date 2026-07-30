import type {
  ActorId,
  CausationId,
  CorrelationId,
  EventId,
  SimulationRunId,
  WorkplaceProjectionType,
} from "@projectsim/domain";
import {
  ACTIVITIES_PROJECTION_TYPE,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  DECISION_LOG_PROJECTION_TYPE,
  DOCUMENTS_PROJECTION_TYPE,
  INBOX_PROJECTION_TYPE,
  LEARNER_PROGRESSION_PROJECTION_TYPE,
  MEETINGS_PROJECTION_TYPE,
  MISSION_CONTROL_PROJECTION_TYPE,
  NOTIFICATIONS_PROJECTION_TYPE,
  PERFORMANCE_PROJECTION_TYPE,
  ACHIEVEMENTS_PROJECTION_TYPE,
  MASTERY_PROJECTION_TYPE,
  COACHING_PROJECTION_TYPE,
  SIMULATION_PROJECTION_TYPE,
  STAKEHOLDERS_PROJECTION_TYPE,
} from "@projectsim/domain";
import type { RebuildActivitiesProjectionService } from "./rebuild-activities-projection-service";
import type { RebuildCompletedHistoryProjectionService } from "./rebuild-completed-history-projection-service";
import type { RebuildDecisionLogProjectionService } from "./rebuild-decision-log-projection-service";
import type { RebuildDocumentsProjectionService } from "./rebuild-documents-projection-service";
import type { RebuildInboxProjectionService } from "./rebuild-inbox-projection-service";
import type { RebuildAchievementsProjectionService } from "./rebuild-achievements-projection-service";
import type { RebuildCoachingProjectionService } from "./rebuild-coaching-projection-service";
import type { RebuildLearnerProgressionProjectionService } from "./rebuild-learner-progression-projection-service";
import type { RebuildMasteryProjectionService } from "./rebuild-mastery-projection-service";
import type { RebuildMeetingsProjectionService } from "./rebuild-meetings-projection-service";
import type { RebuildMissionControlProjectionService } from "./rebuild-mission-control-projection-service";
import type { RebuildNotificationsProjectionService } from "./rebuild-notifications-projection-service";
import type { RebuildPerformanceProjectionService } from "./rebuild-performance-projection-service";
import type { RebuildSimulationProjectionService } from "./rebuild-simulation-projection-service";
import type { RebuildStakeholdersProjectionService } from "./rebuild-stakeholders-projection-service";

/**
 * Shared workplace projection rebuild registry (PS-ROADMAP-010 / ADR-006).
 *
 * Registered production types: `simulation`, `mission_control`, `decision_log`,
 * `inbox`, `meetings`, `stakeholders`, `documents` (PS-ROADMAP-020),
 * `notifications` (PS-ROADMAP-021), `activities`, and `completed_history`
 * (PS-ROADMAP-022).
 */

export interface WorkplaceProjectionRebuildRequest {
  readonly simulationRunId: SimulationRunId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly actorId: ActorId | null;
  readonly sourceEventId?: EventId;
  readonly sourceEventType?: string;
}

export interface WorkplaceProjectionRebuildHandler {
  readonly projectionType: WorkplaceProjectionType;
  rebuild(
    input: WorkplaceProjectionRebuildRequest,
  ): Promise<{ readonly ok: boolean }>;
}

/** Event types that may invalidate one or more workplace projections. */
export const DEFAULT_WORKPLACE_PROJECTION_TRIGGER_EVENT_TYPES = [
  "SimulationRunCreated",
  "SimulationRunStarted",
  "SimulationRunPaused",
  "SimulationRunResumed",
  "SimulationRunCompleted",
  "SimulationRunFailed",
  "SimulationRunRecovered",
  "SimulationRunArchived",
  "DecisionSubmitted",
  "DecisionResolved",
  "ProjectMetricChanged",
  "ProjectStateTransitioned",
  "LearnerMessageDelivered",
  "MeetingScheduled",
  "MeetingMadeAvailable",
  "MeetingStarted",
  "MeetingCompleted",
  "MeetingCancelled",
  "StakeholderInitialized",
  "StakeholderConversationOpened",
  "StakeholderMessageSent",
  "DocumentInitialized",
  "NotificationInitialized",
  "ActivityInitialized",
  "ActivityCompleted",
] as const;

const FULL_FAMILY: readonly WorkplaceProjectionType[] = [
  SIMULATION_PROJECTION_TYPE,
  MISSION_CONTROL_PROJECTION_TYPE,
  DECISION_LOG_PROJECTION_TYPE,
  INBOX_PROJECTION_TYPE,
  MEETINGS_PROJECTION_TYPE,
  STAKEHOLDERS_PROJECTION_TYPE,
  DOCUMENTS_PROJECTION_TYPE,
  NOTIFICATIONS_PROJECTION_TYPE,
  ACTIVITIES_PROJECTION_TYPE,
  COMPLETED_HISTORY_PROJECTION_TYPE,
  PERFORMANCE_PROJECTION_TYPE,
  LEARNER_PROGRESSION_PROJECTION_TYPE,
  ACHIEVEMENTS_PROJECTION_TYPE,
  MASTERY_PROJECTION_TYPE,
  COACHING_PROJECTION_TYPE,
];

const MEETING_EVENTS = new Set<string>([
  "MeetingScheduled",
  "MeetingMadeAvailable",
  "MeetingStarted",
  "MeetingCompleted",
  "MeetingCancelled",
]);

const STAKEHOLDER_EVENTS = new Set<string>([
  "StakeholderInitialized",
  "StakeholderConversationOpened",
  "StakeholderMessageSent",
]);

const DOCUMENT_EVENTS = new Set<string>(["DocumentInitialized"]);

const NOTIFICATION_EVENTS = new Set<string>(["NotificationInitialized"]);

/** ActivityInitialized → activities only; ActivityCompleted → activities + completed_history */
const ACTIVITY_INITIALIZED_EVENTS = new Set<string>(["ActivityInitialized"]);
const ACTIVITY_COMPLETED_EVENTS = new Set<string>(["ActivityCompleted"]);

/**
 * Declares which projection types must rebuild for a Domain event type.
 * Atomic fan-out: all listed types for an event are rebuild targets.
 *
 * - `LearnerMessageDelivered` → Inbox only
 * - Meeting lifecycle events → Meetings + Mission Control (upcoming count)
 * - Stakeholder authority events → Stakeholders only
 * - Document authority events → Documents only
 * - Notification authority events → Notifications only
 * - `ActivityInitialized` → Activities only
 * - `ActivityCompleted` → Activities + Completed History
 * - Other workplace triggers → full registered family
 */
export const defaultWorkplaceProjectionFanOut = (
  eventType: string,
): readonly WorkplaceProjectionType[] => {
  if (eventType === "LearnerMessageDelivered") {
    return [INBOX_PROJECTION_TYPE];
  }
  if (MEETING_EVENTS.has(eventType)) {
    return [MEETINGS_PROJECTION_TYPE, MISSION_CONTROL_PROJECTION_TYPE];
  }
  if (STAKEHOLDER_EVENTS.has(eventType)) {
    return [STAKEHOLDERS_PROJECTION_TYPE];
  }
  if (DOCUMENT_EVENTS.has(eventType)) {
    return [DOCUMENTS_PROJECTION_TYPE];
  }
  if (NOTIFICATION_EVENTS.has(eventType)) {
    return [NOTIFICATIONS_PROJECTION_TYPE];
  }
  if (ACTIVITY_INITIALIZED_EVENTS.has(eventType)) {
    return [ACTIVITIES_PROJECTION_TYPE];
  }
  if (ACTIVITY_COMPLETED_EVENTS.has(eventType)) {
    return [ACTIVITIES_PROJECTION_TYPE, COMPLETED_HISTORY_PROJECTION_TYPE];
  }
  if (
    (
      DEFAULT_WORKPLACE_PROJECTION_TRIGGER_EVENT_TYPES as readonly string[]
    ).includes(eventType)
  ) {
    return FULL_FAMILY;
  }
  return [];
};

export interface WorkplaceProjectionRegistry {
  readonly registeredTypes: readonly WorkplaceProjectionType[];
  handlerFor(
    projectionType: WorkplaceProjectionType,
  ): WorkplaceProjectionRebuildHandler | undefined;
  projectionTypesForEvent(
    eventType: string,
  ): readonly WorkplaceProjectionType[];
}

export const createWorkplaceProjectionRegistry = (input: {
  readonly handlers: readonly WorkplaceProjectionRebuildHandler[];
  readonly fanOut?: (eventType: string) => readonly WorkplaceProjectionType[];
}): WorkplaceProjectionRegistry => {
  const byType = new Map<
    WorkplaceProjectionType,
    WorkplaceProjectionRebuildHandler
  >();
  for (const handler of input.handlers) {
    if (byType.has(handler.projectionType)) {
      throw new Error(
        `Duplicate workplace projection handler for type '${handler.projectionType}'.`,
      );
    }
    byType.set(handler.projectionType, handler);
  }
  const fanOut = input.fanOut ?? defaultWorkplaceProjectionFanOut;
  return {
    registeredTypes: [...byType.keys()],
    handlerFor(projectionType) {
      return byType.get(projectionType);
    },
    projectionTypesForEvent(eventType) {
      return fanOut(eventType).filter((type) => byType.has(type));
    },
  };
};

/** Adapter: wrap the existing simulation rebuild service as a registry handler. */
export const simulationProjectionRebuildHandler = (
  rebuildService: RebuildSimulationProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: SIMULATION_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Documents rebuild service as a registry handler. */
export const documentsProjectionRebuildHandler = (
  rebuildService: RebuildDocumentsProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: DOCUMENTS_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Mission Control rebuild service as a registry handler. */
export const missionControlProjectionRebuildHandler = (
  rebuildService: RebuildMissionControlProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: MISSION_CONTROL_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Decision Log rebuild service as a registry handler. */
export const decisionLogProjectionRebuildHandler = (
  rebuildService: RebuildDecisionLogProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: DECISION_LOG_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Inbox rebuild service as a registry handler. */
export const inboxProjectionRebuildHandler = (
  rebuildService: RebuildInboxProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: INBOX_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Meetings rebuild service as a registry handler. */
export const meetingsProjectionRebuildHandler = (
  rebuildService: RebuildMeetingsProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: MEETINGS_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Stakeholders rebuild service as a registry handler. */
export const stakeholdersProjectionRebuildHandler = (
  rebuildService: RebuildStakeholdersProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: STAKEHOLDERS_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Notifications rebuild service as a registry handler. */
export const notificationsProjectionRebuildHandler = (
  rebuildService: RebuildNotificationsProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: NOTIFICATIONS_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Activities rebuild service as a registry handler. */
export const activitiesProjectionRebuildHandler = (
  rebuildService: RebuildActivitiesProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: ACTIVITIES_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Completed History rebuild service as a registry handler. */
export const completedHistoryProjectionRebuildHandler = (
  rebuildService: RebuildCompletedHistoryProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: COMPLETED_HISTORY_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Performance rebuild service as a registry handler. */
export const performanceProjectionRebuildHandler = (
  rebuildService: RebuildPerformanceProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: PERFORMANCE_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Learner Progression rebuild service as a registry handler. */
export const learnerProgressionProjectionRebuildHandler = (
  rebuildService: RebuildLearnerProgressionProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: LEARNER_PROGRESSION_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Achievements rebuild service as a registry handler. */
export const achievementsProjectionRebuildHandler = (
  rebuildService: RebuildAchievementsProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: ACHIEVEMENTS_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Mastery rebuild service as a registry handler. */
export const masteryProjectionRebuildHandler = (
  rebuildService: RebuildMasteryProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: MASTERY_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});

/** Adapter: wrap Coaching rebuild service as a registry handler. */
export const coachingProjectionRebuildHandler = (
  rebuildService: RebuildCoachingProjectionService,
): WorkplaceProjectionRebuildHandler => ({
  projectionType: COACHING_PROJECTION_TYPE,
  async rebuild(request) {
    const result = await rebuildService.rebuild(request);
    return { ok: result.ok };
  },
});
