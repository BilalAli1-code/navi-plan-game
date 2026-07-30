import { describe, expect, it } from "vitest";
import {
  asActorId,
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asMeetingDefinitionId,
  asMeetingId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  createInitialSimulationState,
  createMeetingOccurrence,
  deriveMeetingOccurrenceId,
  parseSimulationState,
  processMeetingLifecycle,
  processScheduleMeeting,
  serializeSimulationState,
  transitionMeetingOccurrence,
  type SimulationRun,
} from "../../index";

const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");
const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_meeting");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_meeting"),
  tenantId,
  learnerId: asLearnerId("learner_1"),
  businessCaseId: asBusinessCaseId("case_1"),
  contentPackageVersionId,
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 2,
  lastProcessedSequence: 0,
  currentChapterId: null,
  currentDayId: null,
  startedAt: now,
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  state: createInitialSimulationState(),
  ...overrides,
});

const scheduleInput = (meetingId: string, scheduledFor: string) => ({
  meetingId: asMeetingId(meetingId),
  title: `Title ${meetingId}`,
  scheduledFor: asIsoTimestamp(scheduledFor),
  participantIds: [asStakeholderId("stakeholder_a")],
  agenda: "Agenda item",
  definitionVersion: "1",
  durationMinutes: 30,
  channel: "Conference Room A",
  location: "HQ",
  participantDisplayNames: {
    stakeholder_a: "Alex Sponsor",
  },
  commandId: asCommandId(`cmd_${meetingId}`),
  occurredAt: now,
  recordedAt: now,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  eventId: asEventId(`evt_${meetingId}`),
});

