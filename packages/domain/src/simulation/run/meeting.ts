import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  CommandId,
  MeetingDefinitionId,
  MeetingOccurrenceId,
  StakeholderId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import { asIsoTimestamp, type IsoTimestamp } from "../../shared-kernel/time";

/**
 * Authoritative Meeting occurrence owned by SimulationRun (PS-ROADMAP-016).
 *
 * Runtime fact distinct from content Meeting Definition. Not a Meetings
 * projection row (PS-017).
 */

export const MEETING_TITLE_MAX_LENGTH = 200;
export const MEETING_AGENDA_MAX_LENGTH = 4000;
export const MEETING_DEFINITION_VERSION_MAX_LENGTH = 64;
export const MEETING_PARTICIPANT_DISPLAY_NAME_MAX_LENGTH = 120;
export const MEETING_CHANNEL_MAX_LENGTH = 120;
export const MEETING_LOCATION_MAX_LENGTH = 200;

export const meetingLifecycleStatuses = [
  "scheduled",
  "available",
  "started",
  "completed",
  "cancelled",
] as const;

export type MeetingLifecycleStatus = (typeof meetingLifecycleStatuses)[number];

export const isMeetingLifecycleStatus = (
  value: string,
): value is MeetingLifecycleStatus =>
  (meetingLifecycleStatuses as readonly string[]).includes(value);

export const meetingTerminalStatuses = ["completed", "cancelled"] as const;

export type MeetingTerminalStatus = (typeof meetingTerminalStatuses)[number];

export const isMeetingTerminalStatus = (
  status: MeetingLifecycleStatus,
): status is MeetingTerminalStatus =>
  (meetingTerminalStatuses as readonly MeetingLifecycleStatus[]).includes(
    status,
  );

export interface MeetingParticipantSnapshot {
  readonly stakeholderId: StakeholderId;
  readonly displayName: string;
}

export interface MeetingOccurrence {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly meetingDefinitionVersion: string;
  /** 1-based monotonic schedule order within the run (canonical ordering). */
  readonly scheduleSequence: number;
  readonly scheduledFor: IsoTimestamp;
  readonly durationMinutes: number | null;
  readonly title: string;
  readonly agenda: string | null;
  readonly participants: readonly MeetingParticipantSnapshot[];
  readonly channel: string | null;
  readonly location: string | null;
  readonly status: MeetingLifecycleStatus;
  readonly scheduledAt: IsoTimestamp;
  readonly availableAt: IsoTimestamp | null;
  readonly startedAt: IsoTimestamp | null;
  readonly completedAt: IsoTimestamp | null;
  readonly cancelledAt: IsoTimestamp | null;
  readonly originatingCommandId: CommandId;
}

export interface CreateMeetingOccurrenceInput {
  readonly meetingOccurrenceId: MeetingOccurrenceId;
  readonly meetingDefinitionId: MeetingDefinitionId;
  readonly meetingDefinitionVersion: string;
  readonly scheduleSequence: number;
  readonly scheduledFor: IsoTimestamp;
  readonly durationMinutes: number | null;
  readonly title: string;
  readonly agenda: string | null;
  readonly participants: readonly MeetingParticipantSnapshot[];
  readonly channel: string | null;
  readonly location: string | null;
  readonly scheduledAt: IsoTimestamp;
  readonly originatingCommandId: CommandId;
}

const requireBoundedNonEmpty = (
  value: string,
  field: string,
  maxLength: number,
): Result<string, RuleViolationError> => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        `Meeting.${field} must be a non-empty string.`,
        { field },
      ),
    );
  }
  if (trimmed.length > maxLength) {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        `Meeting.${field} exceeds maximum length ${maxLength}.`,
        { field, maxLength, length: trimmed.length },
      ),
    );
  }
  if (/[<>]/.test(trimmed)) {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        `Meeting.${field} must not contain markup characters.`,
        { field },
      ),
    );
  }
  return ok(trimmed);
};

