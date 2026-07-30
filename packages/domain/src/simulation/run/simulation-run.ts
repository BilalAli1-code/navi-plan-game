import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  ActionRecordId,
  ActivityId,
  ActorId,
  BusinessCaseId,
  CausationId,
  ChapterId,
  CommandId,
  ContentPackageVersionId,
  ConversationId,
  CorrelationId,
  DayId,
  DecisionId,
  DecisionOptionId,
  DecisionRecordId,
  DocumentId,
  EventId,
  LearnerId,
  LearnerMessageDefinitionId,
  MeetingId,
  NotificationId,
  MetricKey,
  SimulationRunId,
  StakeholderId,
  TenantId,
} from "../../shared-kernel/ids";
import { asMeetingDefinitionId } from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { DecisionDefinition } from "../content/decision-definition";
import type { ExperienceLevel } from "../content/business-case/enums";
import {
  createAnalyticsSignalEmittedEvent,
  createConsequenceAppliedEvent,
  createConsequenceCreatedEvent,
  createConsequenceScheduledEvent,
  createDecisionResolvedEvent,
  createDecisionSubmittedEvent,
  createLearnerMessageDeliveredEvent,
  createLearningSignalEmittedEvent,
  createMeetingCancelledEvent,
  createMeetingCompletedEvent,
  createMeetingMadeAvailableEvent,
  createMeetingScheduledEvent,
  createMeetingStartedEvent,
  createProjectMetricChangedEvent,
  createProjectStateTransitionedEvent,
  createActivityCompletedEvent,
  createActivityInitializedEvent,
  createDocumentInitializedEvent,
  createNotificationInitializedEvent,
  createStakeholderConversationOpenedEvent,
  createStakeholderInitializedEvent,
  createStakeholderMessageSentEvent,
  createStakeholderSignalEmittedEvent,
} from "../events/factory";
import type {
  DecisionSubmittedEvent,
  SimulationDomainEvent,
} from "../events/events";
import {
  deriveInitLearnerMessageOccurrenceId,
  deriveMeetingOccurrenceId,
  deriveStakeholderConversationId,
  deriveStakeholderMessageIdFromCommand,
} from "./consequence-identity";
import {
  createLearnerMessageOccurrence,
  learnerMessageSemanticEqual,
  type LearnerMessageOccurrence,
} from "./learner-message";
import {
  createMeetingOccurrence,
  meetingOccurrenceSemanticEqual,
  transitionMeetingOccurrence,
  type MeetingLifecycleCommand,
  type MeetingOccurrence,
  type MeetingParticipantSnapshot,
} from "./meeting";
import {
  createDocumentLearnerSafeContent,
  createDocumentRuntime,
  documentRuntimeSemanticEqual,
  type DocumentRuntime,
} from "./document";
import {
  createNotificationLearnerSafeContent,
  createNotificationProvenance,
  createNotificationRuntime,
  notificationRuntimeSemanticEqual,
  type NotificationRuntime,
  type NotificationSourceKind,
} from "./notification";
import {
  activityRuntimeSemanticEqual,
  completeActivityRuntime,
  createActivityLearnerSafeContent,
  createActivityProvenance,
  createActivityRuntime,
  type ActivityRuntime,
  type ActivitySourceKind,
} from "./activity";
import {
  createStakeholderConversation,
  createStakeholderLearnerSafeProfile,
  createStakeholderMessageOccurrence,
  createStakeholderRuntime,
  stakeholderMessageSemanticEqual,
  stakeholderRuntimeSemanticEqual,
  type StakeholderConversation,
  type StakeholderMessageOccurrence,
  type StakeholderRuntime,
} from "./stakeholder";
import {
  createDecision,
  markDecisionResolved,
  type Decision,
} from "./decision";
import {
  buildDecisionEligibilityContext,
  validateDecisionEligibility,
} from "./decision-eligibility";
import {
  resolveDecisionDeterministically,
  type DecisionResolution,
} from "./decision-resolver";
import type { DecisionOutcome } from "./decision-outcome";
import {
  createSimulationRunLifecycleEvent,
  type SimulationRunLifecycleEvent,
  type SimulationRunLifecycleEventType,
} from "./lifecycle-events";
import {
  appendDecisionToState,
  createInitialSimulationState,
  findDecisionByRecordId,
  parseSimulationState,
  type SimulationState,
} from "./state";
import {
  isLearnerActionAllowed,
  isSimulationRunStatus,
  isTerminalStatus,
  type SimulationRunStatus,
} from "./status";
import type { CrisisDefinition } from "../content/business-case/entities";
import type { ConditionExpression } from "../content/business-case/conditions";
import {
  evaluateChapterCondition,
  evaluateSimulationEngine,
  hasBlockingCrisis,
} from "./engine-evaluation";

export {
  isDecisionDefinitionAvailable,
  validateDecisionEligibility,
} from "./decision-eligibility";

/**
 * Authoritative SimulationRun aggregate root (PS-DOM-003 / PS-ROADMAP-003).
 *
 * Externally immutable snapshot; transitions return a new aggregate + events.
 * Cross-context refs are stable identifiers only — no embedded aggregates.
 */

export interface SimulationRun {
  readonly id: SimulationRunId;
  readonly tenantId: TenantId;
  readonly learnerId: LearnerId;
  readonly businessCaseId: BusinessCaseId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  /**
   * Learner experience level selected at run creation (BC-003).
   * Null for legacy runs created before experience-level pinning.
   */
  readonly experienceLevel: ExperienceLevel | null;
  readonly runtimeVersion: string;
  readonly status: SimulationRunStatus;
  readonly aggregateVersion: number;
  readonly lastProcessedSequence: number;
  readonly currentChapterId: ChapterId | null;
  readonly currentDayId: DayId | null;
  readonly startedAt: IsoTimestamp | null;
  readonly pausedAt: IsoTimestamp | null;
  readonly completedAt: IsoTimestamp | null;
  readonly archivedAt: IsoTimestamp | null;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  /** Authoritative state; mutated only via aggregate operations. */
  readonly state: SimulationState;
}

export interface SimulationRunTransition {
  readonly run: SimulationRun;
  readonly events: readonly SimulationRunLifecycleEvent[];
}

export interface CreateSimulationRunInput {
  readonly id: SimulationRunId;
  readonly tenantId: TenantId;
  readonly learnerId: LearnerId;
  readonly businessCaseId: BusinessCaseId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly experienceLevel?: ExperienceLevel | null;
  readonly runtimeVersion: string;
  readonly currentChapterId?: ChapterId | null;
  readonly currentDayId?: DayId | null;
  /**
   * Optional content-driven metric seed merged over defaults (BC-004).
   * Missing metrics referenced by consequences fail closed unless seeded here.
   */
  readonly initialProjectMetrics?: ReturnType<
    typeof createInitialSimulationState
  >["projectMetrics"];
  readonly createdAt: IsoTimestamp;
  readonly eventId: EventId;
  readonly actorId: ActorId | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
}

/** Persistence record used only for rehydration (no side effects). */
export interface SimulationRunPersistenceRecord {
  readonly id: SimulationRunId;
  readonly tenantId: TenantId;
  readonly learnerId: LearnerId;
  readonly businessCaseId: BusinessCaseId;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly experienceLevel?: ExperienceLevel | null;
  readonly runtimeVersion: string;
  readonly status: string;
  readonly aggregateVersion: number;
  readonly lastProcessedSequence: number;
  readonly currentChapterId: ChapterId | null;
  readonly currentDayId: DayId | null;
  readonly startedAt: IsoTimestamp | null;
  readonly pausedAt: IsoTimestamp | null;
  readonly completedAt: IsoTimestamp | null;
  readonly archivedAt: IsoTimestamp | null;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  readonly state: unknown;
}

export interface LifecycleOperationContext {
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly eventId: EventId;
  readonly actorId: ActorId | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
}

const lifecycleFailure = (
  from: SimulationRunStatus,
  to: string,
): RuleViolationError =>
  ruleViolationError(
    "INVALID_LIFECYCLE_TRANSITION",
    `Cannot transition SimulationRun from '${from}' to '${to}'.`,
    { from, to },
  );

const emit = (
  run: SimulationRun,
  eventType: SimulationRunLifecycleEventType,
  fromStatus: SimulationRunStatus | null,
  toStatus: SimulationRunStatus,
  ctx: LifecycleOperationContext,
): SimulationRunLifecycleEvent =>
  createSimulationRunLifecycleEvent({
    eventId: ctx.eventId,
    eventType,
    occurredAt: ctx.occurredAt,
    recordedAt: ctx.recordedAt,
    aggregateVersion: run.aggregateVersion,
    sequenceNumber: run.aggregateVersion,
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    causationId: ctx.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    fromStatus,
    toStatus,
    contentPackageVersionId: run.contentPackageVersionId,
    runtimeVersion: run.runtimeVersion,
  });

const withTransition = (
  run: SimulationRun,
  patch: Partial<SimulationRun> & {
    readonly status: SimulationRunStatus;
    readonly updatedAt: IsoTimestamp;
  },
  eventType: SimulationRunLifecycleEventType,
  ctx: LifecycleOperationContext,
): SimulationRunTransition => {
  const next: SimulationRun = {
    ...run,
    ...patch,
    aggregateVersion: run.aggregateVersion + 1,
    // Lifecycle mutations preserve action sequence position.
    lastProcessedSequence: run.lastProcessedSequence,
    state: run.state,
  };
  return {
    run: next,
    events: [emit(next, eventType, run.status, next.status, ctx)],
  };
};

