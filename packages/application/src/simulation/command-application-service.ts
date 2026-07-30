import {
  createSimulationActionAcceptedEvent,
  getThrownDomainError,
  processCompleteActivity,
  processCompleteChapter,
  processDeliverLearnerMessage,
  processInitializeActivity,
  processInitializeDocument,
  processInitializeNotification,
  isLearnerActionAllowed,
  processInitializeStakeholder,
  processMeetingLifecycle,
  processScheduleMeeting,
  processSendStakeholderMessage,
  processSubmitDecision,
  recordAcceptedLearnerAction,
  ruleViolationError,
  validationError,
  type CommandError,
  type CommandRejected,
  type CommandResult,
  type MeetingLifecycleCommand,
  type SimulationCommand,
  type SimulationDomainEvent,
  type TenantId,
} from "@projectsim/domain";
import type { SimulationCommandDispatcher } from "./command-dispatcher";
import type { DecisionDefinitionProvider } from "./decision-definition-provider";
import type {
  Clock,
  IdentifierGenerator,
  IdempotencyStore,
  SimulationCommandAuthorizer,
} from "./ports";
import type { SimulationRunRepository } from "./simulation-run-repository";

/**
 * Collaborators the application service coordinates. All are ports/abstractions
 * (domain contracts + application ports); none are concrete infrastructure.
 *
 * Domain events are persisted through {@link SimulationRunRepository.save}
 * (same transaction as the aggregate for Postgres/outbox implementations).
 */
export interface SimulationCommandApplicationServiceDeps {
  readonly tenantId: TenantId;
  readonly dispatcher: SimulationCommandDispatcher;
  readonly authorizer: SimulationCommandAuthorizer;
  readonly idempotencyStore: IdempotencyStore;
  readonly runRepository: SimulationRunRepository;
  readonly decisionDefinitionProvider: DecisionDefinitionProvider;
  readonly clock: Clock;
  readonly identifiers: IdentifierGenerator;
}

/**
 * The simulation command application service.
 *
 * Coordinates the command-processing flow from
 * docs/architecture/03-system-architecture/06_Command_Processing_Architecture.md
 * and PS-ROADMAP-005 decision submission + exactly-once consequence application
 * through SimulationRun.processSubmitDecision.
 */
export interface SimulationCommandApplicationService {
  process(command: SimulationCommand): Promise<CommandResult>;
}

const rejected = (
  command: SimulationCommand,
  error: CommandError,
): CommandRejected => ({
  status: "rejected",
  commandId: command.commandId,
  simulationRunId: command.simulationRunId,
  correlationId: command.correlationId,
  error,
});