const requireOptionalBoundedText = (
  value: string | null | undefined,
  field: string,
  maxLength: number,
): Result<string | null, RuleViolationError> => {
  if (value === null || value === undefined) {
    return ok(null);
  }
  if (typeof value !== "string") {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        `Meeting.${field} must be a string or null.`,
        { field },
      ),
    );
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return ok(null);
  }
  return requireBoundedNonEmpty(trimmed, field, maxLength);
};

const validateParticipants = (
  participants: readonly MeetingParticipantSnapshot[],
): Result<readonly MeetingParticipantSnapshot[], RuleViolationError> => {
  if (participants.length === 0) {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.participants must contain at least one participant.",
      ),
    );
  }
  const seen = new Set<string>();
  const normalized: MeetingParticipantSnapshot[] = [];
  for (const participant of participants) {
    if (
      typeof participant.stakeholderId !== "string" ||
      participant.stakeholderId.trim().length === 0
    ) {
      return err(
        ruleViolationError(
          "MEETING_CONTENT_INVALID",
          "Meeting.participants[].stakeholderId must be a non-empty string.",
        ),
      );
    }
    const stakeholderId = participant.stakeholderId.trim() as StakeholderId;
    if (seen.has(stakeholderId)) {
      return err(
        ruleViolationError(
          "MEETING_CONTENT_INVALID",
          "Meeting.participants must not contain duplicate stakeholderIds.",
          { stakeholderId },
        ),
      );
    }
    seen.add(stakeholderId);
    const displayName = requireBoundedNonEmpty(
      participant.displayName,
      "participants.displayName",
      MEETING_PARTICIPANT_DISPLAY_NAME_MAX_LENGTH,
    );
    if (!displayName.ok) {
      return displayName;
    }
    normalized.push({
      stakeholderId,
      displayName: displayName.value,
    });
  }
  return ok(normalized);
};

/** Semantic equality for occurrence-level idempotency / conflict detection. */
export const meetingOccurrenceSemanticEqual = (
  left: Pick<
    MeetingOccurrence,
    | "meetingDefinitionId"
    | "meetingDefinitionVersion"
    | "scheduledFor"
    | "durationMinutes"
    | "title"
    | "agenda"
    | "participants"
    | "channel"
    | "location"
  >,
  right: Pick<
    MeetingOccurrence,
    | "meetingDefinitionId"
    | "meetingDefinitionVersion"
    | "scheduledFor"
    | "durationMinutes"
    | "title"
    | "agenda"
    | "participants"
    | "channel"
    | "location"
  >,
): boolean => {
  if (
    left.meetingDefinitionId !== right.meetingDefinitionId ||
    left.meetingDefinitionVersion !== right.meetingDefinitionVersion ||
    left.scheduledFor !== right.scheduledFor ||
    left.durationMinutes !== right.durationMinutes ||
    left.title !== right.title ||
    left.agenda !== right.agenda ||
    left.channel !== right.channel ||
    left.location !== right.location ||
    left.participants.length !== right.participants.length
  ) {
    return false;
  }
  return left.participants.every(
    (participant, index) =>
      participant.stakeholderId === right.participants[index]?.stakeholderId &&
      participant.displayName === right.participants[index]?.displayName,
  );
};

