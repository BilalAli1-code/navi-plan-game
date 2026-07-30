import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import type { EventId } from "../shared-kernel/ids";
import { err, ok, type Result } from "../shared-kernel/result";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { MeetingOccurrence } from "../simulation/run/meeting";
import type { ProjectionSafeContent } from "./content";
import { computeSemanticHashFromStableValue } from "./hash";
import { asSimulationProjectionId, deriveProjectionId } from "./ids";
import {
  MEETINGS_PROJECTION_SCHEMA_VERSION,
  MEETINGS_PROJECTION_TYPE,
  type MeetingsCapabilities,
  type MeetingsItem,
  type MeetingsProjection,
  type MeetingsSummary,
} from "./meetings-contracts";
import type { SimulationRunReadSnapshot } from "./read-snapshot";

export interface BuildMeetingsProjectionInput {
  readonly snapshot: SimulationRunReadSnapshot;
  /** Optional projection-safe meeting metadata for relatedDecisionIds. */
  readonly projectionContent?: ProjectionSafeContent;
  readonly generatedAt: IsoTimestamp;
  readonly sourceEvent?: {
    readonly eventId: EventId;
    readonly eventType: string;
  };
}

const UNSUPPORTED_CAPABILITIES: MeetingsCapabilities = {
  start: "unsupported",
  complete: "unsupported",
  cancel: "unsupported",
  reschedule: "unsupported",
};

const isUpcomingStatus = (status: MeetingOccurrence["status"]): boolean =>
  status === "scheduled" || status === "available";

const toMeetingsItem = (
  occurrence: MeetingOccurrence,
  relatedDecisionIds: readonly string[],
): MeetingsItem => ({
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
  relatedDecisionIds: [...relatedDecisionIds].sort((a, b) =>
    a.localeCompare(b),
  ),
});

const summarize = (meetings: readonly MeetingsItem[]): MeetingsSummary => {
  let upcomingCount = 0;
  let activeCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  for (const meeting of meetings) {
    if (meeting.status === "scheduled" || meeting.status === "available") {
      upcomingCount += 1;
    } else if (meeting.status === "started") {
      activeCount += 1;
    } else if (meeting.status === "completed") {
      completedCount += 1;
    } else if (meeting.status === "cancelled") {
      cancelledCount += 1;
    }
  }
  return {
    totalMeetings: meetings.length,
    upcomingCount,
    activeCount,
    completedCount,
    cancelledCount,
    isEmpty: meetings.length === 0,
  };
};

/**
 * Pure Meetings projection builder (PS-ROADMAP-017).
 *
 * Deterministic, side-effect-free, learner-safe. No I/O, clock, AI, repository
 * access, aggregate mutation, or browser lifecycle inference.
 *
 * Source of truth: authoritative SimulationRun snapshot `meetings`.
 * Ordering: scheduleSequence ascending; stable tie-break by occurrence ID.
 */
export const buildMeetingsProjection = (
  input: BuildMeetingsProjectionInput,
): Result<MeetingsProjection, RuleViolationError> => {
  const { snapshot, generatedAt, projectionContent } = input;
  const occurrences = snapshot.meetings;

  if (
    projectionContent &&
    projectionContent.contentPackageVersionId !==
      snapshot.contentPackageVersionId
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_CONTENT_VERSION_MISMATCH",
        "Projection content version does not match the run contentPackageVersionId.",
      ),
    );
  }

  const relatedByDefinitionId = new Map<string, readonly string[]>();
  for (const meeting of projectionContent?.meetings ?? []) {
    relatedByDefinitionId.set(meeting.id, meeting.relatedDecisionIds);
  }

  const seenIds = new Set<string>();
  for (const occurrence of occurrences) {
    if (seenIds.has(occurrence.meetingOccurrenceId)) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Meetings source contains duplicate occurrence IDs.",
          { meetingOccurrenceId: occurrence.meetingOccurrenceId },
        ),
      );
    }
    seenIds.add(occurrence.meetingOccurrenceId);
  }

  const ordered = [...occurrences].sort((a, b) => {
    if (a.scheduleSequence !== b.scheduleSequence) {
      return a.scheduleSequence - b.scheduleSequence;
    }
    return a.meetingOccurrenceId.localeCompare(b.meetingOccurrenceId);
  });

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]!;
    const current = ordered[index]!;
    if (current.scheduleSequence <= previous.scheduleSequence) {
      return err(
        ruleViolationError(
          "PROJECTION_PAYLOAD_INVALID",
          "Meeting scheduleSequence values must be unique and strictly increasing.",
        ),
      );
    }
  }

  const meetings = ordered.map((occurrence) =>
    toMeetingsItem(
      occurrence,
      relatedByDefinitionId.get(occurrence.meetingDefinitionId) ?? [],
    ),
  );

  const withoutHash = {
    projectionId: asSimulationProjectionId(
      deriveProjectionId({
        projectionType: MEETINGS_PROJECTION_TYPE,
        tenantId: snapshot.tenantId,
        simulationRunId: snapshot.simulationRunId,
      }),
    ),
    projectionType: MEETINGS_PROJECTION_TYPE,
    projectionSchemaVersion: MEETINGS_PROJECTION_SCHEMA_VERSION,
    tenantId: snapshot.tenantId,
    simulationRunId: snapshot.simulationRunId,
    learnerId: snapshot.learnerId,
    contentPackageVersionId: snapshot.contentPackageVersionId,
    sourceAggregateVersion: snapshot.aggregateVersion,
    sourceStateVersion: snapshot.stateVersion,
    sourceActionSequence: snapshot.lastProcessedSequence,
    sourceEventId: input.sourceEvent?.eventId ?? null,
    generatedAt,
    meetings,
    summary: summarize(meetings),
    capabilities: UNSUPPORTED_CAPABILITIES,
  };

  return ok({
    ...withoutHash,
    semanticHash: computeMeetingsSemanticHash(withoutHash),
  });
};

/** Count upcoming meetings for Mission Control (scheduled + available). */
export const countUpcomingMeetings = (
  occurrences: readonly MeetingOccurrence[],
): number =>
  occurrences.reduce(
    (count, occurrence) =>
      isUpcomingStatus(occurrence.status) ? count + 1 : count,
    0,
  );

export type SemanticMeetingsInput = Omit<
  MeetingsProjection,
  "semanticHash" | "generatedAt" | "sourceEventId"
>;

export const semanticMeetingsPayload = (
  projection: SemanticMeetingsInput,
): Readonly<Record<string, unknown>> => ({
  projectionId: projection.projectionId,
  projectionType: projection.projectionType,
  projectionSchemaVersion: projection.projectionSchemaVersion,
  tenantId: projection.tenantId,
  simulationRunId: projection.simulationRunId,
  learnerId: projection.learnerId,
  contentPackageVersionId: projection.contentPackageVersionId,
  sourceAggregateVersion: projection.sourceAggregateVersion,
  sourceStateVersion: projection.sourceStateVersion,
  sourceActionSequence: projection.sourceActionSequence,
  meetings: projection.meetings,
  summary: projection.summary,
  capabilities: projection.capabilities,
});

export const computeMeetingsSemanticHash = (
  projection: SemanticMeetingsInput,
) => computeSemanticHashFromStableValue(semanticMeetingsPayload(projection));