export const createSimulationCommandApplicationService = (
  deps: SimulationCommandApplicationServiceDeps,
): SimulationCommandApplicationService => ({
  async process(command) {
    const authorization = await deps.authorizer.authorize(command);
    if (!authorization.ok) {
      return rejected(command, authorization.error);
    }

    const fieldErrors = deps.dispatcher.validate(command);
    if (fieldErrors.length > 0) {
      return rejected(command, validationError(fieldErrors));
    }

    const priorResult = await deps.idempotencyStore.recall(command.commandId);
    if (priorResult) {
      return priorResult;
    }

    let run;
    try {
      run = await deps.runRepository.getById(
        deps.tenantId,
        command.simulationRunId,
      );
    } catch (error) {
      const domainError = getThrownDomainError(error);
      if (domainError) {
        return rejected(command, domainError);
      }
      throw error;
    }
    if (!run) {
      return rejected(
        command,
        ruleViolationError(
          "SIMULATION_RUN_NOT_FOUND",
          `SimulationRun '${command.simulationRunId}' was not found.`,
        ),
      );
    }
    if (run.tenantId !== deps.tenantId) {
      return rejected(command, {
        kind: "authorization",
        code: "TENANT_ACCESS_DENIED",
        retryable: false,
        message: "SimulationRun tenant does not match the session tenant.",
      });
    }

    if (!isLearnerActionAllowed(run.status)) {
      return rejected(
        command,
        ruleViolationError(
          "SIMULATION_RUN_NOT_ACTIVE",
          `SimulationRun '${run.id}' is '${run.status}' and cannot accept learner actions.`,
          { status: run.status },
        ),
      );
    }

    if (
      command.expectedVersion !== null &&
      command.expectedVersion !== run.aggregateVersion
    ) {
      return rejected(command, {
        kind: "concurrency",
        code: "AGGREGATE_VERSION_CONFLICT",
        retryable: false,
        message: `Expected aggregate version ${command.expectedVersion} but found ${run.aggregateVersion}.`,
        expectedVersion: command.expectedVersion,
        actualVersion: run.aggregateVersion,
      });
    }

    const now = deps.clock.now();
    const actionRecordId = deps.identifiers.nextActionRecordId();
    let nextRun = run;
    let emittedEvents: SimulationDomainEvent[] = [];

    if (command.commandType === "SubmitDecision") {
      const definition =
        await deps.decisionDefinitionProvider.getDecisionDefinition(
          deps.tenantId,
          run.contentPackageVersionId,
          command.payload.decisionId,
        );
      if (!definition) {
        return rejected(
          command,
          ruleViolationError(
            "DECISION_DEFINITION_NOT_FOUND",
            `Decision definition '${command.payload.decisionId}' was not found for this run's content package version.`,
            {
              decisionDefinitionId: command.payload.decisionId,
              contentPackageVersionId: run.contentPackageVersionId,
            },
          ),
        );
      }

      const processed = processSubmitDecision(run, {
        decisionRecordId: deps.identifiers.nextDecisionRecordId(),
        decisionDefinitionId: command.payload.decisionId,
        selectedOptionId: command.payload.optionId,
        definition,
        sourceActionId: actionRecordId,
        submittedBy: command.actorId,
        submittedAt: command.occurredAt,
        recordedAt: now,
        eventId: deps.identifiers.nextEventId(),
        correlationId: command.correlationId,
        causationId: command.causationId,
        allocateEventId: () => deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }

      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      // Runtime acceptance first, then Core submit/resolve events (same sequence).
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "InitializeStakeholder") {
      const processed = processInitializeStakeholder(run, {
        stakeholderId: command.payload.stakeholderId,
        ...(command.payload.definitionVersion !== undefined
          ? { definitionVersion: command.payload.definitionVersion }
          : {}),
        displayName: command.payload.displayName,
        ...(command.payload.roleLabel !== undefined
          ? { roleLabel: command.payload.roleLabel }
          : {}),
        ...(command.payload.organization !== undefined
          ? { organization: command.payload.organization }
          : {}),
        ...(command.payload.department !== undefined
          ? { department: command.payload.department }
          : {}),
        ...(command.payload.biography !== undefined
          ? { biography: command.payload.biography }
          : {}),
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "SendStakeholderMessage") {
      const processed = processSendStakeholderMessage(run, {
        recipientId: command.payload.recipientId,
        body: command.payload.body,
        ...(command.payload.conversationId !== undefined
          ? { conversationId: command.payload.conversationId }
          : {}),
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
        allocateEventId: () => deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "InitializeDocument") {
      const processed = processInitializeDocument(run, {
        documentId: command.payload.documentId,
        ...(command.payload.definitionVersion !== undefined
          ? { definitionVersion: command.payload.definitionVersion }
          : {}),
        title: command.payload.title,
        body: command.payload.body,
        ...(command.payload.category !== undefined
          ? { category: command.payload.category }
          : {}),
        ...(command.payload.description !== undefined
          ? { description: command.payload.description }
          : {}),
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "InitializeNotification") {
      const processed = processInitializeNotification(run, {
        notificationId: command.payload.notificationId,
        title: command.payload.title,
        summary: command.payload.summary,
        ...(command.payload.body !== undefined
          ? { body: command.payload.body }
          : {}),
        sourceKind: command.payload.sourceKind,
        ...(command.payload.sourceId !== undefined
          ? { sourceId: command.payload.sourceId }
          : {}),
        ...(command.payload.sourceReason !== undefined
          ? { sourceReason: command.payload.sourceReason }
          : {}),
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "DeliverLearnerMessage") {
      const processed = processDeliverLearnerMessage(run, {
        messageDefinitionId: command.payload.messageDefinitionId,
        ...(command.payload.definitionVersion !== undefined
          ? { definitionVersion: command.payload.definitionVersion }
          : {}),
        ...(command.payload.senderId !== undefined
          ? { senderId: command.payload.senderId }
          : {}),
        senderDisplayName: command.payload.senderDisplayName,
        ...(command.payload.senderRoleLabel !== undefined
          ? { senderRoleLabel: command.payload.senderRoleLabel }
          : {}),
        subject: command.payload.subject,
        body: command.payload.body,
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "CompleteChapter") {
      const processed = processCompleteChapter(run, {
        chapterId: command.payload.chapterId,
        ...(command.payload.nextChapterId !== undefined
          ? { nextChapterId: command.payload.nextChapterId }
          : {}),
        requiredDecisionIds: command.payload.requiredDecisionIds,
        requiredActivityIds: command.payload.requiredActivityIds,
        requiredMeetingIds: command.payload.requiredMeetingIds,
        ...(command.payload.endingNotification !== undefined
          ? { endingNotification: command.payload.endingNotification }
          : {}),
        ...(command.payload.crises !== undefined
          ? { crises: command.payload.crises }
          : {}),
        ...(command.payload.completionWhen !== undefined
          ? { completionWhen: command.payload.completionWhen }
          : {}),
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "ScheduleMeeting") {
      const processed = processScheduleMeeting(run, {
        meetingId: command.payload.meetingId,
        title: command.payload.title,
        scheduledFor: command.payload.scheduledFor,
        participantIds: command.payload.participantIds,
        ...(command.payload.agenda !== undefined
          ? { agenda: command.payload.agenda }
          : {}),
        ...(command.payload.definitionVersion !== undefined
          ? { definitionVersion: command.payload.definitionVersion }
          : {}),
        ...(command.payload.durationMinutes !== undefined
          ? { durationMinutes: command.payload.durationMinutes }
          : {}),
        ...(command.payload.channel !== undefined
          ? { channel: command.payload.channel }
          : {}),
        ...(command.payload.location !== undefined
          ? { location: command.payload.location }
          : {}),
        ...(command.payload.participantDisplayNames !== undefined
          ? {
              participantDisplayNames: command.payload.participantDisplayNames,
            }
          : {}),
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "InitializeActivity") {
      const processed = processInitializeActivity(run, {
        activityId: command.payload.activityId,
        title: command.payload.title,
        summary: command.payload.summary,
        ...(command.payload.body !== undefined
          ? { body: command.payload.body }
          : {}),
        sourceKind: command.payload.sourceKind,
        ...(command.payload.sourceId !== undefined
          ? { sourceId: command.payload.sourceId }
          : {}),
        ...(command.payload.sourceReason !== undefined
          ? { sourceReason: command.payload.sourceReason }
          : {}),
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else if (command.commandType === "CompleteActivity") {
      const processed = processCompleteActivity(run, {
        activityId: command.payload.activityId,
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAcceptedComplete = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAcceptedComplete, ...processed.value.events];
    } else if (
      command.commandType === "MakeMeetingAvailable" ||
      command.commandType === "StartMeeting" ||
      command.commandType === "CompleteMeeting" ||
      command.commandType === "CancelMeeting"
    ) {
      const lifecycleCommand: MeetingLifecycleCommand = command.commandType;
      const processed = processMeetingLifecycle(run, {
        meetingId: command.payload.meetingId,
        command: lifecycleCommand,
        commandId: command.commandId,
        occurredAt: command.occurredAt,
        recordedAt: now,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        eventId: deps.identifiers.nextEventId(),
      });
      if (!processed.ok) {
        return rejected(command, processed.error);
      }
      nextRun = processed.value.run;
      const actionAccepted = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [actionAccepted, ...processed.value.events];
    } else {
      const advanced = recordAcceptedLearnerAction(run, now);
      if (!advanced.ok) {
        return rejected(command, advanced.error);
      }
      nextRun = advanced.value;
      const event = createSimulationActionAcceptedEvent({
        eventId: deps.identifiers.nextEventId(),
        occurredAt: command.occurredAt,
        recordedAt: now,
        aggregateVersion: nextRun.aggregateVersion,
        sequenceNumber: nextRun.lastProcessedSequence,
        actorId: command.actorId,
        correlationId: command.correlationId,
        causationId: command.causationId,
        tenantId: deps.tenantId,
        simulationRunId: command.simulationRunId,
        actionType: command.commandType,
        commandId: command.commandId,
        actionRecordId,
      });
      emittedEvents = [event];
    }

    const saved = await deps.runRepository.save(
      deps.tenantId,
      nextRun,
      run.aggregateVersion,
      emittedEvents,
    );
    if (!saved.ok) {
      return rejected(command, saved.error);
    }

    const result: CommandResult = {
      status: "accepted",
      commandId: command.commandId,
      simulationRunId: command.simulationRunId,
      correlationId: command.correlationId,
      aggregateVersion: nextRun.aggregateVersion,
      emittedEvents,
      emittedEventIds: emittedEvents.map((event) => event.eventId),
    };
    await deps.idempotencyStore.remember(command.commandId, result);
    return result;
  },
});
