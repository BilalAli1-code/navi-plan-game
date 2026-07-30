import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type {
  ContentPackageVersionId,
  EventId,
  LearnerId,
  MeetingDefinitionId,
  MeetingOccurrenceId,
  SimulationRunId,
  StakeholderId,
  TenantId,
} from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import {
  isMeetingLifecycleStatus,
  type MeetingLifecycleStatus,
} from "../simulation/run/meeting";
import { PROJECTION_SEMANTIC_HASH_PATTERN } from "./hash";
import { asProjectionHash, asSimulationProjectionId } from "./ids";
import {
  MEETINGS_PROJECTION_SCHEMA_VERSION,
  MEETINGS_PROJECTION_TYPE,
  type MeetingsCapabilities,
  type MeetingsItem,
  type MeetingsProjection,
  type MeetingsSummary,
} from "./meetings-contracts";
import { assertProjectionSourcePosition } from "./source-position";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseCapabilities = (
  value: unknown,
): Result<MeetingsCapabilities, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    value.start !== "unsupported" ||
    value.complete !== "unsupported" ||
    value.cancel !== "unsupported" ||
    value.reschedule !== "unsupported"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Meetings capabilities must mark start/complete/cancel/reschedule as unsupported.",
      ),
    );
  }
  return ok({
    start: "unsupported",
    complete: "unsupported",
    cancel: "unsupported",
    reschedule: "unsupported",
  });
};

const parseOptionalTimestamp = (
  value: unknown,
  field: string,
): Result<IsoTimestamp | null, RuleViolationError> => {
  if (value === null || value === undefined) {
    return ok(null);
  }
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        `Meetings item ${field} must be a valid ISO timestamp or null.`,
      ),
    );
  }
  return ok(value as IsoTimestamp);
};

