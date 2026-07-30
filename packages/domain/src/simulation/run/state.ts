import { ruleViolationError } from "../../shared-kernel/errors";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { RuleViolationError } from "../../shared-kernel/errors";
import { asMetricKey, type DecisionRecordId } from "../../shared-kernel/ids";
import {
  rehydrateDecision,
  serializeDecision,
  type Decision,
} from "./decision";
import {
  rehydrateDecisionOutcome,
  serializeDecisionOutcome,
  type DecisionOutcome,
} from "./decision-outcome";
import {
  rehydrateConsequence,
  serializeConsequence,
  type Consequence,
} from "./consequence";
import {
  createProjectMetric,
  rehydrateProjectMetrics,
  serializeProjectMetrics,
  type ProjectMetrics,
} from "./project-metrics";
import {
  createInitialProjectState,
  rehydrateProjectState,
  serializeProjectState,
  type ProjectState,
} from "./project-state";
import {
  rehydrateScheduledEventInstruction,
  serializeScheduledEventInstruction,
  type ScheduledEventInstruction,
} from "./scheduled-event";
import {
  rehydrateCrisisRuntimeState,
  serializeCrisisRuntimeState,
  type CrisisRuntimeState,
} from "./crisis-runtime";
import type { StakeholderBehaviorMap } from "./apply-deferred-effect";
import {
  rehydrateLearnerMessageOccurrence,
  serializeLearnerMessageOccurrence,
  type LearnerMessageOccurrence,
} from "./learner-message";
import {
  rehydrateMeetingOccurrence,
  serializeMeetingOccurrence,
  type MeetingOccurrence,
} from "./meeting";
import {
  parseDocumentRuntime,
  serializeDocumentRuntime,
  type DocumentRuntime,
} from "./document";
import {
  parseNotificationRuntime,
  serializeNotificationRuntime,
  type NotificationRuntime,
} from "./notification";
import {
  parseActivityRuntime,
  serializeActivityRuntime,
  type ActivityRuntime,
} from "./activity";
import {
  rehydrateStakeholderConversation,
  rehydrateStakeholderRuntime,
  serializeStakeholderConversation,
  serializeStakeholderRuntime,
  type StakeholderConversation,
  type StakeholderRuntime,
} from "./stakeholder";

/**
 * Authoritative SimulationState owned by SimulationRun.
 *
 * schemaVersion 8: additive Activity runtime snapshots (PS-ROADMAP-022).
 * schemaVersion 7: additive Notification runtime snapshots (PS-ROADMAP-021).
 * schemaVersion 6: additive Document runtime snapshots (PS-ROADMAP-020).
 * schemaVersion 5: additive Stakeholder runtime + conversations (PS-ROADMAP-018).
 * schemaVersion 4: additive meetings occurrences (PS-ROADMAP-016).
 * schemaVersion 3: additive append-only learnerMessages (system-delivered).
 * schemaVersion 2 (PS-ROADMAP-005): typed metrics, projectState, outcomes,
 * consequences, and scheduled-event instructions.
 * schemaVersion 1 snapshots remain readable via an explicit upgrade path.
 */

export const SIMULATION_STATE_SCHEMA_VERSION = 8 as const;
export const SIMULATION_STATE_SCHEMA_VERSION_V7 = 7 as const;
export const SIMULATION_STATE_SCHEMA_VERSION_V6 = 6 as const;
export const SIMULATION_STATE_SCHEMA_VERSION_V5 = 5 as const;
export const SIMULATION_STATE_SCHEMA_VERSION_V4 = 4 as const;
export const SIMULATION_STATE_SCHEMA_VERSION_V3 = 3 as const;
export const SIMULATION_STATE_SCHEMA_VERSION_V2 = 2 as const;
export const SIMULATION_STATE_SCHEMA_VERSION_V1 = 1 as const;