export const createMeetingOccurrence = (
  input: CreateMeetingOccurrenceInput,
): Result<MeetingOccurrence, RuleViolationError> => {
  if (input.meetingOccurrenceId.trim().length === 0) {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Meeting.meetingOccurrenceId must be non-empty.",
      ),
    );
  }
  if (input.meetingDefinitionId.trim().length === 0) {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.meetingDefinitionId must be non-empty.",
      ),
    );
  }
  const definitionVersion = requireBoundedNonEmpty(
    input.meetingDefinitionVersion,
    "meetingDefinitionVersion",
    MEETING_DEFINITION_VERSION_MAX_LENGTH,
  );
  if (!definitionVersion.ok) {
    return definitionVersion;
  }
  if (!Number.isInteger(input.scheduleSequence) || input.scheduleSequence < 1) {
    return err(
      ruleViolationError(
        "MEETING_SEQUENCE_INVALID",
        "Meeting.scheduleSequence must be a positive integer.",
        { scheduleSequence: input.scheduleSequence },
      ),
    );
  }
  if (Number.isNaN(Date.parse(input.scheduledFor))) {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.scheduledFor must be a valid ISO timestamp.",
      ),
    );
  }
  if (Number.isNaN(Date.parse(input.scheduledAt))) {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Meeting.scheduledAt must be a valid ISO timestamp.",
      ),
    );
  }
  if (input.durationMinutes !== null) {
    if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1) {
      return err(
        ruleViolationError(
          "MEETING_CONTENT_INVALID",
          "Meeting.durationMinutes must be a positive integer or null.",
          { durationMinutes: input.durationMinutes },
        ),
      );
    }
  }
  if (input.originatingCommandId.trim().length === 0) {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Meeting.originatingCommandId must be non-empty.",
      ),
    );
  }

  const title = requireBoundedNonEmpty(
    input.title,
    "title",
    MEETING_TITLE_MAX_LENGTH,
  );
  if (!title.ok) {
    return title;
  }
  const agenda = requireOptionalBoundedText(
    input.agenda,
    "agenda",
    MEETING_AGENDA_MAX_LENGTH,
  );
  if (!agenda.ok) {
    return agenda;
  }
  const channel = requireOptionalBoundedText(
    input.channel,
    "channel",
    MEETING_CHANNEL_MAX_LENGTH,
  );
  if (!channel.ok) {
    return channel;
  }
  const location = requireOptionalBoundedText(
    input.location,
    "location",
    MEETING_LOCATION_MAX_LENGTH,
  );
  if (!location.ok) {
    return location;
  }
  const participants = validateParticipants(input.participants);
  if (!participants.ok) {
    return participants;
  }

  return ok({
    meetingOccurrenceId: input.meetingOccurrenceId,
    meetingDefinitionId: input.meetingDefinitionId,
    meetingDefinitionVersion: definitionVersion.value,
    scheduleSequence: input.scheduleSequence,
    scheduledFor: input.scheduledFor,
    durationMinutes: input.durationMinutes,
    title: title.value,
    agenda: agenda.value,
    participants: participants.value,
    channel: channel.value,
    location: location.value,
    status: "scheduled",
    scheduledAt: input.scheduledAt,
    availableAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    originatingCommandId: input.originatingCommandId,
  });
};

export type MeetingLifecycleCommand =
  "MakeMeetingAvailable" | "StartMeeting" | "CompleteMeeting" | "CancelMeeting";