const parseMeetingItem = (
  value: unknown,
): Result<MeetingsItem, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.meetingOccurrenceId !== "string" ||
    value.meetingOccurrenceId.trim().length === 0 ||
    typeof value.meetingDefinitionId !== "string" ||
    value.meetingDefinitionId.trim().length === 0 ||
    typeof value.meetingDefinitionVersion !== "string" ||
    value.meetingDefinitionVersion.trim().length === 0 ||
    typeof value.scheduleSequence !== "number" ||
    !Number.isInteger(value.scheduleSequence) ||
    value.scheduleSequence < 1 ||
    typeof value.scheduledFor !== "string" ||
    Number.isNaN(Date.parse(value.scheduledFor)) ||
    (value.durationMinutes !== null &&
      (typeof value.durationMinutes !== "number" ||
        !Number.isInteger(value.durationMinutes) ||
        value.durationMinutes < 1)) ||
    typeof value.title !== "string" ||
    value.title.trim().length === 0 ||
    (value.agenda !== null && typeof value.agenda !== "string") ||
    !Array.isArray(value.participants) ||
    (value.channel !== null && typeof value.channel !== "string") ||
    (value.location !== null && typeof value.location !== "string") ||
    typeof value.status !== "string" ||
    !isMeetingLifecycleStatus(value.status) ||
    typeof value.scheduledAt !== "string" ||
    Number.isNaN(Date.parse(value.scheduledAt))
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Meetings item is invalid.",
      ),
    );
  }

  for (const forbidden of [
    "originatingCommandId",
    "causationId",
    "correlationId",
    "aggregateVersion",
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(value, forbidden)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          `Meetings item must not include hidden field '${forbidden}'.`,
        ),
      );
    }
  }

  const availableAt = parseOptionalTimestamp(value.availableAt, "availableAt");
  if (!availableAt.ok) {
    return availableAt;
  }
  const startedAt = parseOptionalTimestamp(value.startedAt, "startedAt");
  if (!startedAt.ok) {
    return startedAt;
  }
  const completedAt = parseOptionalTimestamp(value.completedAt, "completedAt");
  if (!completedAt.ok) {
    return completedAt;
  }
  const cancelledAt = parseOptionalTimestamp(value.cancelledAt, "cancelledAt");
  if (!cancelledAt.ok) {
    return cancelledAt;
  }

  const participants: Array<MeetingsItem["participants"][number]> = [];
  const seenParticipants = new Set<string>();
  for (const entry of value.participants) {
    if (
      !isPlainObject(entry) ||
      typeof entry.stakeholderId !== "string" ||
      entry.stakeholderId.trim().length === 0 ||
      typeof entry.displayName !== "string" ||
      entry.displayName.trim().length === 0
    ) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Meetings participant is invalid.",
        ),
      );
    }
    if (seenParticipants.has(entry.stakeholderId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Meetings participants must have unique stakeholderId values.",
        ),
      );
    }
    seenParticipants.add(entry.stakeholderId);
    participants.push({
      stakeholderId: entry.stakeholderId as StakeholderId,
      displayName: entry.displayName,
    });
  }
  if (participants.length === 0) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Meetings item must include at least one participant.",
      ),
    );
  }

  const relatedDecisionIdsRaw = Array.isArray(value.relatedDecisionIds)
    ? value.relatedDecisionIds
    : [];
  const relatedDecisionIds: string[] = [];
  for (const entry of relatedDecisionIdsRaw) {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Meetings relatedDecisionIds entries must be non-empty strings.",
        ),
      );
    }
    relatedDecisionIds.push(entry);
  }

  return ok({
    meetingOccurrenceId: value.meetingOccurrenceId as MeetingOccurrenceId,
    meetingDefinitionId: value.meetingDefinitionId as MeetingDefinitionId,
    meetingDefinitionVersion: value.meetingDefinitionVersion,
    scheduleSequence: value.scheduleSequence,
    scheduledFor: value.scheduledFor as IsoTimestamp,
    durationMinutes: value.durationMinutes as number | null,
    title: value.title,
    agenda: value.agenda as string | null,
    participants,
    channel: value.channel as string | null,
    location: value.location as string | null,
    status: value.status as MeetingLifecycleStatus,
    scheduledAt: value.scheduledAt as IsoTimestamp,
    availableAt: availableAt.value,
    startedAt: startedAt.value,
    completedAt: completedAt.value,
    cancelledAt: cancelledAt.value,
    relatedDecisionIds,
  });
};

const parseSummary = (
  value: unknown,
  meetingsLength: number,
): Result<MeetingsSummary, RuleViolationError> => {
  if (
    !isPlainObject(value) ||
    typeof value.totalMeetings !== "number" ||
    !Number.isInteger(value.totalMeetings) ||
    value.totalMeetings < 0 ||
    typeof value.upcomingCount !== "number" ||
    !Number.isInteger(value.upcomingCount) ||
    value.upcomingCount < 0 ||
    typeof value.activeCount !== "number" ||
    !Number.isInteger(value.activeCount) ||
    value.activeCount < 0 ||
    typeof value.completedCount !== "number" ||
    !Number.isInteger(value.completedCount) ||
    value.completedCount < 0 ||
    typeof value.cancelledCount !== "number" ||
    !Number.isInteger(value.cancelledCount) ||
    value.cancelledCount < 0 ||
    typeof value.isEmpty !== "boolean"
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Meetings summary is invalid.",
      ),
    );
  }
  if (value.totalMeetings !== meetingsLength) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Meetings summary.totalMeetings must equal meetings length.",
      ),
    );
  }
  if (value.isEmpty !== (meetingsLength === 0)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Meetings summary.isEmpty must match empty meetings.",
      ),
    );
  }
  return ok({
    totalMeetings: value.totalMeetings,
    upcomingCount: value.upcomingCount,
    activeCount: value.activeCount,
    completedCount: value.completedCount,
    cancelledCount: value.cancelledCount,
    isEmpty: value.isEmpty,
  });
};

/**
 * Validate persisted Meetings JSON before returning it as a typed contract.
 */