export interface SimulationStateV8 {
  readonly schemaVersion: typeof SIMULATION_STATE_SCHEMA_VERSION;
  /** Increments on authoritative state mutations. */
  readonly stateVersion: number;
  readonly projectMetrics: ProjectMetrics;
  readonly projectState: ProjectState;
  readonly chapterProgress: readonly unknown[];
  readonly dayProgress: readonly unknown[];
  readonly activityProgress: readonly unknown[];
  readonly decisions: readonly Decision[];
  readonly decisionOutcomes: readonly DecisionOutcome[];
  readonly consequences: readonly Consequence[];
  readonly scheduledEvents: readonly ScheduledEventInstruction[];
  /** Append-only system-delivered learner message occurrences. */
  readonly learnerMessages: readonly LearnerMessageOccurrence[];
  /** Authoritative meeting occurrences (PS-ROADMAP-016). */
  readonly meetings: readonly MeetingOccurrence[];
  /** Authoritative runtime Stakeholders (PS-ROADMAP-018). */
  readonly stakeholders: readonly StakeholderRuntime[];
  /**
   * Authoritative Stakeholder conversations (PS-ROADMAP-018).
   * One conversation per runtime Stakeholder (v1 cardinality).
   */
  readonly stakeholderConversations: readonly StakeholderConversation[];
  /** Authoritative available-only Document snapshots (PS-ROADMAP-020). */
  readonly documents: readonly DocumentRuntime[];
  /** Authoritative active-only Notification snapshots (PS-ROADMAP-021). */
  readonly notifications: readonly NotificationRuntime[];
  /** Authoritative Activity runtime snapshots (PS-ROADMAP-022). */
  readonly activities: readonly ActivityRuntime[];
  /**
   * BC-006 W4 additive engine fields (schema 8 compatible).
   * Missing on legacy snapshots → empty defaults on rehydrate.
   */
  readonly narrativeFlags: Readonly<Record<string, boolean>>;
  readonly crises: readonly CrisisRuntimeState[];
  readonly stakeholderBehavior: StakeholderBehaviorMap;
}

export type SimulationState = SimulationStateV8;

/** Default fixture metric keys used by scaffolding content (not production). */
export const DEFAULT_BUDGET_METRIC_KEY = asMetricKey("budget");
export const DEFAULT_SCHEDULE_METRIC_KEY = asMetricKey("schedulePressure");

export const createDefaultProjectMetrics = (): ProjectMetrics => {
  const budget = createProjectMetric({
    key: DEFAULT_BUDGET_METRIC_KEY,
    value: 100,
    lowerBound: 0,
    upperBound: 200,
    unit: "points",
  });
  const schedule = createProjectMetric({
    key: DEFAULT_SCHEDULE_METRIC_KEY,
    value: 50,
    lowerBound: 0,
    upperBound: 100,
    unit: "points",
  });
  if (!budget.ok || !schedule.ok) {
    throw new Error("Default project metrics failed validation.");
  }
  return {
    [DEFAULT_BUDGET_METRIC_KEY]: budget.value,
    [DEFAULT_SCHEDULE_METRIC_KEY]: schedule.value,
  };
};

export const createInitialSimulationState = (): SimulationState => ({
  schemaVersion: SIMULATION_STATE_SCHEMA_VERSION,
  stateVersion: 0,
  projectMetrics: createDefaultProjectMetrics(),
  projectState: createInitialProjectState(),
  chapterProgress: [],
  dayProgress: [],
  activityProgress: [],
  decisions: [],
  decisionOutcomes: [],
  consequences: [],
  scheduledEvents: [],
  learnerMessages: [],
  meetings: [],
  stakeholders: [],
  stakeholderConversations: [],
  documents: [],
  notifications: [],
  activities: [],
  narrativeFlags: {},
  crises: [],
  stakeholderBehavior: {},
});