export const transitionMeetingOccurrence = (
  occurrence: MeetingOccurrence,
  command: MeetingLifecycleCommand,
  occurredAt: IsoTimestamp,
): Result<MeetingOccurrence, RuleViolationError> => {
  if (Number.isNaN(Date.parse(occurredAt))) {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Meeting lifecycle occurredAt must be a valid ISO timestamp.",
      ),
    );
  }

  switch (command) {
    case "MakeMeetingAvailable": {
      if (occurrence.status === "available") {
        return ok(occurrence);
      }
      if (occurrence.status !== "scheduled") {
        return err(
          ruleViolationError(
            "MEETING_TRANSITION_INVALID",
            `Cannot make meeting available from status '${occurrence.status}'.`,
            {
              meetingOccurrenceId: occurrence.meetingOccurrenceId,
              status: occurrence.status,
              command,
            },
          ),
        );
      }
      return ok({
        ...occurrence,
        status: "available",
        availableAt: occurredAt,
      });
    }
    case "StartMeeting": {
      if (occurrence.status === "started") {
        return ok(occurrence);
      }
      if (
        occurrence.status !== "scheduled" &&
        occurrence.status !== "available"
      ) {
        return err(
          ruleViolationError(
            "MEETING_TRANSITION_INVALID",
            `Cannot start meeting from status '${occurrence.status}'.`,
            {
              meetingOccurrenceId: occurrence.meetingOccurrenceId,
              status: occurrence.status,
              command,
            },
          ),
        );
      }
      return ok({
        ...occurrence,
        status: "started",
        startedAt: occurredAt,
        availableAt: occurrence.availableAt ?? occurredAt,
      });
    }
    case "CompleteMeeting": {
      if (occurrence.status === "completed") {
        return ok(occurrence);
      }
      if (occurrence.status !== "started") {
        return err(
          ruleViolationError(
            "MEETING_TRANSITION_INVALID",
            `Cannot complete meeting from status '${occurrence.status}'.`,
            {
              meetingOccurrenceId: occurrence.meetingOccurrenceId,
              status: occurrence.status,
              command,
            },
          ),
        );
      }
      return ok({
        ...occurrence,
        status: "completed",
        completedAt: occurredAt,
      });
    }
    case "CancelMeeting": {
      if (occurrence.status === "cancelled") {
        return ok(occurrence);
      }
      if (
        occurrence.status !== "scheduled" &&
        occurrence.status !== "available"
      ) {
        return err(
          ruleViolationError(
            "MEETING_TRANSITION_INVALID",
            `Cannot cancel meeting from status '${occurrence.status}'.`,
            {
              meetingOccurrenceId: occurrence.meetingOccurrenceId,
              status: occurrence.status,
              command,
            },
          ),
        );
      }
      return ok({
        ...occurrence,
        status: "cancelled",
        cancelledAt: occurredAt,
      });
    }
    default: {
      const _exhaustive: never = command;
      return err(
        ruleViolationError(
          "MEETING_TRANSITION_INVALID",
          `Unsupported meeting lifecycle command '${String(_exhaustive)}'.`,
        ),
      );
    }
  }
};

export const serializeMeetingOccurrence = (
  occurrence: MeetingOccurrence,
): Readonly<Record<string, unknown>> => ({
  meetingOccurrenceId: occurrence.meetingOccurrenceId,
  meetingDefinitionId: occurrence.meetingDefinitionId,
  meetingDefinitionVersion: occurrence.meetingDefinitionVersion,
  scheduleSequence: occurrence.scheduleSequence,
  scheduledFor: occurrence.scheduledFor,
  durationMinutes: occurrence.durationMinutes,
  title: occurrence.title,
  agenda: occurrence.agenda,
  participants: occurrence.participants.map((participant) => ({
    stakeholderId: participant.stakeholderId,
    displayName: participant.displayName,
  })),
  channel: occurrence.channel,
  location: occurrence.location,
  status: occurrence.status,
  scheduledAt: occurrence.scheduledAt,
  availableAt: occurrence.availableAt,
  startedAt: occurrence.startedAt,
  completedAt: occurrence.completedAt,
  cancelledAt: occurrence.cancelledAt,
  originatingCommandId: occurrence.originatingCommandId,
});