/** Create a new run in `created` status and emit SimulationRunCreated. */
export const createSimulationRun = (
  input: CreateSimulationRunInput,
): Result<SimulationRunTransition, RuleViolationError> => {
  if (input.runtimeVersion.trim().length === 0) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        "runtimeVersion must be a non-empty string.",
      ),
    );
  }

  const run: SimulationRun = {
    id: input.id,
    tenantId: input.tenantId,
    learnerId: input.learnerId,
    businessCaseId: input.businessCaseId,
    contentPackageVersionId: input.contentPackageVersionId,
    experienceLevel: input.experienceLevel ?? null,
    runtimeVersion: input.runtimeVersion,
    status: "created",
    aggregateVersion: 1,
    lastProcessedSequence: 0,
    currentChapterId: input.currentChapterId ?? null,
    currentDayId: input.currentDayId ?? null,
    startedAt: null,
    pausedAt: null,
    completedAt: null,
    archivedAt: null,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    state: (() => {
      const initial = createInitialSimulationState();
      if (input.initialProjectMetrics === undefined) {
        return initial;
      }
      return {
        ...initial,
        projectMetrics: {
          ...initial.projectMetrics,
          ...input.initialProjectMetrics,
        },
      };
    })(),
  };

  const ctx: LifecycleOperationContext = {
    occurredAt: input.createdAt,
    recordedAt: input.createdAt,
    eventId: input.eventId,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
  };

  return ok({
    run,
    events: [emit(run, "SimulationRunCreated", null, "created", ctx)],
  });
};

/**
 * Rehydrate from persistence. No version bump, no events, no lifecycle logic.
 * Validates status, versions, ownership, and state envelope.
 */
export const rehydrateSimulationRun = (
  record: SimulationRunPersistenceRecord,
): Result<SimulationRun, RuleViolationError> => {
  if (!isSimulationRunStatus(record.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        `Unknown SimulationRun status '${record.status}'.`,
        { status: record.status },
      ),
    );
  }
  if (
    !Number.isInteger(record.aggregateVersion) ||
    record.aggregateVersion < 1
  ) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        "aggregateVersion must be an integer >= 1.",
        { aggregateVersion: record.aggregateVersion },
      ),
    );
  }
  if (
    !Number.isInteger(record.lastProcessedSequence) ||
    record.lastProcessedSequence < 0
  ) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        "lastProcessedSequence must be an integer >= 0.",
        { lastProcessedSequence: record.lastProcessedSequence },
      ),
    );
  }
  if (record.runtimeVersion.trim().length === 0) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        "runtimeVersion must be a non-empty string.",
      ),
    );
  }

  const state = parseSimulationState(record.state);
  if (!state) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        "authoritative_state failed schema validation.",
      ),
    );
  }

  return ok({
    id: record.id,
    tenantId: record.tenantId,
    learnerId: record.learnerId,
    businessCaseId: record.businessCaseId,
    contentPackageVersionId: record.contentPackageVersionId,
    experienceLevel: record.experienceLevel ?? null,
    runtimeVersion: record.runtimeVersion,
    status: record.status,
    aggregateVersion: record.aggregateVersion,
    lastProcessedSequence: record.lastProcessedSequence,
    currentChapterId: record.currentChapterId,
    currentDayId: record.currentDayId,
    startedAt: record.startedAt,
    pausedAt: record.pausedAt,
    completedAt: record.completedAt,
    archivedAt: record.archivedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    state,
  });
};

export const startSimulationRun = (
  run: SimulationRun,
  ctx: LifecycleOperationContext,
): Result<SimulationRunTransition, RuleViolationError> => {
  if (run.status !== "created") {
    return err(lifecycleFailure(run.status, "active"));
  }
  return ok(
    withTransition(
      run,
      {
        status: "active",
        startedAt: ctx.occurredAt,
        pausedAt: null,
        updatedAt: ctx.occurredAt,
      },
      "SimulationRunStarted",
      ctx,
    ),
  );
};

export const pauseSimulationRun = (
  run: SimulationRun,
  ctx: LifecycleOperationContext,
): Result<SimulationRunTransition, RuleViolationError> => {
  if (run.status !== "active") {
    return err(lifecycleFailure(run.status, "paused"));
  }
  return ok(
    withTransition(
      run,
      {
        status: "paused",
        pausedAt: ctx.occurredAt,
        updatedAt: ctx.occurredAt,
      },
      "SimulationRunPaused",
      ctx,
    ),
  );
};

export const resumeSimulationRun = (
  run: SimulationRun,
  ctx: LifecycleOperationContext,
): Result<SimulationRunTransition, RuleViolationError> => {
  if (run.status !== "paused") {
    return err(lifecycleFailure(run.status, "active"));
  }
  return ok(
    withTransition(
      run,
      {
        status: "active",
        pausedAt: null,
        updatedAt: ctx.occurredAt,
      },
      "SimulationRunResumed",
      ctx,
    ),
  );
};

export const completeSimulationRun = (
  run: SimulationRun,
  ctx: LifecycleOperationContext,
): Result<SimulationRunTransition, RuleViolationError> => {
  // Active → Completed; Paused → Completed (authorized administrative path).
  if (run.status !== "active" && run.status !== "paused") {
    return err(lifecycleFailure(run.status, "completed"));
  }
  return ok(
    withTransition(
      run,
      {
        status: "completed",
        completedAt: ctx.occurredAt,
        pausedAt: null,
        updatedAt: ctx.occurredAt,
      },
      "SimulationRunCompleted",
      ctx,
    ),
  );
};

export const recordSimulationRunFailure = (
  run: SimulationRun,
  ctx: LifecycleOperationContext,
): Result<SimulationRunTransition, RuleViolationError> => {
  if (run.status !== "active") {
    return err(lifecycleFailure(run.status, "failed"));
  }
  return ok(
    withTransition(
      run,
      {
        status: "failed",
        updatedAt: ctx.occurredAt,
      },
      "SimulationRunFailed",
      ctx,
    ),
  );
};

export const recoverSimulationRun = (
  run: SimulationRun,
  ctx: LifecycleOperationContext,
): Result<SimulationRunTransition, RuleViolationError> => {
  if (run.status !== "failed") {
    return err(lifecycleFailure(run.status, "active"));
  }
  return ok(
    withTransition(
      run,
      {
        status: "active",
        updatedAt: ctx.occurredAt,
      },
      "SimulationRunRecovered",
      ctx,
    ),
  );
};

export const archiveSimulationRun = (
  run: SimulationRun,
  ctx: LifecycleOperationContext,
): Result<SimulationRunTransition, RuleViolationError> => {
  if (run.status !== "completed" && run.status !== "failed") {
    return err(lifecycleFailure(run.status, "archived"));
  }
  return ok(
    withTransition(
      run,
      {
        status: "archived",
        archivedAt: ctx.occurredAt,
        updatedAt: ctx.occurredAt,
      },
      "SimulationRunArchived",
      ctx,
    ),
  );
};

/**
 * Record an accepted learner action on an active run: advances aggregate
 * version and lastProcessedSequence together. Does not emit lifecycle events
 * (SimulationActionAccepted is produced by the application/factory path).
 */
export const recordAcceptedLearnerAction = (
  run: SimulationRun,
  updatedAt: IsoTimestamp,
): Result<SimulationRun, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }
  return ok({
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt,
  });
};

/** Assert content-package version immutability after start. */
export const assertContentPackageVersionUnchanged = (
  run: SimulationRun,
  contentPackageVersionId: ContentPackageVersionId,
): Result<void, RuleViolationError> => {
  if (run.contentPackageVersionId !== contentPackageVersionId) {
    return err(
      ruleViolationError(
        "CONTENT_PACKAGE_VERSION_IMMUTABLE",
        "contentPackageVersionId cannot change after the run is created.",
      ),
    );
  }
  return ok(undefined);
};

export const canAcceptLearnerActions = (run: SimulationRun): boolean =>
  isLearnerActionAllowed(run.status);

export const isSimulationRunTerminal = (run: SimulationRun): boolean =>
  isTerminalStatus(run.status);

export interface SubmitDecisionInput {
  readonly decisionRecordId: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionId: DecisionOptionId;
  /** Immutable content definition resolved for the run's content version. */
  readonly definition: DecisionDefinition;
  readonly sourceActionId: ActionRecordId;
  readonly submittedBy: ActorId;
  readonly submittedAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly eventId: EventId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
}

export interface SubmitDecisionResult {
  readonly run: SimulationRun;
  readonly decision: Decision;
  readonly events: readonly DecisionSubmittedEvent[];
}

/**
 * Submit-only path (PS-ROADMAP-004 compatibility / recovery seeding).
 *
 * Normal learner SubmitDecision uses {@link processSubmitDecision} so submission
 * and resolution commit as one aggregate transition.
 */
export const submitDecision = (
  run: SimulationRun,
  input: SubmitDecisionInput,
): Result<SubmitDecisionResult, RuleViolationError> => {
  const eligibility = validateDecisionEligibility(
    buildDecisionEligibilityContext({
      runStatus: run.status,
      contentPackageVersionId: run.contentPackageVersionId,
      currentChapterId: run.currentChapterId,
      state: run.state,
    }),
    input,
  );
  if (!eligibility.ok) {
    return eligibility;
  }

  const contextStateVersion = run.state.stateVersion;
  const decisionResult = createDecision({
    id: input.decisionRecordId,
    decisionDefinitionId: input.decisionDefinitionId,
    selectedOptionId: input.selectedOptionId,
    submittedBy: input.submittedBy,
    submittedAt: input.submittedAt,
    sourceActionId: input.sourceActionId,
    contextStateVersion,
  });
  if (!decisionResult.ok) {
    return decisionResult;
  }

  const nextState = appendDecisionToState(run.state, decisionResult.value);
  if (!nextState.ok) {
    return nextState;
  }

  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.submittedAt,
    state: nextState.value,
  };

  const event = createDecisionSubmittedEvent({
    eventId: input.eventId,
    occurredAt: input.submittedAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.submittedBy,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    decisionId: decisionResult.value.id,
    decisionDefinitionId: decisionResult.value.decisionDefinitionId,
    selectedOptionId: decisionResult.value.selectedOptionId,
    sourceActionId: decisionResult.value.sourceActionId,
    submittedBy: decisionResult.value.submittedBy,
    submittedAt: decisionResult.value.submittedAt,
    contextStateVersion: decisionResult.value.contextStateVersion,
    contentPackageVersionId: run.contentPackageVersionId,
  });

  return ok({
    run: nextRun,
    decision: decisionResult.value,
    events: [event],
  });
};