export const serializeSimulationState = (
  state: SimulationState,
): Readonly<Record<string, unknown>> => ({
  schemaVersion: state.schemaVersion,
  stateVersion: state.stateVersion,
  projectMetrics: serializeProjectMetrics(state.projectMetrics),
  projectState: serializeProjectState(state.projectState),
  chapterProgress: [...state.chapterProgress],
  dayProgress: [...state.dayProgress],
  activityProgress: [...state.activityProgress],
  decisions: state.decisions.map(serializeDecision),
  decisionOutcomes: state.decisionOutcomes.map(serializeDecisionOutcome),
  consequences: state.consequences.map(serializeConsequence),
  scheduledEvents: state.scheduledEvents.map(
    serializeScheduledEventInstruction,
  ),
  learnerMessages: state.learnerMessages.map(serializeLearnerMessageOccurrence),
  meetings: state.meetings.map(serializeMeetingOccurrence),
  stakeholders: state.stakeholders.map(serializeStakeholderRuntime),
  stakeholderConversations: state.stakeholderConversations.map(
    serializeStakeholderConversation,
  ),
  documents: state.documents.map(serializeDocumentRuntime),
  notifications: state.notifications.map(serializeNotificationRuntime),
  activities: state.activities.map(serializeActivityRuntime),
  narrativeFlags: { ...state.narrativeFlags },
  crises: state.crises.map(serializeCrisisRuntimeState),
  stakeholderBehavior: { ...state.stakeholderBehavior },
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateReferences = (
  state: SimulationState,
): Result<SimulationState, RuleViolationError> => {
  const decisionIds = new Set(state.decisions.map((d) => d.id));
  const outcomeById = new Map(
    state.decisionOutcomes.map((outcome) => [outcome.id, outcome]),
  );
  const consequenceById = new Map(
    state.consequences.map((consequence) => [consequence.id, consequence]),
  );
  const applicationKeys = new Set<string>();

  for (const decision of state.decisions) {
    if (decision.status === "resolved") {
      if (!decision.outcomeId || !outcomeById.has(decision.outcomeId)) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_REFERENCE_INVALID",
            `Resolved Decision '${decision.id}' references missing outcome.`,
            { decisionRecordId: decision.id, outcomeId: decision.outcomeId },
          ),
        );
      }
      const outcome = outcomeById.get(decision.outcomeId)!;
      if (outcome.decisionRecordId !== decision.id) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_REFERENCE_INVALID",
            "DecisionOutcome.decisionRecordId mismatch.",
            {
              decisionRecordId: decision.id,
              outcomeDecisionRecordId: outcome.decisionRecordId,
            },
          ),
        );
      }
    }
  }

  for (const outcome of state.decisionOutcomes) {
    if (!decisionIds.has(outcome.decisionRecordId)) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_REFERENCE_INVALID",
          `DecisionOutcome '${outcome.id}' references missing Decision.`,
          { decisionRecordId: outcome.decisionRecordId },
        ),
      );
    }
    for (const consequenceId of outcome.consequenceIds) {
      if (!consequenceById.has(consequenceId)) {
        return err(
          ruleViolationError(
            "CONSEQUENCE_REFERENCE_INVALID",
            `DecisionOutcome '${outcome.id}' references missing Consequence '${consequenceId}'.`,
          ),
        );
      }
    }
  }

  for (const consequence of state.consequences) {
    if (applicationKeys.has(consequence.applicationKey)) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_ALREADY_APPLIED",
          `Duplicate consequence application key '${consequence.applicationKey}'.`,
        ),
      );
    }
    applicationKeys.add(consequence.applicationKey);
    if (!decisionIds.has(consequence.originDecisionRecordId)) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_REFERENCE_INVALID",
          `Consequence '${consequence.id}' origin Decision is missing.`,
        ),
      );
    }
  }

  for (const scheduled of state.scheduledEvents) {
    if (!consequenceById.has(scheduled.originConsequenceId)) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_REFERENCE_INVALID",
          `ScheduledEvent '${scheduled.id}' origin Consequence is missing.`,
        ),
      );
    }
    if (!decisionIds.has(scheduled.originDecisionRecordId)) {
      return err(
        ruleViolationError(
          "CONSEQUENCE_REFERENCE_INVALID",
          `ScheduledEvent '${scheduled.id}' origin Decision is missing.`,
        ),
      );
    }
  }

  const occurrenceIds = new Set<string>();
  let previousSequence = 0;
  for (const message of state.learnerMessages) {
    if (occurrenceIds.has(message.occurrenceId)) {
      return err(
        ruleViolationError(
          "LEARNER_MESSAGE_OCCURRENCE_CONFLICT",
          `Duplicate learner message occurrence '${message.occurrenceId}'.`,
        ),
      );
    }
    occurrenceIds.add(message.occurrenceId);
    if (message.deliverySequence <= previousSequence) {
      return err(
        ruleViolationError(
          "LEARNER_MESSAGE_SEQUENCE_INVALID",
          "Learner message deliverySequence must be strictly increasing.",
          {
            deliverySequence: message.deliverySequence,
            previousSequence,
          },
        ),
      );
    }
    previousSequence = message.deliverySequence;
  }

  const meetingOccurrenceIds = new Set<string>();
  let previousMeetingSequence = 0;
  for (const meeting of state.meetings) {
    if (meetingOccurrenceIds.has(meeting.meetingOccurrenceId)) {
      return err(
        ruleViolationError(
          "MEETING_OCCURRENCE_CONFLICT",
          `Duplicate meeting occurrence '${meeting.meetingOccurrenceId}'.`,
        ),
      );
    }
    meetingOccurrenceIds.add(meeting.meetingOccurrenceId);
    if (meeting.scheduleSequence <= previousMeetingSequence) {
      return err(
        ruleViolationError(
          "MEETING_SEQUENCE_INVALID",
          "Meeting scheduleSequence must be strictly increasing.",
          {
            scheduleSequence: meeting.scheduleSequence,
            previousSequence: previousMeetingSequence,
          },
        ),
      );
    }
    previousMeetingSequence = meeting.scheduleSequence;
  }

  const stakeholderIds = new Set<string>();
  let previousInitializationSequence = 0;
  for (const stakeholder of state.stakeholders) {
    if (stakeholderIds.has(stakeholder.stakeholderId)) {
      return err(
        ruleViolationError(
          "STAKEHOLDER_IDENTITY_CONFLICT",
          `Duplicate runtime Stakeholder '${stakeholder.stakeholderId}'.`,
        ),
      );
    }
    stakeholderIds.add(stakeholder.stakeholderId);
    if (stakeholder.initializationSequence <= previousInitializationSequence) {
      return err(
        ruleViolationError(
          "STAKEHOLDER_SEQUENCE_INVALID",
          "Stakeholder.initializationSequence must be strictly increasing.",
          {
            initializationSequence: stakeholder.initializationSequence,
            previousSequence: previousInitializationSequence,
          },
        ),
      );
    }
    previousInitializationSequence = stakeholder.initializationSequence;
  }

  const conversationIds = new Set<string>();
  const conversationOwners = new Set<string>();
  const messageIds = new Set<string>();
  for (const conversation of state.stakeholderConversations) {
    if (conversationIds.has(conversation.conversationId)) {
      return err(
        ruleViolationError(
          "STAKEHOLDER_CONVERSATION_IDENTITY_CONFLICT",
          `Duplicate Stakeholder conversation '${conversation.conversationId}'.`,
        ),
      );
    }
    conversationIds.add(conversation.conversationId);
    if (conversationOwners.has(conversation.stakeholderId)) {
      return err(
        ruleViolationError(
          "STAKEHOLDER_CONVERSATION_IDENTITY_CONFLICT",
          `Stakeholder '${conversation.stakeholderId}' already owns a conversation.`,
          { stakeholderId: conversation.stakeholderId },
        ),
      );
    }
    conversationOwners.add(conversation.stakeholderId);
    if (!stakeholderIds.has(conversation.stakeholderId)) {
      return err(
        ruleViolationError(
          "STAKEHOLDER_NOT_FOUND",
          `Stakeholder conversation references unknown Stakeholder '${conversation.stakeholderId}'.`,
          { stakeholderId: conversation.stakeholderId },
        ),
      );
    }
    let previousConversationSequence = 0;
    for (const message of conversation.messages) {
      if (messageIds.has(message.messageId)) {
        return err(
          ruleViolationError(
            "STAKEHOLDER_MESSAGE_IDENTITY_CONFLICT",
            `Duplicate Stakeholder message '${message.messageId}'.`,
          ),
        );
      }
      messageIds.add(message.messageId);
      if (message.conversationId !== conversation.conversationId) {
        return err(
          ruleViolationError(
            "STAKEHOLDER_MESSAGE_CONVERSATION_MISMATCH",
            "StakeholderMessage.conversationId must match its conversation.",
          ),
        );
      }
      if (message.stakeholderId !== conversation.stakeholderId) {
        return err(
          ruleViolationError(
            "STAKEHOLDER_MESSAGE_STAKEHOLDER_MISMATCH",
            "StakeholderMessage.stakeholderId must match its conversation owner.",
          ),
        );
      }
      if (message.conversationSequence <= previousConversationSequence) {
        return err(
          ruleViolationError(
            "STAKEHOLDER_MESSAGE_SEQUENCE_INVALID",
            "StakeholderMessage.conversationSequence must be strictly increasing.",
            {
              conversationSequence: message.conversationSequence,
              previousSequence: previousConversationSequence,
            },
          ),
        );
      }
      previousConversationSequence = message.conversationSequence;
    }
  }

  const documentIds = new Set<string>();
  let previousDocumentSequence = 0;
  for (const document of state.documents) {
    if (documentIds.has(document.documentId)) {
      return err(
        ruleViolationError(
          "DOCUMENT_IDENTITY_CONFLICT",
          `Duplicate runtime Document '${document.documentId}'.`,
        ),
      );
    }
    documentIds.add(document.documentId);
    if (document.creationSequence <= previousDocumentSequence) {
      return err(
        ruleViolationError(
          "DOCUMENT_SEQUENCE_INVALID",
          "Document.creationSequence must be strictly increasing.",
          {
            creationSequence: document.creationSequence,
            previousSequence: previousDocumentSequence,
          },
        ),
      );
    }
    previousDocumentSequence = document.creationSequence;
  }

  const notificationIds = new Set<string>();
  let previousNotificationSequence = 0;
  for (const notification of state.notifications) {
    if (notificationIds.has(notification.notificationId)) {
      return err(
        ruleViolationError(
          "NOTIFICATION_IDENTITY_CONFLICT",
          `Duplicate runtime Notification '${notification.notificationId}'.`,
        ),
      );
    }
    notificationIds.add(notification.notificationId);
    if (notification.creationSequence <= previousNotificationSequence) {
      return err(
        ruleViolationError(
          "NOTIFICATION_SEQUENCE_INVALID",
          "Notification.creationSequence must be strictly increasing.",
          {
            creationSequence: notification.creationSequence,
            previousSequence: previousNotificationSequence,
          },
        ),
      );
    }
    previousNotificationSequence = notification.creationSequence;
  }

  const activityIds = new Set<string>();
  let previousActivityCreationSequence = 0;
  let previousActivityCompletionSequence = 0;
  for (const activity of state.activities) {
    if (activityIds.has(activity.activityId)) {
      return err(
        ruleViolationError(
          "ACTIVITY_IDENTITY_CONFLICT",
          `Duplicate runtime Activity '${activity.activityId}'.`,
        ),
      );
    }
    activityIds.add(activity.activityId);
    if (activity.creationSequence <= previousActivityCreationSequence) {
      return err(
        ruleViolationError(
          "ACTIVITY_SEQUENCE_INVALID",
          "Activity.creationSequence must be strictly increasing.",
          {
            creationSequence: activity.creationSequence,
            previousSequence: previousActivityCreationSequence,
          },
        ),
      );
    }
    previousActivityCreationSequence = activity.creationSequence;
    if (
      activity.status === "completed" &&
      activity.completionSequence !== null
    ) {
      if (activity.completionSequence <= previousActivityCompletionSequence) {
        return err(
          ruleViolationError(
            "ACTIVITY_COMPLETION_SEQUENCE_INVALID",
            "Activity.completionSequence must be strictly increasing among completed activities.",
            {
              completionSequence: activity.completionSequence,
              previousSequence: previousActivityCompletionSequence,
            },
          ),
        );
      }
      previousActivityCompletionSequence = activity.completionSequence;
    }
  }

  return ok(state);
};