export const rehydrateMeetingOccurrence = (
  value: unknown,
): Result<MeetingOccurrence, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Persisted MeetingOccurrence must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (typeof record.meetingOccurrenceId !== "string") {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Meeting.meetingOccurrenceId is required.",
      ),
    );
  }
  if (typeof record.meetingDefinitionId !== "string") {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.meetingDefinitionId is required.",
      ),
    );
  }
  if (typeof record.meetingDefinitionVersion !== "string") {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.meetingDefinitionVersion is required.",
      ),
    );
  }
  if (typeof record.scheduleSequence !== "number") {
    return err(
      ruleViolationError(
        "MEETING_SEQUENCE_INVALID",
        "Meeting.scheduleSequence is required.",
      ),
    );
  }
  if (typeof record.scheduledFor !== "string") {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.scheduledFor is required.",
      ),
    );
  }
  if (
    record.durationMinutes !== null &&
    typeof record.durationMinutes !== "number"
  ) {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.durationMinutes must be a number or null.",
      ),
    );
  }
  if (typeof record.title !== "string") {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.title is required.",
      ),
    );
  }
  if (record.agenda !== null && typeof record.agenda !== "string") {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.agenda must be a string or null.",
      ),
    );
  }
  if (!Array.isArray(record.participants)) {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.participants must be an array.",
      ),
    );
  }
  if (record.channel !== null && typeof record.channel !== "string") {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.channel must be a string or null.",
      ),
    );
  }
  if (record.location !== null && typeof record.location !== "string") {
    return err(
      ruleViolationError(
        "MEETING_CONTENT_INVALID",
        "Meeting.location must be a string or null.",
      ),
    );
  }
  if (
    typeof record.status !== "string" ||
    !isMeetingLifecycleStatus(record.status)
  ) {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Meeting.status is invalid.",
      ),
    );
  }
  if (typeof record.scheduledAt !== "string") {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Meeting.scheduledAt is required.",
      ),
    );
  }
  if (typeof record.originatingCommandId !== "string") {
    return err(
      ruleViolationError(
        "MEETING_OCCURRENCE_INVALID",
        "Meeting.originatingCommandId is required.",
      ),
    );
  }

  const optionalTimestamp = (
    value: unknown,
    field: string,
  ): Result<IsoTimestamp | null, RuleViolationError> => {
    if (value === null || value === undefined) {
      return ok(null);
    }
    if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
      return err(
        ruleViolationError(
          "MEETING_OCCURRENCE_INVALID",
          `Meeting.${field} must be a valid ISO timestamp or null.`,
          { field },
        ),
      );
    }
    return ok(asIsoTimestamp(value));
  };

  const availableAt = optionalTimestamp(record.availableAt, "availableAt");
  if (!availableAt.ok) {
    return availableAt;
  }
  const startedAt = optionalTimestamp(record.startedAt, "startedAt");
  if (!startedAt.ok) {
    return startedAt;
  }
  const completedAt = optionalTimestamp(record.completedAt, "completedAt");
  if (!completedAt.ok) {
    return completedAt;
  }
  const cancelledAt = optionalTimestamp(record.cancelledAt, "cancelledAt");
  if (!cancelledAt.ok) {
    return cancelledAt;
  }

  const participants: MeetingParticipantSnapshot[] = [];
  for (const entry of record.participants) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return err(
        ruleViolationError(
          "MEETING_CONTENT_INVALID",
          "Meeting.participants entries must be objects.",
        ),
      );
    }
    const participant = entry as Record<string, unknown>;
    if (
      typeof participant.stakeholderId !== "string" ||
      typeof participant.displayName !== "string"
    ) {
      return err(
        ruleViolationError(
          "MEETING_CONTENT_INVALID",
          "Meeting.participants require stakeholderId and displayName strings.",
        ),
      );
    }
    participants.push({
      stakeholderId: participant.stakeholderId as StakeholderId,
      displayName: participant.displayName,
    });
  }

  const created = createMeetingOccurrence({
    meetingOccurrenceId: record.meetingOccurrenceId as MeetingOccurrenceId,
    meetingDefinitionId: record.meetingDefinitionId as MeetingDefinitionId,
    meetingDefinitionVersion: record.meetingDefinitionVersion,
    scheduleSequence: record.scheduleSequence,
    scheduledFor: asIsoTimestamp(record.scheduledFor),
    durationMinutes:
      record.durationMinutes === null ? null : record.durationMinutes,
    title: record.title,
    agenda: record.agenda === null ? null : record.agenda,
    participants,
    channel: record.channel === null ? null : record.channel,
    location: record.location === null ? null : record.location,
    scheduledAt: asIsoTimestamp(record.scheduledAt),
    originatingCommandId: record.originatingCommandId as CommandId,
  });
  if (!created.ok) {
    return created;
  }

  // Rehydrate restores lifecycle timestamps/status after create (always scheduled).
  return ok({
    ...created.value,
    status: record.status,
    availableAt: availableAt.value,
    startedAt: startedAt.value,
    completedAt: completedAt.value,
    cancelledAt: cancelledAt.value,
  });
};