export const parseMeetingsProjection = (
  value: unknown,
): Result<MeetingsProjection, RuleViolationError> => {
  if (!isPlainObject(value)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Projection payload must be an object.",
      ),
    );
  }
  if (value.projectionType !== MEETINGS_PROJECTION_TYPE) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Unsupported projection type.",
      ),
    );
  }
  if (value.projectionSchemaVersion !== MEETINGS_PROJECTION_SCHEMA_VERSION) {
    return err(
      ruleViolationError(
        "PROJECTION_SCHEMA_UNSUPPORTED",
        `Unsupported Meetings schema version '${String(value.projectionSchemaVersion)}'.`,
      ),
    );
  }
  if (
    typeof value.projectionId !== "string" ||
    typeof value.tenantId !== "string" ||
    typeof value.simulationRunId !== "string" ||
    typeof value.learnerId !== "string" ||
    typeof value.contentPackageVersionId !== "string" ||
    typeof value.sourceAggregateVersion !== "number" ||
    typeof value.sourceStateVersion !== "number" ||
    typeof value.sourceActionSequence !== "number" ||
    typeof value.generatedAt !== "string" ||
    typeof value.semanticHash !== "string" ||
    !Array.isArray(value.meetings)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Meetings payload fields are incomplete.",
      ),
    );
  }
  if (!PROJECTION_SEMANTIC_HASH_PATTERN.test(value.semanticHash)) {
    return err(
      ruleViolationError(
        "PROJECTION_PAYLOAD_INVALID",
        "Meetings semanticHash is invalid.",
      ),
    );
  }

  const position = assertProjectionSourcePosition({
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
  });
  if (!position.ok) {
    return position;
  }

  const capabilities = parseCapabilities(value.capabilities);
  if (!capabilities.ok) {
    return capabilities;
  }

  const meetings: MeetingsItem[] = [];
  const seenIds = new Set<string>();
  for (const raw of value.meetings) {
    const parsed = parseMeetingItem(raw);
    if (!parsed.ok) {
      return parsed;
    }
    if (seenIds.has(parsed.value.meetingOccurrenceId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Meetings items must have unique meetingOccurrenceId values.",
        ),
      );
    }
    seenIds.add(parsed.value.meetingOccurrenceId);
    meetings.push(parsed.value);
  }

  for (let index = 1; index < meetings.length; index += 1) {
    const previous = meetings[index - 1]!;
    const current = meetings[index]!;
    if (current.scheduleSequence < previous.scheduleSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Meetings must be ordered ascending by scheduleSequence.",
        ),
      );
    }
  }

  const summary = parseSummary(value.summary, meetings.length);
  if (!summary.ok) {
    return summary;
  }

  return ok({
    projectionId: asSimulationProjectionId(value.projectionId),
    projectionType: MEETINGS_PROJECTION_TYPE,
    projectionSchemaVersion: MEETINGS_PROJECTION_SCHEMA_VERSION,
    tenantId: value.tenantId as TenantId,
    simulationRunId: value.simulationRunId as SimulationRunId,
    learnerId: value.learnerId as LearnerId,
    contentPackageVersionId:
      value.contentPackageVersionId as ContentPackageVersionId,
    sourceAggregateVersion: value.sourceAggregateVersion,
    sourceStateVersion: value.sourceStateVersion,
    sourceActionSequence: value.sourceActionSequence,
    sourceEventId:
      value.sourceEventId === null || value.sourceEventId === undefined
        ? null
        : (value.sourceEventId as EventId),
    generatedAt: value.generatedAt as IsoTimestamp,
    semanticHash: asProjectionHash(value.semanticHash),
    meetings,
    summary: summary.value,
    capabilities: capabilities.value,
  });
};

export const serializeMeetingsProjection = (
  projection: MeetingsProjection,
): Readonly<Record<string, unknown>> =>
  JSON.parse(JSON.stringify(projection)) as Readonly<Record<string, unknown>>;
