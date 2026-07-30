import type {
  SimulationCommandEnvelope,
  SimulationCommandType,
} from "./envelope";
import type {
  CancelMeetingPayload,
  CompleteActivityPayload,
  CompleteChapterPayload,
  CompleteMeetingPayload,
  DeliverLearnerMessagePayload,
  InitializeActivityPayload,
  InitializeDocumentPayload,
  InitializeNotificationPayload,
  InitializeStakeholderPayload,
  MakeMeetingAvailablePayload,
  ScheduleMeetingPayload,
  SendStakeholderMessagePayload,
  StartMeetingPayload,
  SubmitDecisionPayload,
  UploadArtifactPayload,
} from "./payloads";

export type SubmitDecisionCommand = SimulationCommandEnvelope<
  "SubmitDecision",
  SubmitDecisionPayload
>;

export type InitializeActivityCommand = SimulationCommandEnvelope<
  "InitializeActivity",
  InitializeActivityPayload
>;

export type CompleteActivityCommand = SimulationCommandEnvelope<
  "CompleteActivity",
  CompleteActivityPayload
>;

export type InitializeStakeholderCommand = SimulationCommandEnvelope<
  "InitializeStakeholder",
  InitializeStakeholderPayload
>;

export type SendStakeholderMessageCommand = SimulationCommandEnvelope<
  "SendStakeholderMessage",
  SendStakeholderMessagePayload
>;

export type ScheduleMeetingCommand = SimulationCommandEnvelope<
  "ScheduleMeeting",
  ScheduleMeetingPayload
>;

export type MakeMeetingAvailableCommand = SimulationCommandEnvelope<
  "MakeMeetingAvailable",
  MakeMeetingAvailablePayload
>;

export type StartMeetingCommand = SimulationCommandEnvelope<
  "StartMeeting",
  StartMeetingPayload
>;

export type CompleteMeetingCommand = SimulationCommandEnvelope<
  "CompleteMeeting",
  CompleteMeetingPayload
>;

export type CancelMeetingCommand = SimulationCommandEnvelope<
  "CancelMeeting",
  CancelMeetingPayload
>;

export type InitializeDocumentCommand = SimulationCommandEnvelope<
  "InitializeDocument",
  InitializeDocumentPayload
>;

export type InitializeNotificationCommand = SimulationCommandEnvelope<
  "InitializeNotification",
  InitializeNotificationPayload
>;

export type DeliverLearnerMessageCommand = SimulationCommandEnvelope<
  "DeliverLearnerMessage",
  DeliverLearnerMessagePayload
>;

export type CompleteChapterCommand = SimulationCommandEnvelope<
  "CompleteChapter",
  CompleteChapterPayload
>;

export type UploadArtifactCommand = SimulationCommandEnvelope<
  "UploadArtifact",
  UploadArtifactPayload
>;

/**
 * Discriminated union of every simulation command, keyed on `commandType`.
 * Narrowing on `commandType` yields the correctly typed payload.
 */
export type SimulationCommand =
  | SubmitDecisionCommand
  | InitializeActivityCommand
  | CompleteActivityCommand
  | InitializeStakeholderCommand
  | SendStakeholderMessageCommand
  | ScheduleMeetingCommand
  | MakeMeetingAvailableCommand
  | StartMeetingCommand
  | CompleteMeetingCommand
  | CancelMeetingCommand
  | InitializeDocumentCommand
  | InitializeNotificationCommand
  | DeliverLearnerMessageCommand
  | CompleteChapterCommand
  | UploadArtifactCommand;

const SIMULATION_COMMAND_TYPES = [
  "SubmitDecision",
  "InitializeActivity",
  "CompleteActivity",
  "InitializeStakeholder",
  "SendStakeholderMessage",
  "ScheduleMeeting",
  "MakeMeetingAvailable",
  "StartMeeting",
  "CompleteMeeting",
  "CancelMeeting",
  "InitializeDocument",
  "InitializeNotification",
  "DeliverLearnerMessage",
  "CompleteChapter",
  "UploadArtifact",
] as const satisfies readonly SimulationCommandType[];

/**
 * All known command/action types as a readonly runtime tuple — the single
 * source of truth for the closed action-type set. Future application, API, and
 * UI layers should consume this registry (and the `SimulationActionType` type)
 * rather than redefining their own enums or literals.
 */
export const simulationCommandTypes: readonly SimulationCommandType[] =
  SIMULATION_COMMAND_TYPES;

/** Runtime type guard for an unknown string being a known command type. */
export const isSimulationCommandType = (
  value: string,
): value is SimulationCommandType =>
  (SIMULATION_COMMAND_TYPES as readonly string[]).includes(value);