export interface ResolveDecisionInput {
  readonly decisionRecordId: DecisionRecordId;
  readonly definition: DecisionDefinition;
  readonly resolvedAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly actorId: ActorId | null;
  /** Supplies unique event IDs; caller-controlled for determinism in tests. */
  readonly allocateEventId: () => EventId;
}

export interface ResolveDecisionResult {
  readonly run: SimulationRun;
  readonly decision: Decision;
  readonly outcome: DecisionOutcome;
  readonly events: readonly SimulationDomainEvent[];
  readonly alreadyResolved: boolean;
}

const buildResolutionEvents = (input: {
  readonly run: SimulationRun;
  readonly decision: Decision;
  readonly outcome: DecisionOutcome;
  readonly resolution: DecisionResolution;
  readonly aggregateVersion: number;
  readonly sequenceNumber: number;
  readonly resolvedAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly allocateEventId: () => EventId;
  readonly resultingStateVersion: number;
}): SimulationDomainEvent[] => {
  const base = {
    occurredAt: input.resolvedAt,
    recordedAt: input.recordedAt,
    aggregateVersion: input.aggregateVersion,
    sequenceNumber: input.sequenceNumber,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: input.run.tenantId,
    simulationRunId: input.run.id,
  };

  const events: SimulationDomainEvent[] = [];
  const createdEventIds = new Map<string, EventId>();

  for (const consequence of input.resolution.consequences) {
    const createdId = input.allocateEventId();
    createdEventIds.set(consequence.id, createdId);
    events.push(
      createConsequenceCreatedEvent({
        ...base,
        eventId: createdId,
        consequenceId: consequence.id,
        consequenceDefinitionId: consequence.consequenceDefinitionId,
        originDecisionRecordId: consequence.originDecisionRecordId,
        consequenceType: consequence.consequenceType,
        timing: consequence.timing,
        target: consequence.target,
        resolverVersion: consequence.resolverVersion,
      }),
    );

    const metricChange = input.resolution.metricChanges.find(
      (entry) => entry.consequenceId === consequence.id,
    );
    if (metricChange) {
      events.push(
        createProjectMetricChangedEvent({
          ...base,
          eventId: input.allocateEventId(),
          metricKey: metricChange.metricKey as MetricKey,
          previousValue: metricChange.previousValue,
          delta: metricChange.delta,
          nextValue: metricChange.nextValue,
          reasonCode: metricChange.reasonCode,
          originDecisionRecordId: input.decision.id,
          consequenceId: consequence.id,
        }),
      );
    }

    const stateChange = input.resolution.projectStateChanges.find(
      (entry) => entry.consequenceId === consequence.id,
    );
    if (stateChange) {
      events.push(
        createProjectStateTransitionedEvent({
          ...base,
          eventId: input.allocateEventId(),
          previousStatus: stateChange.previousStatus,
          nextStatus: stateChange.nextStatus,
          reasonCode: stateChange.reasonCode,
          originDecisionRecordId: input.decision.id,
          consequenceId: consequence.id,
        }),
      );
    }

    const learning = input.resolution.learningSignals.find(
      (entry) => entry.consequenceId === consequence.id,
    );
    if (learning) {
      events.push(
        createLearningSignalEmittedEvent({
          ...base,
          eventId: input.allocateEventId(),
          signalId: learning.signalId,
          signalType: learning.signalType,
          competencyKey: learning.competencyKey,
          delta: learning.delta,
          reasonCode: learning.reasonCode,
          originDecisionRecordId: input.decision.id,
          consequenceId: consequence.id,
          contentPackageVersionId: input.run.contentPackageVersionId,
          causationEventId: createdEventIds.get(consequence.id) ?? null,
        }),
      );
    }

    const stakeholder = input.resolution.stakeholderSignals.find(
      (entry) => entry.consequenceId === consequence.id,
    );
    if (stakeholder) {
      events.push(
        createStakeholderSignalEmittedEvent({
          ...base,
          eventId: input.allocateEventId(),
          signalId: stakeholder.signalId,
          signalType: stakeholder.signalType,
          stakeholderId: stakeholder.stakeholderId as StakeholderId,
          sentimentDelta: stakeholder.sentimentDelta,
          reasonCode: stakeholder.reasonCode,
          originDecisionRecordId: input.decision.id,
          consequenceId: consequence.id,
          contentPackageVersionId: input.run.contentPackageVersionId,
          causationEventId: createdEventIds.get(consequence.id) ?? null,
        }),
      );
    }

    const analytics = input.resolution.analyticsSignals.find(
      (entry) => entry.consequenceId === consequence.id,
    );
    if (analytics) {
      events.push(
        createAnalyticsSignalEmittedEvent({
          ...base,
          eventId: input.allocateEventId(),
          signalId: analytics.signalId,
          signalType: analytics.signalType,
          dimension: analytics.dimension,
          value: analytics.value,
          reasonCode: analytics.reasonCode,
          originDecisionRecordId: input.decision.id,
          consequenceId: consequence.id,
          contentPackageVersionId: input.run.contentPackageVersionId,
          causationEventId: createdEventIds.get(consequence.id) ?? null,
        }),
      );
    }

    const learnerMessage = input.resolution.learnerMessageDeliveries.find(
      (entry) => entry.consequenceId === consequence.id,
    );
    if (learnerMessage) {
      events.push(
        createLearnerMessageDeliveredEvent({
          ...base,
          eventId: input.allocateEventId(),
          occurrenceId: learnerMessage.occurrence.occurrenceId,
          messageDefinitionId: learnerMessage.occurrence.definitionId,
          definitionVersion: learnerMessage.occurrence.definitionVersion,
          deliverySequence: learnerMessage.occurrence.deliverySequence,
          deliveredAt: learnerMessage.occurrence.deliveredAt,
          originDecisionRecordId: input.decision.id,
          consequenceId: consequence.id,
          contentPackageVersionId: input.run.contentPackageVersionId,
          causationEventId: createdEventIds.get(consequence.id) ?? null,
        }),
      );
    }

    if (consequence.status === "scheduled") {
      const scheduled = input.resolution.scheduledEvents.find(
        (entry) => entry.originConsequenceId === consequence.id,
      );
      if (!scheduled) {
        continue;
      }
      events.push(
        createConsequenceScheduledEvent({
          ...base,
          eventId: input.allocateEventId(),
          consequenceId: consequence.id,
          scheduledEventId: scheduled.id,
          delayMs: scheduled.delayMs,
          dueAt: scheduled.dueAt,
          createdAt: scheduled.createdAt,
        }),
      );
    } else {
      events.push(
        createConsequenceAppliedEvent({
          ...base,
          eventId: input.allocateEventId(),
          consequenceId: consequence.id,
          appliedAt: consequence.appliedAt ?? input.resolvedAt,
          resultingStateVersion: input.resultingStateVersion,
          effectSummary: consequence.consequenceType,
        }),
      );
    }
  }

  events.push(
    createDecisionResolvedEvent({
      ...base,
      eventId: input.allocateEventId(),
      decisionRecordId: input.decision.id,
      decisionOutcomeId: input.outcome.id,
      resolverVersion: input.outcome.resolverVersion,
      qualityClassification: input.outcome.qualityClassification,
      consequenceIds: input.outcome.consequenceIds,
      resolvedAt: input.resolvedAt,
    }),
  );

  return events;
};

/**
 * Resolve a previously submitted Decision (recovery / interrupted workflows).
 *
 * Idempotent when already resolved: returns existing outcome without advancing
 * versions or emitting duplicate events.
 */