/**
 * Validate and parse a persisted JSON state envelope.
 * Accepts schemaVersion 1 / 2 / 3 / 4 / 5 / 6 / 7 (upgrade) and 8.
 */
export const parseSimulationState = (
  value: unknown,
): SimulationState | null => {
  if (!isPlainObject(value)) {
    return null;
  }
  const schemaVersion = value.schemaVersion;
  if (
    schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION &&
    schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION_V7 &&
    schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION_V6 &&
    schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION_V5 &&
    schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION_V4 &&
    schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION_V3 &&
    schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION_V2 &&
    schemaVersion !== SIMULATION_STATE_SCHEMA_VERSION_V1
  ) {
    return null;
  }
  if (
    !Array.isArray(value.chapterProgress) ||
    !Array.isArray(value.dayProgress) ||
    !Array.isArray(value.activityProgress) ||
    !Array.isArray(value.decisions) ||
    !Array.isArray(value.consequences)
  ) {
    return null;
  }

  const stateVersion =
    value.stateVersion === undefined
      ? 0
      : typeof value.stateVersion === "number" &&
          Number.isInteger(value.stateVersion) &&
          value.stateVersion >= 0
        ? value.stateVersion
        : null;
  if (stateVersion === null) {
    return null;
  }

  const metrics = rehydrateProjectMetrics(value.projectMetrics ?? {});
  if (!metrics.ok) {
    return null;
  }

  const projectState = rehydrateProjectState(value.projectState);
  if (!projectState.ok) {
    return null;
  }

  const decisions: Decision[] = [];
  for (const entry of value.decisions) {
    const parsed = rehydrateDecision(entry);
    if (!parsed.ok) {
      return null;
    }
    decisions.push(parsed.value);
  }

  const decisionOutcomes: DecisionOutcome[] = [];
  const rawOutcomes = Array.isArray(value.decisionOutcomes)
    ? value.decisionOutcomes
    : [];
  for (const entry of rawOutcomes) {
    const parsed = rehydrateDecisionOutcome(entry);
    if (!parsed.ok) {
      return null;
    }
    decisionOutcomes.push(parsed.value);
  }

  const consequences: Consequence[] = [];
  if (schemaVersion === SIMULATION_STATE_SCHEMA_VERSION_V1) {
    if (value.consequences.length > 0) {
      // Legacy unknown consequence blobs are not silently reinterpreted.
      return null;
    }
  } else {
    for (const entry of value.consequences) {
      const parsed = rehydrateConsequence(entry);
      if (!parsed.ok) {
        return null;
      }
      consequences.push(parsed.value);
    }
  }

  const scheduledEvents: ScheduledEventInstruction[] = [];
  const rawSchedules = Array.isArray(value.scheduledEvents)
    ? value.scheduledEvents
    : [];
  for (const entry of rawSchedules) {
    const parsed = rehydrateScheduledEventInstruction(entry);
    if (!parsed.ok) {
      return null;
    }
    scheduledEvents.push(parsed.value);
  }

  const learnerMessages: LearnerMessageOccurrence[] = [];
  const rawMessages = Array.isArray(value.learnerMessages)
    ? value.learnerMessages
    : [];
  // v1/v2 upcast: missing learnerMessages → empty history.
  for (const entry of rawMessages) {
    const parsed = rehydrateLearnerMessageOccurrence(entry);
    if (!parsed.ok) {
      return null;
    }
    learnerMessages.push(parsed.value);
  }

  const meetings: MeetingOccurrence[] = [];
  const rawMeetings = Array.isArray(value.meetings) ? value.meetings : [];
  // v1/v2/v3 upcast: missing meetings → empty history.
  for (const entry of rawMeetings) {
    const parsed = rehydrateMeetingOccurrence(entry);
    if (!parsed.ok) {
      return null;
    }
    meetings.push(parsed.value);
  }

  const stakeholders: StakeholderRuntime[] = [];
  const rawStakeholders = Array.isArray(value.stakeholders)
    ? value.stakeholders
    : [];
  // v1–v4 upcast: missing stakeholders → empty runtime set.
  for (const entry of rawStakeholders) {
    const parsed = rehydrateStakeholderRuntime(entry);
    if (!parsed.ok) {
      return null;
    }
    stakeholders.push(parsed.value);
  }

  const stakeholderConversations: StakeholderConversation[] = [];
  const rawConversations = Array.isArray(value.stakeholderConversations)
    ? value.stakeholderConversations
    : [];
  // v1–v4 upcast: missing stakeholderConversations → empty history.
  for (const entry of rawConversations) {
    const parsed = rehydrateStakeholderConversation(entry);
    if (!parsed.ok) {
      return null;
    }
    stakeholderConversations.push(parsed.value);
  }

  const documents: DocumentRuntime[] = [];
  const rawDocuments = Array.isArray(value.documents) ? value.documents : [];
  // v1-v5 upcast: missing documents -> empty runtime set.
  for (const entry of rawDocuments) {
    const parsed = parseDocumentRuntime(entry);
    if (!parsed.ok) {
      return null;
    }
    documents.push(parsed.value);
  }

  const notifications: NotificationRuntime[] = [];
  const rawNotifications = Array.isArray(value.notifications)
    ? value.notifications
    : [];
  // v1-v6 upcast: missing notifications -> empty runtime set.
  for (const entry of rawNotifications) {
    const parsed = parseNotificationRuntime(entry);
    if (!parsed.ok) {
      return null;
    }
    notifications.push(parsed.value);
  }

  const activities: ActivityRuntime[] = [];
  const rawActivities = Array.isArray(value.activities) ? value.activities : [];
  // v1-v7 upcast: missing activities -> empty runtime set.
  for (const entry of rawActivities) {
    const parsed = parseActivityRuntime(entry);
    if (!parsed.ok) {
      return null;
    }
    activities.push(parsed.value);
  }

  const narrativeFlags: Record<string, boolean> = {};
  if (isPlainObject(value.narrativeFlags)) {
    for (const [flag, flagValue] of Object.entries(value.narrativeFlags)) {
      if (typeof flagValue === "boolean") {
        narrativeFlags[flag] = flagValue;
      }
    }
  }

  const crises: CrisisRuntimeState[] = [];
  const rawCrises = Array.isArray(value.crises) ? value.crises : [];
  for (const entry of rawCrises) {
    const parsed = rehydrateCrisisRuntimeState(entry);
    if (!parsed.ok) {
      return null;
    }
    crises.push(parsed.value);
  }

  const stakeholderBehaviorMutable: Record<
    string,
    { trust: number; support: number; resistance: number }
  > = {};
  if (isPlainObject(value.stakeholderBehavior)) {
    for (const [stakeholderId, behavior] of Object.entries(
      value.stakeholderBehavior,
    )) {
      if (!isPlainObject(behavior)) {
        return null;
      }
      if (
        typeof behavior.trust !== "number" ||
        typeof behavior.support !== "number" ||
        typeof behavior.resistance !== "number"
      ) {
        return null;
      }
      stakeholderBehaviorMutable[stakeholderId] = {
        trust: behavior.trust,
        support: behavior.support,
        resistance: behavior.resistance,
      };
    }
  }
  const stakeholderBehavior: StakeholderBehaviorMap =
    stakeholderBehaviorMutable;

  const state: SimulationState = {
    schemaVersion: SIMULATION_STATE_SCHEMA_VERSION,
    stateVersion,
    projectMetrics: metrics.value,
    projectState: projectState.value,
    chapterProgress: [...value.chapterProgress],
    dayProgress: [...value.dayProgress],
    activityProgress: [...value.activityProgress],
    decisions,
    decisionOutcomes,
    consequences,
    scheduledEvents,
    learnerMessages,
    meetings,
    stakeholders,
    stakeholderConversations,
    documents,
    notifications,
    activities,
    narrativeFlags,
    crises,
    stakeholderBehavior,
  };

  const validated = validateReferences(state);
  return validated.ok ? validated.value : null;
};