describe("Meeting occurrence domain", () => {
  it("creates a scheduled occurrence with learner-safe snapshots", () => {
    const result = createMeetingOccurrence({
      meetingOccurrenceId: deriveMeetingOccurrenceId(asMeetingId("meeting_1")),
      meetingDefinitionId: asMeetingDefinitionId("meeting_1"),
      meetingDefinitionVersion: "1",
      scheduleSequence: 1,
      scheduledFor: asIsoTimestamp("2026-07-27T09:00:00.000Z"),
      durationMinutes: 45,
      title: "Kickoff",
      agenda: "Scope review",
      participants: [
        {
          stakeholderId: asStakeholderId("stakeholder_a"),
          displayName: "Alex Sponsor",
        },
      ],
      channel: "Zoom",
      location: null,
      scheduledAt: now,
      originatingCommandId: asCommandId("cmd_1"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.status).toBe("scheduled");
    expect(result.value.meetingOccurrenceId).toBe(
      "meeting_occurrence:meeting_1",
    );
  });

  it("rejects markup in learner-visible title", () => {
    const result = createMeetingOccurrence({
      meetingOccurrenceId: deriveMeetingOccurrenceId(asMeetingId("meeting_1")),
      meetingDefinitionId: asMeetingDefinitionId("meeting_1"),
      meetingDefinitionVersion: "1",
      scheduleSequence: 1,
      scheduledFor: asIsoTimestamp("2026-07-27T09:00:00.000Z"),
      durationMinutes: null,
      title: "<script>x</script>",
      agenda: null,
      participants: [
        {
          stakeholderId: asStakeholderId("stakeholder_a"),
          displayName: "Alex",
        },
      ],
      channel: null,
      location: null,
      scheduledAt: now,
      originatingCommandId: asCommandId("cmd_1"),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("MEETING_CONTENT_INVALID");
    }
  });

  it("enforces lifecycle transitions and terminal rules", () => {
    const created = createMeetingOccurrence({
      meetingOccurrenceId: deriveMeetingOccurrenceId(asMeetingId("meeting_1")),
      meetingDefinitionId: asMeetingDefinitionId("meeting_1"),
      meetingDefinitionVersion: "1",
      scheduleSequence: 1,
      scheduledFor: asIsoTimestamp("2026-07-27T09:00:00.000Z"),
      durationMinutes: null,
      title: "Kickoff",
      agenda: null,
      participants: [
        {
          stakeholderId: asStakeholderId("stakeholder_a"),
          displayName: "Alex",
        },
      ],
      channel: null,
      location: null,
      scheduledAt: now,
      originatingCommandId: asCommandId("cmd_1"),
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const available = transitionMeetingOccurrence(
      created.value,
      "MakeMeetingAvailable",
      now,
    );
    expect(available.ok).toBe(true);
    if (!available.ok) {
      return;
    }
    expect(available.value.status).toBe("available");

    const started = transitionMeetingOccurrence(
      available.value,
      "StartMeeting",
      now,
    );
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    expect(started.value.status).toBe("started");

    const completed = transitionMeetingOccurrence(
      started.value,
      "CompleteMeeting",
      now,
    );
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }
    expect(completed.value.status).toBe("completed");

    const cancelAfterComplete = transitionMeetingOccurrence(
      completed.value,
      "CancelMeeting",
      now,
    );
    expect(cancelAfterComplete.ok).toBe(false);
    if (!cancelAfterComplete.ok) {
      expect(cancelAfterComplete.error.code).toBe("MEETING_TRANSITION_INVALID");
    }

    const cancelFromScheduled = transitionMeetingOccurrence(
      created.value,
      "CancelMeeting",
      now,
    );
    expect(cancelFromScheduled.ok).toBe(true);
    if (cancelFromScheduled.ok) {
      expect(cancelFromScheduled.value.status).toBe("cancelled");
    }

    const completeBeforeStart = transitionMeetingOccurrence(
      created.value,
      "CompleteMeeting",
      now,
    );
    expect(completeBeforeStart.ok).toBe(false);
  });
});

describe("processScheduleMeeting / processMeetingLifecycle", () => {
  it("schedules with stable identity and deterministic scheduleSequence", () => {
    const run = activeRun();
    const first = processScheduleMeeting(
      run,
      scheduleInput("meeting_a", "2026-07-27T09:00:00.000Z"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.value.occurrence.meetingOccurrenceId).toBe(
      "meeting_occurrence:meeting_a",
    );
    expect(first.value.occurrence.scheduleSequence).toBe(1);
    expect(first.value.events[0]?.eventType).toBe("MeetingScheduled");

    const second = processScheduleMeeting(
      first.value.run,
      scheduleInput("meeting_b", "2026-07-27T09:00:00.000Z"),
    );
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.value.occurrence.scheduleSequence).toBe(2);
    expect(second.value.occurrence.scheduledFor).toBe(
      first.value.occurrence.scheduledFor,
    );
  });

  it("treats identical reschedule as noop and rejects conflicting content", () => {
    const run = activeRun();
    const first = processScheduleMeeting(
      run,
      scheduleInput("meeting_a", "2026-07-27T09:00:00.000Z"),
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }

    const identical = processScheduleMeeting(first.value.run, {
      ...scheduleInput("meeting_a", "2026-07-27T09:00:00.000Z"),
      commandId: asCommandId("cmd_retry"),
      eventId: asEventId("evt_retry"),
    });
    expect(identical.ok).toBe(true);
    if (!identical.ok) {
      return;
    }
    expect(identical.value.identicalNoop).toBe(true);
    expect(identical.value.run.state.meetings).toHaveLength(1);
    expect(identical.value.events).toHaveLength(0);

    const conflict = processScheduleMeeting(first.value.run, {
      ...scheduleInput("meeting_a", "2026-07-27T10:00:00.000Z"),
      commandId: asCommandId("cmd_conflict"),
      eventId: asEventId("evt_conflict"),
    });
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.error.code).toBe("MEETING_OCCURRENCE_CONFLICT");
    }
  });

  it("applies lifecycle commands and preserves unrelated state", () => {
    const seed = activeRun();
    const scheduled = processScheduleMeeting(
      seed,
      scheduleInput("meeting_a", "2026-07-27T09:00:00.000Z"),
    );
    expect(scheduled.ok).toBe(true);
    if (!scheduled.ok) {
      return;
    }

    const available = processMeetingLifecycle(scheduled.value.run, {
      meetingId: asMeetingId("meeting_a"),
      command: "MakeMeetingAvailable",
      commandId: asCommandId("cmd_avail"),
      occurredAt: now,
      recordedAt: now,
      actorId: asActorId("actor_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      eventId: asEventId("evt_avail"),
    });
    expect(available.ok).toBe(true);
    if (!available.ok) {
      return;
    }
    expect(available.value.events[0]?.eventType).toBe("MeetingMadeAvailable");

    const started = processMeetingLifecycle(available.value.run, {
      meetingId: asMeetingId("meeting_a"),
      command: "StartMeeting",
      commandId: asCommandId("cmd_start"),
      occurredAt: now,
      recordedAt: now,
      actorId: asActorId("actor_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      eventId: asEventId("evt_start"),
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }
    expect(started.value.occurrence.status).toBe("started");

    const completed = processMeetingLifecycle(started.value.run, {
      meetingId: asMeetingId("meeting_a"),
      command: "CompleteMeeting",
      commandId: asCommandId("cmd_complete"),
      occurredAt: now,
      recordedAt: now,
      actorId: asActorId("actor_1"),
      correlationId: asCorrelationId("corr_1"),
      causationId: null,
      eventId: asEventId("evt_complete"),
    });
    expect(completed.ok).toBe(true);
    if (!completed.ok) {
      return;
    }
    expect(completed.value.occurrence.status).toBe("completed");
    expect(completed.value.run.state.learnerMessages).toEqual([]);
  });

  it("upcasts v3 state without meetings and round-trips v4", () => {
    const scheduled = processScheduleMeeting(
      activeRun(),
      scheduleInput("meeting_a", "2026-07-27T09:00:00.000Z"),
    );
    expect(scheduled.ok).toBe(true);
    if (!scheduled.ok) {
      return;
    }
    const serialized = serializeSimulationState(scheduled.value.run.state);
    expect(serialized.schemaVersion).toBe(8);
    const parsed = parseSimulationState(serialized);
    expect(parsed?.meetings).toHaveLength(1);
    expect(parsed?.meetings[0]?.meetingOccurrenceId).toBe(
      "meeting_occurrence:meeting_a",
    );

    const legacyV3 = {
      schemaVersion: 3,
      stateVersion: 0,
      projectMetrics: serialized.projectMetrics,
      projectState: serialized.projectState,
      chapterProgress: [],
      dayProgress: [],
      activityProgress: [],
      decisions: [],
      decisionOutcomes: [],
      consequences: [],
      scheduledEvents: [],
      learnerMessages: [],
    };
    const upcast = parseSimulationState(legacyV3);
    expect(upcast?.schemaVersion).toBe(8);
    expect(upcast?.meetings).toEqual([]);
  });
});
