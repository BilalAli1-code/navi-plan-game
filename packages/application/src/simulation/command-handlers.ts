import {
  collectFieldErrors,
  requireNonEmpty,
  requireNonEmptyArray,
  requirePositive,
  type SimulationCommandHandler,
  type SimulationCommandHandlerRegistry,
} from "./command-handler";

export const submitDecisionHandler: SimulationCommandHandler<"SubmitDecision"> =
  {
    commandType: "SubmitDecision",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.decisionId, "payload.decisionId"),
        requireNonEmpty(command.payload.optionId, "payload.optionId"),
      ),
  };

export const completeActivityHandler: SimulationCommandHandler<"CompleteActivity"> =
  {
    commandType: "CompleteActivity",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.activityId, "payload.activityId"),
      ),
  };

export const initializeStakeholderHandler: SimulationCommandHandler<"InitializeStakeholder"> =
  {
    commandType: "InitializeStakeholder",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.stakeholderId, "payload.stakeholderId"),
        requireNonEmpty(command.payload.displayName, "payload.displayName"),
      ),
  };

export const sendStakeholderMessageHandler: SimulationCommandHandler<"SendStakeholderMessage"> =
  {
    commandType: "SendStakeholderMessage",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.recipientId, "payload.recipientId"),
        requireNonEmpty(command.payload.body, "payload.body"),
      ),
  };

export const initializeDocumentHandler: SimulationCommandHandler<"InitializeDocument"> =
  {
    commandType: "InitializeDocument",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.documentId, "payload.documentId"),
        requireNonEmpty(command.payload.title, "payload.title"),
        requireNonEmpty(command.payload.body, "payload.body"),
      ),
  };

export const initializeNotificationHandler: SimulationCommandHandler<"InitializeNotification"> =
  {
    commandType: "InitializeNotification",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(
          command.payload.notificationId,
          "payload.notificationId",
        ),
        requireNonEmpty(command.payload.title, "payload.title"),
        requireNonEmpty(command.payload.summary, "payload.summary"),
        requireNonEmpty(command.payload.sourceKind, "payload.sourceKind"),
      ),
  };

export const deliverLearnerMessageHandler: SimulationCommandHandler<"DeliverLearnerMessage"> =
  {
    commandType: "DeliverLearnerMessage",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(
          command.payload.messageDefinitionId,
          "payload.messageDefinitionId",
        ),
        requireNonEmpty(
          command.payload.senderDisplayName,
          "payload.senderDisplayName",
        ),
        requireNonEmpty(command.payload.subject, "payload.subject"),
        requireNonEmpty(command.payload.body, "payload.body"),
      ),
  };

export const completeChapterHandler: SimulationCommandHandler<"CompleteChapter"> =
  {
    commandType: "CompleteChapter",
    validate: (command) => {
      const ending = command.payload.endingNotification;
      return collectFieldErrors(
        requireNonEmpty(command.payload.chapterId, "payload.chapterId"),
        ...(ending
          ? [
              requireNonEmpty(
                ending.notificationId,
                "payload.endingNotification.notificationId",
              ),
              requireNonEmpty(ending.title, "payload.endingNotification.title"),
              requireNonEmpty(
                ending.summary,
                "payload.endingNotification.summary",
              ),
            ]
          : []),
      );
    },
  };

export const initializeActivityHandler: SimulationCommandHandler<"InitializeActivity"> =
  {
    commandType: "InitializeActivity",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.activityId, "payload.activityId"),
        requireNonEmpty(command.payload.title, "payload.title"),
        requireNonEmpty(command.payload.summary, "payload.summary"),
        requireNonEmpty(command.payload.sourceKind, "payload.sourceKind"),
      ),
  };

export const scheduleMeetingHandler: SimulationCommandHandler<"ScheduleMeeting"> =
  {
    commandType: "ScheduleMeeting",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.meetingId, "payload.meetingId"),
        requireNonEmpty(command.payload.title, "payload.title"),
        requireNonEmpty(command.payload.scheduledFor, "payload.scheduledFor"),
        requireNonEmptyArray(
          command.payload.participantIds,
          "payload.participantIds",
        ),
      ),
  };

export const makeMeetingAvailableHandler: SimulationCommandHandler<"MakeMeetingAvailable"> =
  {
    commandType: "MakeMeetingAvailable",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.meetingId, "payload.meetingId"),
      ),
  };

export const startMeetingHandler: SimulationCommandHandler<"StartMeeting"> = {
  commandType: "StartMeeting",
  validate: (command) =>
    collectFieldErrors(
      requireNonEmpty(command.payload.meetingId, "payload.meetingId"),
    ),
};

export const completeMeetingHandler: SimulationCommandHandler<"CompleteMeeting"> =
  {
    commandType: "CompleteMeeting",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.meetingId, "payload.meetingId"),
      ),
  };

export const cancelMeetingHandler: SimulationCommandHandler<"CancelMeeting"> = {
  commandType: "CancelMeeting",
  validate: (command) =>
    collectFieldErrors(
      requireNonEmpty(command.payload.meetingId, "payload.meetingId"),
    ),
};

export const uploadArtifactHandler: SimulationCommandHandler<"UploadArtifact"> =
  {
    commandType: "UploadArtifact",
    validate: (command) =>
      collectFieldErrors(
        requireNonEmpty(command.payload.artifactId, "payload.artifactId"),
        requireNonEmpty(command.payload.fileName, "payload.fileName"),
        requireNonEmpty(command.payload.contentType, "payload.contentType"),
        requirePositive(command.payload.byteSize, "payload.byteSize"),
      ),
  };

/**
 * The canonical handler registry — exactly one handler per command type. The
 * mapped-type annotation makes omitting or misnaming a handler a compile-time
 * error, so new command types cannot be added without a corresponding handler.
 */
export const simulationCommandHandlers: SimulationCommandHandlerRegistry = {
  SubmitDecision: submitDecisionHandler,
  InitializeActivity: initializeActivityHandler,
  CompleteActivity: completeActivityHandler,
  InitializeStakeholder: initializeStakeholderHandler,
  SendStakeholderMessage: sendStakeholderMessageHandler,
  ScheduleMeeting: scheduleMeetingHandler,
  MakeMeetingAvailable: makeMeetingAvailableHandler,
  StartMeeting: startMeetingHandler,
  CompleteMeeting: completeMeetingHandler,
  CancelMeeting: cancelMeetingHandler,
  InitializeDocument: initializeDocumentHandler,
  InitializeNotification: initializeNotificationHandler,
  DeliverLearnerMessage: deliverLearnerMessageHandler,
  CompleteChapter: completeChapterHandler,
  UploadArtifact: uploadArtifactHandler,
};