/** Append an immutable Decision and advance stateVersion. */
export const appendDecisionToState = (
  state: SimulationState,
  decision: Decision,
): Result<SimulationState, RuleViolationError> => {
  if (
    state.decisions.some(
      (existing) =>
        existing.decisionDefinitionId === decision.decisionDefinitionId,
    )
  ) {
    return err(
      ruleViolationError(
        "DECISION_ALREADY_SUBMITTED",
        `Decision definition '${decision.decisionDefinitionId}' was already submitted.`,
        { decisionDefinitionId: decision.decisionDefinitionId },
      ),
    );
  }
  if (
    state.decisions.some(
      (existing) => existing.sourceActionId === decision.sourceActionId,
    )
  ) {
    return err(
      ruleViolationError(
        "DECISION_SOURCE_ACTION_DUPLICATE",
        `Source action '${decision.sourceActionId}' already produced a Decision.`,
        { sourceActionId: decision.sourceActionId },
      ),
    );
  }
  return ok({
    ...state,
    stateVersion: state.stateVersion + 1,
    decisions: [...state.decisions, decision],
  });
};

export const findDecisionByRecordId = (
  state: SimulationState,
  decisionRecordId: DecisionRecordId,
): Decision | null =>
  state.decisions.find((decision) => decision.id === decisionRecordId) ?? null;

export const listSubmittedDecisionRecordIds = (
  state: SimulationState,
): readonly DecisionRecordId[] =>
  state.decisions
    .filter((decision) => decision.status === "submitted")
    .map((decision) => decision.id);