export const resolveDecision = (
  run: SimulationRun,
  input: ResolveDecisionInput,
): Result<ResolveDecisionResult, RuleViolationError> => {
  if (run.status !== "active") {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot resolve decisions.`,
        { status: run.status },
      ),
    );
  }

  const decision = findDecisionByRecordId(run.state, input.decisionRecordId);
  if (!decision) {
    return err(
      ruleViolationError(
        "DECISION_NOT_FOUND",
        `Decision '${input.decisionRecordId}' was not found on this run.`,
        { decisionRecordId: input.decisionRecordId },
      ),
    );
  }

  if (decision.status === "resolved") {
    const existing = run.state.decisionOutcomes.find(
      (outcome) => outcome.id === decision.outcomeId,
    );
    if (!existing) {
      return err(
        ruleViolationError(
          "PERSISTED_OUTCOME_INVALID",
          `Resolved Decision '${decision.id}' is missing its Outcome.`,
        ),
      );
    }
    // Already resolved: return existing outcome. Resolver-version drift must not
    // rewrite an existing Outcome (no mutation / no new events).
    return ok({
      run,
      decision,
      outcome: existing,
      events: [],
      alreadyResolved: true,
    });
  }

  if (decision.status !== "submitted") {
    return err(
      ruleViolationError(
        "DECISION_NOT_SUBMITTED",
        `Decision '${decision.id}' is '${decision.status}' and cannot be resolved.`,
        { status: decision.status },
      ),
    );
  }

  if (
    run.state.decisionOutcomes.some(
      (outcome) => outcome.decisionRecordId === decision.id,
    )
  ) {
    return err(
      ruleViolationError(
        "DECISION_OUTCOME_ALREADY_EXISTS",
        `Decision '${decision.id}' already has an Outcome.`,
      ),
    );
  }

  if (
    input.definition.contentPackageVersionId !== run.contentPackageVersionId
  ) {
    return err(
      ruleViolationError(
        "CONTENT_VERSION_MISMATCH",
        "Decision definition does not belong to this run's contentPackageVersionId.",
      ),
    );
  }

  const resolution = resolveDecisionDeterministically({
    simulationRunId: run.id,
    tenantId: run.tenantId,
    contentPackageVersionId: run.contentPackageVersionId,
    state: run.state,
    decision,
    definition: input.definition,
    originActionId: decision.sourceActionId,
    resolvedAt: input.resolvedAt,
    originEventId: null,
  });
  if (!resolution.ok) {
    return resolution;
  }

  const resolvedDecision = markDecisionResolved(decision, {
    outcomeId: resolution.value.outcome.id,
    resolvedAt: input.resolvedAt,
  });
  if (!resolvedDecision.ok) {
    return resolvedDecision;
  }

  const nextStateVersion = run.state.stateVersion + 1;
  const nextState: SimulationState = {
    ...run.state,
    stateVersion: nextStateVersion,
    projectMetrics: resolution.value.nextMetrics,
    projectState: resolution.value.nextProjectState,
    decisions: run.state.decisions.map((entry) =>
      entry.id === decision.id ? resolvedDecision.value : entry,
    ),
    decisionOutcomes: [...run.state.decisionOutcomes, resolution.value.outcome],
    consequences: [...run.state.consequences, ...resolution.value.consequences],
    scheduledEvents: [
      ...run.state.scheduledEvents,
      ...resolution.value.scheduledEvents,
    ],
    learnerMessages: [
      ...run.state.learnerMessages,
      ...resolution.value.learnerMessages,
    ],
  };

  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.resolvedAt,
    state: nextState,
  };

  const events = buildResolutionEvents({
    run: nextRun,
    decision: resolvedDecision.value,
    outcome: resolution.value.outcome,
    resolution: resolution.value,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    resolvedAt: input.resolvedAt,
    recordedAt: input.recordedAt,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    allocateEventId: input.allocateEventId,
    resultingStateVersion: nextStateVersion,
  });

  return ok({
    run: nextRun,
    decision: resolvedDecision.value,
    outcome: resolution.value.outcome,
    events,
    alreadyResolved: false,
  });
};

export interface ProcessSubmitDecisionInput extends SubmitDecisionInput {
  readonly allocateEventId: () => EventId;
  /** Optional pinned-package crises for post-decision engine evaluation. */
  readonly crises?: readonly CrisisDefinition[];
}

export interface ProcessSubmitDecisionResult {
  readonly run: SimulationRun;
  readonly decision: Decision;
  readonly outcome: DecisionOutcome;
  readonly events: readonly SimulationDomainEvent[];
}

/**
 * Atomic SubmitDecision + resolveDecision transition (PS-ROADMAP-005).
 *
 * One aggregateVersion / lastProcessedSequence advancement. Events share that
 * action sequence number (PS-ROADMAP-004 semantics preserved).
 */
export const processSubmitDecision = (
  run: SimulationRun,
  input: ProcessSubmitDecisionInput,
): Result<ProcessSubmitDecisionResult, RuleViolationError> => {
  const eligibility = validateDecisionEligibility(
    buildDecisionEligibilityContext({
      runStatus: run.status,
      contentPackageVersionId: run.contentPackageVersionId,
      currentChapterId: run.currentChapterId,
      state: run.state,
    }),
    input,
  );
  if (!eligibility.ok) {
    return eligibility;
  }

  const contextStateVersion = run.state.stateVersion;
  const decisionResult = createDecision({
    id: input.decisionRecordId,
    decisionDefinitionId: input.decisionDefinitionId,
    selectedOptionId: input.selectedOptionId,
    submittedBy: input.submittedBy,
    submittedAt: input.submittedAt,
    sourceActionId: input.sourceActionId,
    contextStateVersion,
  });
  if (!decisionResult.ok) {
    return decisionResult;
  }

  // Validate-all-then-commit: resolve against provisional state with submitted Decision.
  const provisionalStateResult = appendDecisionToState(
    run.state,
    decisionResult.value,
  );
  if (!provisionalStateResult.ok) {
    return provisionalStateResult;
  }

  const resolution = resolveDecisionDeterministically({
    simulationRunId: run.id,
    tenantId: run.tenantId,
    contentPackageVersionId: run.contentPackageVersionId,
    state: provisionalStateResult.value,
    decision: decisionResult.value,
    definition: input.definition,
    originActionId: input.sourceActionId,
    resolvedAt: input.submittedAt,
    originEventId: null,
  });
  if (!resolution.ok) {
    return resolution;
  }

  const resolvedDecision = markDecisionResolved(decisionResult.value, {
    outcomeId: resolution.value.outcome.id,
    resolvedAt: input.submittedAt,
  });
  if (!resolvedDecision.ok) {
    return resolvedDecision;
  }

  // Single stateVersion advance for the combined authoritative mutation.
  const nextState: SimulationState = {
    ...provisionalStateResult.value,
    stateVersion: run.state.stateVersion + 1,
    projectMetrics: resolution.value.nextMetrics,
    projectState: resolution.value.nextProjectState,
    decisions: provisionalStateResult.value.decisions.map((entry) =>
      entry.id === decisionResult.value.id ? resolvedDecision.value : entry,
    ),
    decisionOutcomes: [...run.state.decisionOutcomes, resolution.value.outcome],
    consequences: [...run.state.consequences, ...resolution.value.consequences],
    scheduledEvents: [
      ...run.state.scheduledEvents,
      ...resolution.value.scheduledEvents,
    ],
    learnerMessages: [
      ...run.state.learnerMessages,
      ...resolution.value.learnerMessages,
    ],
  };

  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.submittedAt,
    state: nextState,
  };

  const submittedEvent = createDecisionSubmittedEvent({
    eventId: input.eventId,
    occurredAt: input.submittedAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.submittedBy,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    decisionId: resolvedDecision.value.id,
    decisionDefinitionId: resolvedDecision.value.decisionDefinitionId,
    selectedOptionId: resolvedDecision.value.selectedOptionId,
    sourceActionId: resolvedDecision.value.sourceActionId,
    submittedBy: resolvedDecision.value.submittedBy,
    submittedAt: resolvedDecision.value.submittedAt,
    contextStateVersion: resolvedDecision.value.contextStateVersion,
    contentPackageVersionId: run.contentPackageVersionId,
  });

  const resolutionEvents = buildResolutionEvents({
    run: nextRun,
    decision: resolvedDecision.value,
    outcome: resolution.value.outcome,
    resolution: resolution.value,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    resolvedAt: input.submittedAt,
    recordedAt: input.recordedAt,
    actorId: input.submittedBy,
    correlationId: input.correlationId,
    causationId: input.causationId,
    allocateEventId: input.allocateEventId,
    resultingStateVersion: nextState.stateVersion,
  });

  let engineRun = nextRun;
  const decisionEngine = evaluateSimulationEngine({
    run: engineRun,
    boundary: { kind: "decision_resolved" },
    occurredAt: input.submittedAt,
    crises: input.crises ?? [],
  });
  if (!decisionEngine.ok) {
    return decisionEngine;
  }
  engineRun = { ...engineRun, state: decisionEngine.value.state };

  if (resolution.value.metricChanges.length > 0) {
    const metricEngine = evaluateSimulationEngine({
      run: engineRun,
      boundary: { kind: "metric_changed" },
      occurredAt: input.submittedAt,
      crises: input.crises ?? [],
    });
    if (!metricEngine.ok) {
      return metricEngine;
    }
    engineRun = { ...engineRun, state: metricEngine.value.state };
  }

  return ok({
    run: engineRun,
    decision: resolvedDecision.value,
    outcome: resolution.value.outcome,
    events: [submittedEvent, ...resolutionEvents],
  });
};

export interface ProcessScheduleMeetingInput {
  readonly meetingId: MeetingId;
  readonly title: string;
  readonly scheduledFor: IsoTimestamp;
  readonly participantIds: readonly StakeholderId[];
  readonly agenda?: string;
  readonly definitionVersion?: string;
  readonly durationMinutes?: number;
  readonly channel?: string;
  readonly location?: string;
  readonly participantDisplayNames?: Readonly<Record<string, string>>;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessScheduleMeetingResult {
  readonly run: SimulationRun;
  readonly occurrence: MeetingOccurrence;
  readonly events: readonly SimulationDomainEvent[];
  /** True when an identical occurrence already existed (no MeetingScheduled). */
  readonly identicalNoop: boolean;
}

/**
 * Schedule an authoritative Meeting occurrence on SimulationRun (PS-ROADMAP-016).
 *
 * Occurrence identity: `meeting_occurrence:${meetingId}` (one per MeetingId).
 * Ordering: monotonic `scheduleSequence` (canonical authority for later PS-017).
 */
export const processScheduleMeeting = (
  run: SimulationRun,
  input: ProcessScheduleMeetingInput,
): Result<ProcessScheduleMeetingResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const meetingOccurrenceId = deriveMeetingOccurrenceId(input.meetingId);
  const participants: MeetingParticipantSnapshot[] = input.participantIds.map(
    (stakeholderId) => ({
      stakeholderId,
      displayName:
        input.participantDisplayNames?.[stakeholderId]?.trim() || stakeholderId,
    }),
  );

  const candidate = createMeetingOccurrence({
    meetingOccurrenceId,
    meetingDefinitionId: asMeetingDefinitionId(input.meetingId),
    meetingDefinitionVersion: input.definitionVersion ?? "1",
    scheduleSequence:
      run.state.meetings.reduce(
        (max, meeting) => Math.max(max, meeting.scheduleSequence),
        0,
      ) + 1,
    scheduledFor: input.scheduledFor,
    durationMinutes:
      input.durationMinutes === undefined ? null : input.durationMinutes,
    title: input.title,
    agenda: input.agenda ?? null,
    participants,
    channel: input.channel ?? null,
    location: input.location ?? null,
    scheduledAt: input.occurredAt,
    originatingCommandId: input.commandId,
  });
  if (!candidate.ok) {
    return candidate;
  }

  const existing = run.state.meetings.find(
    (meeting) => meeting.meetingOccurrenceId === meetingOccurrenceId,
  );
  if (existing) {
    if (meetingOccurrenceSemanticEqual(existing, candidate.value)) {
      const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
      if (!advanced.ok) {
        return advanced;
      }
      return ok({
        run: advanced.value,
        occurrence: existing,
        events: [],
        identicalNoop: true,
      });
    }
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_CONFLICT",
        `Meeting occurrence '${meetingOccurrenceId}' already exists with conflicting content.`,
        { meetingOccurrenceId },
      ),
    );
  }

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    meetings: [...run.state.meetings, candidate.value],
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const scheduledEvent = createMeetingScheduledEvent({
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    meetingOccurrenceId: candidate.value.meetingOccurrenceId,
    meetingDefinitionId: candidate.value.meetingDefinitionId,
    meetingDefinitionVersion: candidate.value.meetingDefinitionVersion,
    scheduleSequence: candidate.value.scheduleSequence,
    scheduledFor: candidate.value.scheduledFor,
    originatingCommandId: candidate.value.originatingCommandId,
    contentPackageVersionId: run.contentPackageVersionId,
  });

  return ok({
    run: nextRun,
    occurrence: candidate.value,
    events: [scheduledEvent],
    identicalNoop: false,
  });
};

export interface ProcessMeetingLifecycleInput {
  readonly meetingId: MeetingId;
  readonly command: MeetingLifecycleCommand;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessMeetingLifecycleResult {
  readonly run: SimulationRun;
  readonly occurrence: MeetingOccurrence;
  readonly events: readonly SimulationDomainEvent[];
  /** True when the meeting was already in the target status (no domain event). */
  readonly identicalNoop: boolean;
}

/**
 * Apply an authoritative Meeting lifecycle transition (PS-ROADMAP-016).
 */
export const processMeetingLifecycle = (
  run: SimulationRun,
  input: ProcessMeetingLifecycleInput,
): Result<ProcessMeetingLifecycleResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const meetingOccurrenceId = deriveMeetingOccurrenceId(input.meetingId);
  const existing = run.state.meetings.find(
    (meeting) => meeting.meetingOccurrenceId === meetingOccurrenceId,
  );
  if (!existing) {
    return err(
      ruleViolationError(
        "MEETING_NOT_FOUND",
        `Meeting occurrence '${meetingOccurrenceId}' was not found.`,
        { meetingOccurrenceId },
      ),
    );
  }

  const transitioned = transitionMeetingOccurrence(
    existing,
    input.command,
    input.occurredAt,
  );
  if (!transitioned.ok) {
    return transitioned;
  }

  if (transitioned.value.status === existing.status) {
    const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
    if (!advanced.ok) {
      return advanced;
    }
    return ok({
      run: advanced.value,
      occurrence: existing,
      events: [],
      identicalNoop: true,
    });
  }

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    meetings: run.state.meetings.map((meeting) =>
      meeting.meetingOccurrenceId === meetingOccurrenceId
        ? transitioned.value
        : meeting,
    ),
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const baseEvent = {
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    meetingOccurrenceId: transitioned.value.meetingOccurrenceId,
    meetingDefinitionId: transitioned.value.meetingDefinitionId,
    scheduleSequence: transitioned.value.scheduleSequence,
    originatingCommandId: input.commandId,
  };

  let lifecycleEvent: SimulationDomainEvent;
  switch (input.command) {
    case "MakeMeetingAvailable": {
      if (transitioned.value.availableAt === null) {
        return err(
          ruleViolationError(
            "MEETING_OCCURRENCE_INVALID",
            "Meeting.availableAt missing after MakeMeetingAvailable.",
          ),
        );
      }
      lifecycleEvent = createMeetingMadeAvailableEvent({
        ...baseEvent,
        availableAt: transitioned.value.availableAt,
      });
      break;
    }
    case "StartMeeting": {
      if (transitioned.value.startedAt === null) {
        return err(
          ruleViolationError(
            "MEETING_OCCURRENCE_INVALID",
            "Meeting.startedAt missing after StartMeeting.",
          ),
        );
      }
      lifecycleEvent = createMeetingStartedEvent({
        ...baseEvent,
        startedAt: transitioned.value.startedAt,
      });
      break;
    }
    case "CompleteMeeting": {
      if (transitioned.value.completedAt === null) {
        return err(
          ruleViolationError(
            "MEETING_OCCURRENCE_INVALID",
            "Meeting.completedAt missing after CompleteMeeting.",
          ),
        );
      }
      lifecycleEvent = createMeetingCompletedEvent({
        ...baseEvent,
        completedAt: transitioned.value.completedAt,
      });
      break;
    }
    case "CancelMeeting": {
      if (transitioned.value.cancelledAt === null) {
        return err(
          ruleViolationError(
            "MEETING_OCCURRENCE_INVALID",
            "Meeting.cancelledAt missing after CancelMeeting.",
          ),
        );
      }
      lifecycleEvent = createMeetingCancelledEvent({
        ...baseEvent,
        cancelledAt: transitioned.value.cancelledAt,
      });
      break;
    }
    default: {
      const _exhaustive: never = input.command;
      return err(
        ruleViolationError(
          "MEETING_TRANSITION_INVALID",
          `Unsupported meeting lifecycle command '${String(_exhaustive)}'.`,
        ),
      );
    }
  }

  return ok({
    run: nextRun,
    occurrence: transitioned.value,
    events: [lifecycleEvent],
    identicalNoop: false,
  });
};

export interface ProcessInitializeDocumentInput {
  readonly documentId: DocumentId;
  readonly definitionVersion?: string;
  readonly title: string;
  readonly body: string;
  readonly category?: string;
  readonly description?: string;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessInitializeDocumentResult {
  readonly run: SimulationRun;
  readonly document: DocumentRuntime;
  readonly events: readonly SimulationDomainEvent[];
  /** True when an identical Document already existed (no DocumentInitialized). */
  readonly identicalNoop: boolean;
}

/**
 * Initialize an authoritative runtime Document on SimulationRun (PS-ROADMAP-020).
 *
 * Identity: DocumentId (one available-only plain-text snapshot per id per run).
 * Ordering: monotonic creationSequence.
 */
export const processInitializeDocument = (
  run: SimulationRun,
  input: ProcessInitializeDocumentInput,
): Result<ProcessInitializeDocumentResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const content = createDocumentLearnerSafeContent({
    title: input.title,
    category: input.category ?? null,
    description: input.description ?? null,
    contentType: "plain_text",
    body: input.body,
  });
  if (!content.ok) {
    return content;
  }

  const candidate = createDocumentRuntime({
    documentId: input.documentId,
    documentDefinitionVersion: input.definitionVersion ?? "1",
    creationSequence:
      run.state.documents.reduce(
        (max, document) => Math.max(max, document.creationSequence),
        0,
      ) + 1,
    content: content.value,
    createdAt: input.occurredAt,
    originatingCommandId: input.commandId,
  });
  if (!candidate.ok) {
    return candidate;
  }

  const existing = run.state.documents.find(
    (document) => document.documentId === input.documentId,
  );
  if (existing) {
    if (documentRuntimeSemanticEqual(existing, candidate.value)) {
      const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
      if (!advanced.ok) {
        return advanced;
      }
      return ok({
        run: advanced.value,
        document: existing,
        events: [],
        identicalNoop: true,
      });
    }
    return err(
      ruleViolationError(
        "DOCUMENT_IDENTITY_CONFLICT",
        `Document '${input.documentId}' already exists with conflicting content.`,
        { documentId: input.documentId },
      ),
    );
  }

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    documents: [...run.state.documents, candidate.value],
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const initializedEvent = createDocumentInitializedEvent({
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    documentId: candidate.value.documentId,
    documentDefinitionId: candidate.value.documentDefinitionId,
    documentDefinitionVersion: candidate.value.documentDefinitionVersion,
    creationSequence: candidate.value.creationSequence,
    originatingCommandId: candidate.value.originatingCommandId,
    contentPackageVersionId: run.contentPackageVersionId,
  });

  return ok({
    run: nextRun,
    document: candidate.value,
    events: [initializedEvent],
    identicalNoop: false,
  });
};

export interface ProcessInitializeNotificationInput {
  readonly notificationId: NotificationId;
  readonly title: string;
  readonly summary: string;
  readonly body?: string;
  readonly sourceKind: NotificationSourceKind;
  readonly sourceId?: string;
  readonly sourceReason?: string;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessInitializeNotificationResult {
  readonly run: SimulationRun;
  readonly notification: NotificationRuntime;
  readonly events: readonly SimulationDomainEvent[];
  /** True when an identical Notification already existed (no NotificationInitialized). */
  readonly identicalNoop: boolean;
}

/**
 * Initialize an authoritative runtime Notification on SimulationRun (PS-ROADMAP-021).
 *
 * Identity: NotificationId (one active-only attention item per id per run).
 * Ordering: monotonic creationSequence.
 * Lifecycle v1: active-only append-only (no dismiss/read).
 */
export const processInitializeNotification = (
  run: SimulationRun,
  input: ProcessInitializeNotificationInput,
): Result<ProcessInitializeNotificationResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const content = createNotificationLearnerSafeContent({
    title: input.title,
    summary: input.summary,
    body: input.body ?? null,
  });
  if (!content.ok) {
    return content;
  }

  const source = createNotificationProvenance({
    kind: input.sourceKind,
    sourceId: input.sourceId ?? null,
    reason: input.sourceReason ?? null,
  });
  if (!source.ok) {
    return source;
  }

  const candidate = createNotificationRuntime({
    notificationId: input.notificationId,
    creationSequence:
      run.state.notifications.reduce(
        (max, notification) => Math.max(max, notification.creationSequence),
        0,
      ) + 1,
    content: content.value,
    source: source.value,
    createdAt: input.occurredAt,
    originatingCommandId: input.commandId,
  });
  if (!candidate.ok) {
    return candidate;
  }

  const existing = run.state.notifications.find(
    (notification) => notification.notificationId === input.notificationId,
  );
  if (existing) {
    if (notificationRuntimeSemanticEqual(existing, candidate.value)) {
      const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
      if (!advanced.ok) {
        return advanced;
      }
      return ok({
        run: advanced.value,
        notification: existing,
        events: [],
        identicalNoop: true,
      });
    }
    return err(
      ruleViolationError(
        "NOTIFICATION_IDENTITY_CONFLICT",
        `Notification '${input.notificationId}' already exists with conflicting content.`,
        { notificationId: input.notificationId },
      ),
    );
  }

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    notifications: [...run.state.notifications, candidate.value],
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const initializedEvent = createNotificationInitializedEvent({
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    notificationId: candidate.value.notificationId,
    creationSequence: candidate.value.creationSequence,
    sourceKind: candidate.value.source.kind,
    sourceId: candidate.value.source.sourceId,
    sourceReason: candidate.value.source.reason,
    originatingCommandId: candidate.value.originatingCommandId,
    contentPackageVersionId: run.contentPackageVersionId,
  });

  return ok({
    run: nextRun,
    notification: candidate.value,
    events: [initializedEvent],
    identicalNoop: false,
  });
};

export interface ProcessInitializeStakeholderInput {
  readonly stakeholderId: StakeholderId;
  readonly definitionVersion?: string;
  readonly displayName: string;
  readonly roleLabel?: string;
  readonly organization?: string;
  readonly department?: string;
  readonly biography?: string;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessInitializeStakeholderResult {
  readonly run: SimulationRun;
  readonly stakeholder: StakeholderRuntime;
  readonly events: readonly SimulationDomainEvent[];
  /** True when an identical Stakeholder already existed (no StakeholderInitialized). */
  readonly identicalNoop: boolean;
}

/**
 * Initialize an authoritative runtime Stakeholder on SimulationRun (PS-ROADMAP-018).
 *
 * Identity: StakeholderId (one runtime instance per definition id per run).
 * Ordering: monotonic initializationSequence.
 */
export const processInitializeStakeholder = (
  run: SimulationRun,
  input: ProcessInitializeStakeholderInput,
): Result<ProcessInitializeStakeholderResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const profile = createStakeholderLearnerSafeProfile({
    displayName: input.displayName,
    roleLabel: input.roleLabel ?? null,
    organization: input.organization ?? null,
    department: input.department ?? null,
    biography: input.biography ?? null,
  });
  if (!profile.ok) {
    return profile;
  }

  const candidate = createStakeholderRuntime({
    stakeholderId: input.stakeholderId,
    stakeholderDefinitionVersion: input.definitionVersion ?? "1",
    initializationSequence:
      run.state.stakeholders.reduce(
        (max, stakeholder) => Math.max(max, stakeholder.initializationSequence),
        0,
      ) + 1,
    profile: profile.value,
    initializedAt: input.occurredAt,
    originatingCommandId: input.commandId,
  });
  if (!candidate.ok) {
    return candidate;
  }

  const existing = run.state.stakeholders.find(
    (stakeholder) => stakeholder.stakeholderId === input.stakeholderId,
  );
  if (existing) {
    if (stakeholderRuntimeSemanticEqual(existing, candidate.value)) {
      const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
      if (!advanced.ok) {
        return advanced;
      }
      return ok({
        run: advanced.value,
        stakeholder: existing,
        events: [],
        identicalNoop: true,
      });
    }
    return err(
      ruleViolationError(
        "STAKEHOLDER_IDENTITY_CONFLICT",
        `Stakeholder '${input.stakeholderId}' already exists with conflicting content.`,
        { stakeholderId: input.stakeholderId },
      ),
    );
  }

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    stakeholders: [...run.state.stakeholders, candidate.value],
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const initializedEvent = createStakeholderInitializedEvent({
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    stakeholderId: candidate.value.stakeholderId,
    stakeholderDefinitionId: candidate.value.stakeholderDefinitionId,
    stakeholderDefinitionVersion: candidate.value.stakeholderDefinitionVersion,
    initializationSequence: candidate.value.initializationSequence,
    originatingCommandId: candidate.value.originatingCommandId,
    contentPackageVersionId: run.contentPackageVersionId,
  });

  return ok({
    run: nextRun,
    stakeholder: candidate.value,
    events: [initializedEvent],
    identicalNoop: false,
  });
};

export interface ProcessSendStakeholderMessageInput {
  readonly recipientId: StakeholderId;
  readonly body: string;
  readonly conversationId?: ConversationId;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
  readonly allocateEventId: () => EventId;
}

export interface ProcessSendStakeholderMessageResult {
  readonly run: SimulationRun;
  readonly conversation: StakeholderConversation;
  readonly message: StakeholderMessageOccurrence;
  readonly events: readonly SimulationDomainEvent[];
  /** True when an identical message already existed (no message Domain event). */
  readonly identicalNoop: boolean;
}

/**
 * Record a learner-to-Stakeholder message on SimulationRun (PS-ROADMAP-018).
 *
 * Conversation identity: `conversation:{recipientId}` (one per Stakeholder).
 * Message identity: `stakeholder_message:{commandId}`.
 * Opens the conversation on the first message. Does not mutate Inbox.
 */
export const processSendStakeholderMessage = (
  run: SimulationRun,
  input: ProcessSendStakeholderMessageInput,
): Result<ProcessSendStakeholderMessageResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const stakeholder = run.state.stakeholders.find(
    (entry) => entry.stakeholderId === input.recipientId,
  );
  if (!stakeholder) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_NOT_FOUND",
        `Stakeholder '${input.recipientId}' is not initialized on this SimulationRun.`,
        { stakeholderId: input.recipientId },
      ),
    );
  }

  const conversationId = deriveStakeholderConversationId(input.recipientId);
  if (
    input.conversationId !== undefined &&
    input.conversationId !== conversationId
  ) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_CONVERSATION_IDENTITY_CONFLICT",
        `Conversation '${input.conversationId}' does not match the one-per-Stakeholder identity '${conversationId}'.`,
        {
          conversationId: input.conversationId,
          expectedConversationId: conversationId,
          stakeholderId: input.recipientId,
        },
      ),
    );
  }

  const messageId = deriveStakeholderMessageIdFromCommand(input.commandId);
  const existingConversation = run.state.stakeholderConversations.find(
    (conversation) => conversation.conversationId === conversationId,
  );
  if (
    existingConversation &&
    existingConversation.stakeholderId !== input.recipientId
  ) {
    return err(
      ruleViolationError(
        "STAKEHOLDER_CONVERSATION_IDENTITY_CONFLICT",
        `Conversation '${conversationId}' is owned by another Stakeholder.`,
        {
          conversationId,
          stakeholderId: existingConversation.stakeholderId,
        },
      ),
    );
  }

  const nextSequence =
    (existingConversation?.messages.reduce(
      (max, message) => Math.max(max, message.conversationSequence),
      0,
    ) ?? 0) + 1;

  const candidateMessage = createStakeholderMessageOccurrence({
    messageId,
    conversationId,
    stakeholderId: input.recipientId,
    conversationSequence: nextSequence,
    direction: "learner_to_stakeholder",
    authorActorId: input.actorId,
    body: input.body,
    occurredAt: input.occurredAt,
    originatingCommandId: input.commandId,
  });
  if (!candidateMessage.ok) {
    return candidateMessage;
  }

  const existingMessage = run.state.stakeholderConversations
    .flatMap((conversation) => conversation.messages)
    .find((message) => message.messageId === messageId);
  if (existingMessage) {
    if (
      stakeholderMessageSemanticEqual(existingMessage, candidateMessage.value)
    ) {
      const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
      if (!advanced.ok) {
        return advanced;
      }
      const conversation =
        advanced.value.state.stakeholderConversations.find(
          (entry) => entry.conversationId === conversationId,
        ) ?? existingConversation!;
      return ok({
        run: advanced.value,
        conversation,
        message: existingMessage,
        events: [],
        identicalNoop: true,
      });
    }
    return err(
      ruleViolationError(
        "STAKEHOLDER_MESSAGE_IDENTITY_CONFLICT",
        `Stakeholder message '${messageId}' already exists with conflicting content.`,
        { messageId },
      ),
    );
  }

  let conversation: StakeholderConversation;
  let openedConversation = false;
  if (existingConversation) {
    conversation = {
      ...existingConversation,
      messages: [...existingConversation.messages, candidateMessage.value],
    };
  } else {
    const created = createStakeholderConversation({
      conversationId,
      stakeholderId: input.recipientId,
      openedAt: input.occurredAt,
      originatingCommandId: input.commandId,
      messages: [candidateMessage.value],
    });
    if (!created.ok) {
      return created;
    }
    conversation = created.value;
    openedConversation = true;
  }

  const nextConversations = existingConversation
    ? run.state.stakeholderConversations.map((entry) =>
        entry.conversationId === conversationId ? conversation : entry,
      )
    : [...run.state.stakeholderConversations, conversation];

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    stakeholderConversations: nextConversations,
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const baseEvent = {
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    contentPackageVersionId: run.contentPackageVersionId,
  };

  const events: SimulationDomainEvent[] = [];
  if (openedConversation) {
    events.push(
      createStakeholderConversationOpenedEvent({
        ...baseEvent,
        eventId: input.eventId,
        conversationId: conversation.conversationId,
        stakeholderId: conversation.stakeholderId,
        originatingCommandId: input.commandId,
      }),
    );
  }
  events.push(
    createStakeholderMessageSentEvent({
      ...baseEvent,
      eventId: openedConversation ? input.allocateEventId() : input.eventId,
      messageId: candidateMessage.value.messageId,
      conversationId: candidateMessage.value.conversationId,
      stakeholderId: candidateMessage.value.stakeholderId,
      conversationSequence: candidateMessage.value.conversationSequence,
      authorActorId: candidateMessage.value.authorActorId,
      originatingCommandId: candidateMessage.value.originatingCommandId,
    }),
  );

  return ok({
    run: nextRun,
    conversation,
    message: candidateMessage.value,
    events,
    identicalNoop: false,
  });
};

export interface ProcessInitializeActivityInput {
  readonly activityId: ActivityId;
  readonly title: string;
  readonly summary: string;
  readonly body?: string;
  readonly sourceKind: ActivitySourceKind;
  readonly sourceId?: string;
  readonly sourceReason?: string;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessInitializeActivityResult {
  readonly run: SimulationRun;
  readonly activity: ActivityRuntime;
  readonly events: readonly SimulationDomainEvent[];
  /** True when an identical Activity already existed (no ActivityInitialized). */
  readonly identicalNoop: boolean;
}

/**
 * Initialize an authoritative runtime Activity on SimulationRun (PS-ROADMAP-022).
 *
 * Identity: ActivityId (one active-or-completed item per id per run).
 * Ordering: monotonic creationSequence.
 * Lifecycle v1: active → completed (no reopen).
 */
export const processInitializeActivity = (
  run: SimulationRun,
  input: ProcessInitializeActivityInput,
): Result<ProcessInitializeActivityResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const content = createActivityLearnerSafeContent({
    title: input.title,
    summary: input.summary,
    body: input.body ?? null,
  });
  if (!content.ok) {
    return content;
  }

  const source = createActivityProvenance({
    kind: input.sourceKind,
    sourceId: input.sourceId ?? null,
    reason: input.sourceReason ?? null,
  });
  if (!source.ok) {
    return source;
  }

  const candidate = createActivityRuntime({
    activityId: input.activityId,
    creationSequence:
      run.state.activities.reduce(
        (max, activity) => Math.max(max, activity.creationSequence),
        0,
      ) + 1,
    content: content.value,
    source: source.value,
    createdAt: input.occurredAt,
    originatingCommandId: input.commandId,
  });
  if (!candidate.ok) {
    return candidate;
  }

  const existing = run.state.activities.find(
    (activity) => activity.activityId === input.activityId,
  );
  if (existing) {
    if (activityRuntimeSemanticEqual(existing, candidate.value)) {
      const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
      if (!advanced.ok) {
        return advanced;
      }
      return ok({
        run: advanced.value,
        activity: existing,
        events: [],
        identicalNoop: true,
      });
    }
    return err(
      ruleViolationError(
        "ACTIVITY_IDENTITY_CONFLICT",
        `Activity '${input.activityId}' already exists with conflicting content.`,
        { activityId: input.activityId },
      ),
    );
  }

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    activities: [...run.state.activities, candidate.value],
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const initializedEvent = createActivityInitializedEvent({
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    activityId: candidate.value.activityId,
    creationSequence: candidate.value.creationSequence,
    sourceKind: candidate.value.source.kind,
    sourceId: candidate.value.source.sourceId,
    sourceReason: candidate.value.source.reason,
    originatingCommandId: candidate.value.originatingCommandId,
    contentPackageVersionId: run.contentPackageVersionId,
  });

  return ok({
    run: nextRun,
    activity: candidate.value,
    events: [initializedEvent],
    identicalNoop: false,
  });
};

export interface ProcessCompleteActivityInput {
  readonly activityId: ActivityId;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessCompleteActivityResult {
  readonly run: SimulationRun;
  readonly activity: ActivityRuntime;
  readonly events: readonly SimulationDomainEvent[];
  /** True when the Activity was already completed (idempotent noop). */
  readonly identicalNoop: boolean;
}

/**
 * Complete an authoritative runtime Activity on SimulationRun (PS-ROADMAP-022).
 *
 * If already completed → identicalNoop (advance aggregate, emit no ActivityCompleted).
 * If not found → ACTIVITY_NOT_FOUND error.
 */
export const processCompleteActivity = (
  run: SimulationRun,
  input: ProcessCompleteActivityInput,
): Result<ProcessCompleteActivityResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const existing = run.state.activities.find(
    (activity) => activity.activityId === input.activityId,
  );
  if (!existing) {
    return err(
      ruleViolationError(
        "ACTIVITY_NOT_FOUND",
        `Activity '${input.activityId}' was not found on this SimulationRun.`,
        { activityId: input.activityId },
      ),
    );
  }

  if (existing.status === "completed") {
    const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
    if (!advanced.ok) {
      return advanced;
    }
    return ok({
      run: advanced.value,
      activity: existing,
      events: [],
      identicalNoop: true,
    });
  }

  const nextCompletionSequence =
    run.state.activities
      .filter((activity) => activity.status === "completed")
      .reduce(
        (max, activity) => Math.max(max, activity.completionSequence ?? 0),
        0,
      ) + 1;

  const completed = completeActivityRuntime({
    activity: existing,
    completedAt: input.occurredAt,
    completionSequence: nextCompletionSequence,
    completingCommandId: input.commandId,
  });
  if (!completed.ok) {
    return completed;
  }

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    activities: run.state.activities.map((activity) =>
      activity.activityId === input.activityId ? completed.value : activity,
    ),
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const completedEvent = createActivityCompletedEvent({
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    activityId: completed.value.activityId,
    completionSequence: completed.value.completionSequence!,
    completedAt: completed.value.completedAt!,
    originatingCommandId: input.commandId,
    contentPackageVersionId: run.contentPackageVersionId,
  });

  return ok({
    run: nextRun,
    activity: completed.value,
    events: [completedEvent],
    identicalNoop: false,
  });
};

export interface ProcessDeliverLearnerMessageInput {
  readonly messageDefinitionId: LearnerMessageDefinitionId;
  readonly definitionVersion?: string;
  readonly senderId?: string | null;
  readonly senderDisplayName: string;
  readonly senderRoleLabel?: string | null;
  readonly subject: string;
  readonly body: string;
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessDeliverLearnerMessageResult {
  readonly run: SimulationRun;
  readonly occurrence: LearnerMessageOccurrence;
  readonly events: readonly SimulationDomainEvent[];
  /** True when an identical occurrence already existed (no LearnerMessageDelivered). */
  readonly identicalNoop: boolean;
}

/**
 * Deliver a content-driven learner-message occurrence (chapter inbox init).
 *
 * Identity: `learner_message:init:{messageDefinitionId}` (one per definition).
 * Ordering: monotonic deliverySequence.
 */
export const processDeliverLearnerMessage = (
  run: SimulationRun,
  input: ProcessDeliverLearnerMessageInput,
): Result<ProcessDeliverLearnerMessageResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  const occurrenceId = deriveInitLearnerMessageOccurrenceId(
    input.messageDefinitionId,
  );
  const candidate = createLearnerMessageOccurrence({
    occurrenceId,
    definitionId: input.messageDefinitionId,
    definitionVersion: input.definitionVersion ?? "1",
    deliverySequence:
      run.state.learnerMessages.reduce(
        (max, message) => Math.max(max, message.deliverySequence),
        0,
      ) + 1,
    deliveredAt: input.occurredAt,
    sender: {
      senderId: input.senderId ?? null,
      displayName: input.senderDisplayName,
      roleLabel: input.senderRoleLabel ?? null,
    },
    subject: input.subject,
    body: input.body,
  });
  if (!candidate.ok) {
    return candidate;
  }

  const existing = run.state.learnerMessages.find(
    (message) => message.occurrenceId === occurrenceId,
  );
  if (existing) {
    if (learnerMessageSemanticEqual(existing, candidate.value)) {
      const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
      if (!advanced.ok) {
        return advanced;
      }
      return ok({
        run: advanced.value,
        occurrence: existing,
        events: [],
        identicalNoop: true,
      });
    }
    return err(
      ruleViolationError(
        "LEARNER_MESSAGE_OCCURRENCE_CONFLICT",
        `LearnerMessage '${occurrenceId}' already exists with conflicting content.`,
        {
          occurrenceId,
          messageDefinitionId: input.messageDefinitionId,
        },
      ),
    );
  }

  const nextState: SimulationState = {
    ...run.state,
    stateVersion: run.state.stateVersion + 1,
    learnerMessages: [...run.state.learnerMessages, candidate.value],
  };
  const nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  const deliveredEvent = createLearnerMessageDeliveredEvent({
    eventId: input.eventId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    aggregateVersion: nextRun.aggregateVersion,
    sequenceNumber: nextRun.lastProcessedSequence,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: run.tenantId,
    simulationRunId: run.id,
    occurrenceId: candidate.value.occurrenceId,
    messageDefinitionId: candidate.value.definitionId,
    definitionVersion: candidate.value.definitionVersion,
    deliverySequence: candidate.value.deliverySequence,
    deliveredAt: candidate.value.deliveredAt,
    originDecisionRecordId: null,
    consequenceId: null,
    contentPackageVersionId: run.contentPackageVersionId,
    causationEventId: null,
  });

  return ok({
    run: nextRun,
    occurrence: candidate.value,
    events: [deliveredEvent],
    identicalNoop: false,
  });
};

export interface ProcessCompleteChapterEndingNotification {
  readonly notificationId: NotificationId;
  readonly title: string;
  readonly summary: string;
  readonly body?: string;
}

export interface ProcessCompleteChapterInput {
  readonly chapterId: ChapterId;
  readonly nextChapterId?: ChapterId | null;
  readonly requiredDecisionIds: readonly DecisionId[];
  readonly requiredActivityIds: readonly ActivityId[];
  readonly requiredMeetingIds: readonly MeetingId[];
  readonly endingNotification?: ProcessCompleteChapterEndingNotification | null;
  /** Authored chapter.completionWhen; null/undefined skips condition gate. */
  readonly completionWhen?: ConditionExpression | null;
  /** Pinned-package crises for engine evaluation (case-neutral Domain input). */
  readonly crises?: readonly CrisisDefinition[];
  readonly commandId: CommandId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly eventId: EventId;
}

export interface ProcessCompleteChapterResult {
  readonly run: SimulationRun;
  readonly events: readonly SimulationDomainEvent[];
  /** True when the chapter was already completed (idempotent noop). */
  readonly identicalNoop: boolean;
}

const isChapterProgressCompleted = (
  entry: unknown,
  chapterId: ChapterId,
): boolean => {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return false;
  }
  const record = entry as Record<string, unknown>;
  return record.chapterId === chapterId && record.status === "completed";
};

/**
 * Complete a chapter when required decisions/activities/meetings are satisfied.
 *
 * Idempotent for the same chapterId once recorded in chapterProgress.
 * Optionally initializes an ending Notification in the same process.
 */
export const processCompleteChapter = (
  run: SimulationRun,
  input: ProcessCompleteChapterInput,
): Result<ProcessCompleteChapterResult, RuleViolationError> => {
  if (!isLearnerActionAllowed(run.status)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_NOT_ACTIVE",
        `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
        { status: run.status },
      ),
    );
  }

  if (
    run.state.chapterProgress.some((entry) =>
      isChapterProgressCompleted(entry, input.chapterId),
    )
  ) {
    const advanced = recordAcceptedLearnerAction(run, input.recordedAt);
    if (!advanced.ok) {
      return advanced;
    }
    return ok({
      run: advanced.value,
      events: [],
      identicalNoop: true,
    });
  }

  const unresolvedDecisions = input.requiredDecisionIds.filter(
    (decisionId) =>
      !run.state.decisions.some(
        (decision) =>
          decision.decisionDefinitionId === decisionId &&
          decision.status === "resolved",
      ),
  );
  if (unresolvedDecisions.length > 0) {
    return err(
      ruleViolationError(
        "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET",
        `Chapter '${input.chapterId}' cannot complete: required decisions are not resolved.`,
        {
          chapterId: input.chapterId,
          unresolvedDecisionIds: unresolvedDecisions,
          codeHint: "DECISION_NOT_ELIGIBLE",
        },
      ),
    );
  }

  const incompleteActivities = input.requiredActivityIds.filter(
    (activityId) =>
      !run.state.activities.some(
        (activity) =>
          activity.activityId === activityId && activity.status === "completed",
      ),
  );
  if (incompleteActivities.length > 0) {
    return err(
      ruleViolationError(
        "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET",
        `Chapter '${input.chapterId}' cannot complete: required activities are not completed.`,
        {
          chapterId: input.chapterId,
          incompleteActivityIds: incompleteActivities,
          codeHint: "ACTIVITY_NOT_AVAILABLE",
        },
      ),
    );
  }

  const incompleteMeetings = input.requiredMeetingIds.filter((meetingId) => {
    const definitionId = asMeetingDefinitionId(meetingId);
    return !run.state.meetings.some(
      (meeting) =>
        meeting.meetingDefinitionId === definitionId &&
        meeting.status === "completed",
    );
  });
  if (incompleteMeetings.length > 0) {
    return err(
      ruleViolationError(
        "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET",
        `Chapter '${input.chapterId}' cannot complete: required meetings are not completed.`,
        {
          chapterId: input.chapterId,
          incompleteMeetingIds: incompleteMeetings,
          codeHint: "MEETING_NOT_FOUND",
        },
      ),
    );
  }

  if (!evaluateChapterCondition(run, run.state, input.completionWhen ?? null)) {
    return err(
      ruleViolationError(
        "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET",
        `Chapter '${input.chapterId}' completionWhen condition is not satisfied.`,
        {
          chapterId: input.chapterId,
          codeHint: "CONDITION_NOT_SATISFIED",
        },
      ),
    );
  }

  // Apply chapter-exit schedules / resolve crises before blocker checks.
  const preExitEngine = evaluateSimulationEngine({
    run,
    boundary: { kind: "chapter_exit", chapterId: input.chapterId },
    occurredAt: input.occurredAt,
    crises: input.crises ?? [],
  });
  if (!preExitEngine.ok) {
    return preExitEngine;
  }
  if (hasBlockingCrisis(preExitEngine.value.state, input.chapterId)) {
    return err(
      ruleViolationError(
        "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET",
        `Chapter '${input.chapterId}' cannot complete: a blocking crisis is unresolved.`,
        {
          chapterId: input.chapterId,
          codeHint: "CRISIS_BLOCKING",
        },
      ),
    );
  }

  const chapterProgressEntry = {
    chapterId: input.chapterId,
    status: "completed" as const,
    completedAt: input.occurredAt,
  };
  const nextChapterId = input.nextChapterId ?? run.currentChapterId;

  let nextState: SimulationState = {
    ...preExitEngine.value.state,
    stateVersion: run.state.stateVersion + 1,
    chapterProgress: [
      ...preExitEngine.value.state.chapterProgress,
      chapterProgressEntry,
    ],
  };
  const events: SimulationDomainEvent[] = [];

  const ending = input.endingNotification ?? null;
  if (ending) {
    const existingNotification = nextState.notifications.find(
      (notification) => notification.notificationId === ending.notificationId,
    );
    if (!existingNotification) {
      const content = createNotificationLearnerSafeContent({
        title: ending.title,
        summary: ending.summary,
        body: ending.body ?? null,
      });
      if (!content.ok) {
        return content;
      }
      const source = createNotificationProvenance({
        kind: "simulation",
        sourceId: input.chapterId,
        reason: "chapter_completed",
      });
      if (!source.ok) {
        return source;
      }
      const notification = createNotificationRuntime({
        notificationId: ending.notificationId,
        creationSequence:
          nextState.notifications.reduce(
            (max, item) => Math.max(max, item.creationSequence),
            0,
          ) + 1,
        content: content.value,
        source: source.value,
        createdAt: input.occurredAt,
        originatingCommandId: input.commandId,
      });
      if (!notification.ok) {
        return notification;
      }
      nextState = {
        ...nextState,
        notifications: [...nextState.notifications, notification.value],
      };
    }
  }

  let nextRun: SimulationRun = {
    ...run,
    aggregateVersion: run.aggregateVersion + 1,
    lastProcessedSequence: run.lastProcessedSequence + 1,
    currentChapterId: nextChapterId,
    updatedAt: input.recordedAt,
    state: nextState,
  };

  if (nextChapterId !== null && nextChapterId !== input.chapterId) {
    const entryEngine = evaluateSimulationEngine({
      run: nextRun,
      boundary: { kind: "chapter_entry", chapterId: nextChapterId },
      occurredAt: input.occurredAt,
      crises: input.crises ?? [],
    });
    if (!entryEngine.ok) {
      return entryEngine;
    }
    nextRun = {
      ...nextRun,
      state: entryEngine.value.state,
    };
  }

  if (ending) {
    const added = nextRun.state.notifications.find(
      (notification) => notification.notificationId === ending.notificationId,
    );
    const wasPresent = run.state.notifications.some(
      (notification) => notification.notificationId === ending.notificationId,
    );
    if (added && !wasPresent) {
      events.push(
        createNotificationInitializedEvent({
          eventId: input.eventId,
          occurredAt: input.occurredAt,
          recordedAt: input.recordedAt,
          aggregateVersion: nextRun.aggregateVersion,
          sequenceNumber: nextRun.lastProcessedSequence,
          actorId: input.actorId,
          correlationId: input.correlationId,
          causationId: input.causationId,
          tenantId: run.tenantId,
          simulationRunId: run.id,
          notificationId: added.notificationId,
          creationSequence: added.creationSequence,
          sourceKind: added.source.kind,
          sourceId: added.source.sourceId,
          sourceReason: added.source.reason,
          originatingCommandId: added.originatingCommandId,
          contentPackageVersionId: run.contentPackageVersionId,
        }),
      );
    }
  }

  return ok({
    run: nextRun,
    events,
    identicalNoop: false,
  });
};
