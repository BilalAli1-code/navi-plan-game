import { describe, expect, it } from "vitest";
import {
  asActionRecordId,
  asActivityId,
  asActorId,
  asBusinessCaseId,
  asChapterId,
  asCommandId,
  asContentPackageVersionId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asDecisionOutcomeId,
  asDecisionRecordId,
  asEventId,
  asIsoTimestamp,
  asLearnerId,
  asMeetingDefinitionId,
  asMeetingId,
  asMeetingOccurrenceId,
  asNotificationId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  createActivityLearnerSafeContent,
  createActivityProvenance,
  createActivityRuntime,
  createDecision,
  createInitialSimulationState,
  createMeetingOccurrence,
  markDecisionResolved,
  processCompleteChapter,
  transitionMeetingOccurrence,
  type SimulationRun,
  type SimulationState,
} from "../../index";

const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");
const tenantId = asTenantId("tenant_1");
const chapterId = asChapterId("chapter-01");
const nextChapterId = asChapterId("chapter-02");
const decisionId = asDecisionId("decision.define-objective");
const activityId = asActivityId("activity.review-authorization");
const meetingId = asMeetingId("meeting.program-kickoff");

const activeRun = (state?: SimulationState): SimulationRun => ({
  id: asSimulationRunId("run_complete_chapter"),
  tenantId,
  learnerId: asLearnerId("learner_1"),
  businessCaseId: asBusinessCaseId("case_1"),
  contentPackageVersionId: asContentPackageVersionId("cpv_chapter"),
  runtimeVersion: "runtime-1",
  status: "active",
  aggregateVersion: 2,
  lastProcessedSequence: 0,
  currentChapterId: chapterId,
  currentDayId: null,
  startedAt: now,
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  state: state ?? createInitialSimulationState(),
});

const baseInput = {
  chapterId,
  nextChapterId,
  requiredDecisionIds: [decisionId],
  requiredActivityIds: [activityId],
  requiredMeetingIds: [meetingId],
  endingNotification: {
    notificationId: asNotificationId("notification.chapter-one-complete"),
    title: "Chapter One complete",
    summary: "You finished the first chapter.",
    body: "Proceed when ready.",
  },
  commandId: asCommandId("cmd_complete_chapter"),
  occurredAt: now,
  recordedAt: now,
  actorId: asActorId("actor_1"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  eventId: asEventId("evt_complete_chapter"),
};

const satisfiedState = (): SimulationState => {
  const decision = createDecision({
    id: asDecisionRecordId("decision_record_1"),
    decisionDefinitionId: decisionId,
    selectedOptionId: asDecisionOptionId("option_a"),
    submittedBy: asActorId("actor_1"),
    submittedAt: now,
    sourceActionId: asActionRecordId("action_1"),
    contextStateVersion: 0,
  });
  if (!decision.ok) {
    throw new Error("decision fixture failed");
  }
  const resolved = markDecisionResolved(decision.value, {
    outcomeId: asDecisionOutcomeId("outcome_1"),
    resolvedAt: now,
  });
  if (!resolved.ok) {
    throw new Error("resolve fixture failed");
  }

  const activityContent = createActivityLearnerSafeContent({
    title: "Review authorization",
    summary: "Read the authorization summary.",
  });
  if (!activityContent.ok) {
    throw new Error("activity content fixture failed");
  }
  const activitySource = createActivityProvenance({
    kind: "simulation",
    sourceId: chapterId,
    reason: "chapter_requirement",
  });
  if (!activitySource.ok) {
    throw new Error("activity source fixture failed");
  }
  const activity = createActivityRuntime({
    activityId,
    creationSequence: 1,
    content: activityContent.value,
    source: activitySource.value,
    createdAt: now,
    originatingCommandId: asCommandId("cmd_init_activity"),
  });
  if (!activity.ok) {
    throw new Error("activity fixture failed");
  }
  const completedActivity = {
    ...activity.value,
    status: "completed" as const,
    completedAt: now,
    completionSequence: 1,
  };

  const scheduled = createMeetingOccurrence({
    meetingOccurrenceId: asMeetingOccurrenceId(
      "meeting_occurrence:meeting.program-kickoff",
    ),
    meetingDefinitionId: asMeetingDefinitionId("meeting.program-kickoff"),
    meetingDefinitionVersion: "1",
    scheduleSequence: 1,
    title: "Kickoff",
    scheduledFor: now,
    agenda: null,
    durationMinutes: null,
    channel: null,
    location: null,
    participants: [
      {
        stakeholderId: asStakeholderId("stakeholder.sponsor"),
        displayName: "Sponsor",
      },
    ],
    scheduledAt: now,
    originatingCommandId: asCommandId("cmd_schedule_meeting"),
  });
  if (!scheduled.ok) {
    throw new Error(`meeting fixture failed: ${scheduled.error.code}`);
  }
  const available = transitionMeetingOccurrence(
    scheduled.value,
    "MakeMeetingAvailable",
    now,
  );
  if (!available.ok) {
    throw new Error("meeting available fixture failed");
  }
  const started = transitionMeetingOccurrence(
    available.value,
    "StartMeeting",
    now,
  );
  if (!started.ok) {
    throw new Error("meeting started fixture failed");
  }
  const completed = transitionMeetingOccurrence(
    started.value,
    "CompleteMeeting",
    now,
  );
  if (!completed.ok) {
    throw new Error("meeting completed fixture failed");
  }

  return {
    ...createInitialSimulationState(),
    decisions: [resolved.value],
    activities: [completedActivity],
    meetings: [completed.value],
  };
};

describe("processCompleteChapter", () => {
  it("completes a chapter, advances currentChapterId, and emits ending notification", () => {
    const result = processCompleteChapter(
      activeRun(satisfiedState()),
      baseInput,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.identicalNoop).toBe(false);
    expect(result.value.run.currentChapterId).toBe(nextChapterId);
    expect(result.value.run.state.chapterProgress).toEqual([
      { chapterId, status: "completed", completedAt: now },
    ]);
    expect(result.value.run.state.notifications).toHaveLength(1);
    expect(result.value.events.map((event) => event.eventType)).toEqual([
      "NotificationInitialized",
    ]);
  });

  it("is idempotent once the chapter is already completed", () => {
    const first = processCompleteChapter(
      activeRun(satisfiedState()),
      baseInput,
    );
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    const retry = processCompleteChapter(first.value.run, {
      ...baseInput,
      commandId: asCommandId("cmd_complete_chapter_retry"),
      eventId: asEventId("evt_complete_chapter_retry"),
    });
    expect(retry.ok).toBe(true);
    if (!retry.ok) {
      return;
    }
    expect(retry.value.identicalNoop).toBe(true);
    expect(retry.value.events).toHaveLength(0);
    expect(retry.value.run.state.chapterProgress).toHaveLength(1);
    expect(retry.value.run.state.notifications).toHaveLength(1);
  });

  it("rejects when required decisions are not resolved", () => {
    const result = processCompleteChapter(activeRun(), baseInput);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error.code).toBe("CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET");
  });
});
