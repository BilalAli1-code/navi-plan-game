import { describe, expect, it } from "vitest";
import {
  asBusinessCaseId,
  asCommandId,
  asContentPackageVersionId,
  asIsoTimestamp,
  asLearnerId,
  asMeetingDefinitionId,
  asMeetingOccurrenceId,
  asSimulationRunId,
  asStakeholderId,
  asTenantId,
  createInitialSimulationState,
  createMeetingOccurrence,
  transitionMeetingOccurrence,
  type MeetingOccurrence,
  type SimulationRun,
  type SimulationState,
} from "../index";
import {
  buildMeetingsProjection,
  computeMeetingsSemanticHash,
  countUpcomingMeetings,
} from "./meetings-builder";
import {
  MEETINGS_PROJECTION_SCHEMA_VERSION,
  MEETINGS_PROJECTION_TYPE,
} from "./meetings-contracts";
import { parseMeetingsProjection } from "./meetings-payload";
import { toSimulationRunReadSnapshot } from "./read-snapshot";

const tenantId = asTenantId("tenant_1");
const contentPackageVersionId = asContentPackageVersionId("cpv_1");
const now = asIsoTimestamp("2026-07-26T12:00:00.000Z");

const activeRun = (overrides: Partial<SimulationRun> = {}): SimulationRun => ({
  id: asSimulationRunId("run_1"),
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
  startedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  pausedAt: null,
  completedAt: null,
  archivedAt: null,
  createdAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  updatedAt: asIsoTimestamp("2026-07-26T00:00:00.000Z"),
  state: createInitialSimulationState(),
  ...overrides,
});

const occurrence = (input: {
  readonly id: string;
  readonly sequence: number;
  readonly title?: string;
  readonly scheduledFor?: string;
  readonly status?: MeetingOccurrence["status"];
  readonly agenda?: string | null;
  readonly channel?: string | null;
  readonly location?: string | null;
  readonly durationMinutes?: number | null;
}): MeetingOccurrence => {
  const created = createMeetingOccurrence({
    meetingOccurrenceId: asMeetingOccurrenceId(input.id),
    meetingDefinitionId: asMeetingDefinitionId("meeting_def_1"),
    meetingDefinitionVersion: "1",
    scheduleSequence: input.sequence,
    scheduledFor: asIsoTimestamp(
      input.scheduledFor ?? "2026-07-27T09:00:00.000Z",
    ),
    durationMinutes:
      input.durationMinutes === undefined ? 30 : input.durationMinutes,
    title: input.title ?? `Meeting ${input.sequence}`,
    agenda: input.agenda === undefined ? "Agenda" : input.agenda,
    participants: [
      {
        stakeholderId: asStakeholderId("stakeholder_1"),
        displayName: "Alex Sponsor",
      },
    ],
    channel: input.channel === undefined ? "Room A" : input.channel,
    location: input.location === undefined ? "HQ" : input.location,
    scheduledAt: asIsoTimestamp("2026-07-26T10:00:00.000Z"),
    originatingCommandId: asCommandId(`cmd_${input.sequence}`),
  });
  if (!created.ok) {
    throw new Error("createMeetingOccurrence failed");
  }
  let meeting = created.value;
  if (input.status && input.status !== "scheduled") {
    const transitions =
      input.status === "available"
        ? (["MakeMeetingAvailable"] as const)
        : input.status === "started"
          ? (["MakeMeetingAvailable", "StartMeeting"] as const)
          : input.status === "completed"
            ? ([
                "MakeMeetingAvailable",
                "StartMeeting",
                "CompleteMeeting",
              ] as const)
            : (["CancelMeeting"] as const);
    for (const command of transitions) {
      const next = transitionMeetingOccurrence(
        meeting,
        command,
        asIsoTimestamp("2026-07-26T11:00:00.000Z"),
      );
      if (!next.ok) {
        throw new Error(`transition ${command} failed`);
      }
      meeting = next.value;
    }
  }
  return meeting;
};

const stateWithMeetings = (
  meetings: readonly MeetingOccurrence[],
): SimulationState => ({
  ...createInitialSimulationState(),
  meetings: [...meetings],
});

const buildFor = (run: SimulationRun, generatedAt = now) => {
  const snapshot = toSimulationRunReadSnapshot(run);
  expect(snapshot.ok).toBe(true);
  if (!snapshot.ok) {
    throw new Error("snapshot failed");
  }
  return buildMeetingsProjection({
    snapshot: snapshot.value,
    generatedAt,
  });
};

describe("buildMeetingsProjection", () => {
  it("builds schema v1 meetings envelope with empty available list", () => {
    const result = buildFor(activeRun());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.projectionType).toBe(MEETINGS_PROJECTION_TYPE);
    expect(result.value.projectionSchemaVersion).toBe(
      MEETINGS_PROJECTION_SCHEMA_VERSION,
    );
    expect(result.value.projectionId).toBe(
      "projection:meetings:tenant_1:run_1",
    );
    expect(result.value.meetings).toEqual([]);
    expect(result.value.summary).toEqual({
      totalMeetings: 0,
      upcomingCount: 0,
      activeCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      isEmpty: true,
    });
    expect(result.value.capabilities).toEqual({
      start: "unsupported",
      complete: "unsupported",
      cancel: "unsupported",
      reschedule: "unsupported",
    });
  });

  it("maps one occurrence with stable identity and provenance", () => {
    const meeting = occurrence({
      id: "meeting_occurrence:meeting_1",
      sequence: 1,
      title: "Risk review",
    });
    const result = buildFor(activeRun({ state: stateWithMeetings([meeting]) }));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.meetings).toHaveLength(1);
    const item = result.value.meetings[0]!;
    expect(item.meetingOccurrenceId).toBe("meeting_occurrence:meeting_1");
    expect(item.meetingDefinitionId).toBe("meeting_def_1");
    expect(item.meetingDefinitionVersion).toBe("1");
    expect(item.scheduleSequence).toBe(1);
    expect(item.title).toBe("Risk review");
    expect(item.status).toBe("scheduled");
    expect(item.participants).toEqual([
      { stakeholderId: "stakeholder_1", displayName: "Alex Sponsor" },
    ]);
    expect(result.value.summary).toEqual({
      totalMeetings: 1,
      upcomingCount: 1,
      activeCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      isEmpty: false,
    });
    expect(
      Object.prototype.hasOwnProperty.call(item, "originatingCommandId"),
    ).toBe(false);
  });

  it("orders by scheduleSequence ascending with stable identity", () => {
    const first = occurrence({
      id: "meeting_occurrence:m1",
      sequence: 1,
      title: "First",
      scheduledFor: "2026-07-28T09:00:00.000Z",
    });
    const second = occurrence({
      id: "meeting_occurrence:m2",
      sequence: 2,
      title: "Second",
      scheduledFor: "2026-07-27T09:00:00.000Z",
    });
    const result = buildFor(
      activeRun({ state: stateWithMeetings([second, first]) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.meetings.map((m) => m.meetingOccurrenceId)).toEqual([
      "meeting_occurrence:m1",
      "meeting_occurrence:m2",
    ]);
    expect(result.value.meetings.map((m) => m.scheduleSequence)).toEqual([
      1, 2,
    ]);
  });

  it("maps each lifecycle status truthfully", () => {
    for (const status of [
      "scheduled",
      "available",
      "started",
      "completed",
      "cancelled",
    ] as const) {
      const meeting = occurrence({
        id: `meeting_occurrence:${status}`,
        sequence: 1,
        status,
      });
      const result = buildFor(
        activeRun({ state: stateWithMeetings([meeting]) }),
      );
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.value.meetings[0]?.status).toBe(status);
    }
  });

  it("produces identical payload and semantic hash for identical source", () => {
    const meetings = [
      occurrence({ id: "meeting_occurrence:m1", sequence: 1 }),
      occurrence({ id: "meeting_occurrence:m2", sequence: 2 }),
    ];
    const first = buildFor(activeRun({ state: stateWithMeetings(meetings) }));
    const second = buildFor(
      activeRun({ state: stateWithMeetings(meetings) }),
      asIsoTimestamp("2026-07-26T13:00:00.000Z"),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.meetings).toEqual(second.value.meetings);
    expect(first.value.semanticHash).toBe(second.value.semanticHash);
    expect(first.value.semanticHash).toBe(
      computeMeetingsSemanticHash({ ...first.value }),
    );
  });

  it("changes semantic hash when lifecycle status changes", () => {
    const scheduled = occurrence({
      id: "meeting_occurrence:m1",
      sequence: 1,
      status: "scheduled",
    });
    const available = occurrence({
      id: "meeting_occurrence:m1",
      sequence: 1,
      status: "available",
    });
    const first = buildFor(
      activeRun({ state: stateWithMeetings([scheduled]) }),
    );
    const second = buildFor(
      activeRun({ state: stateWithMeetings([available]) }),
    );
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.value.semanticHash).not.toBe(second.value.semanticHash);
  });

  it("rejects duplicate occurrence IDs", () => {
    const meeting = occurrence({
      id: "meeting_occurrence:m1",
      sequence: 1,
    });
    const result = buildFor(
      activeRun({
        state: stateWithMeetings([
          meeting,
          occurrence({ id: "meeting_occurrence:m1", sequence: 2 }),
        ]),
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("round-trips through parseMeetingsProjection and rejects hidden fields", () => {
    const result = buildFor(
      activeRun({
        state: stateWithMeetings([
          occurrence({ id: "meeting_occurrence:m1", sequence: 1 }),
        ]),
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const parsed = parseMeetingsProjection(result.value);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.meetings[0]?.meetingOccurrenceId).toBe(
      "meeting_occurrence:m1",
    );

    const withHidden = {
      ...result.value,
      meetings: [
        {
          ...result.value.meetings[0],
          originatingCommandId: "cmd_hidden",
        },
      ],
    };
    expect(parseMeetingsProjection(withHidden).ok).toBe(false);
  });
});

describe("countUpcomingMeetings", () => {
  it("counts scheduled and available only", () => {
    const meetings = [
      occurrence({
        id: "meeting_occurrence:a",
        sequence: 1,
        status: "scheduled",
      }),
      occurrence({
        id: "meeting_occurrence:b",
        sequence: 2,
        status: "available",
      }),
      occurrence({
        id: "meeting_occurrence:c",
        sequence: 3,
        status: "started",
      }),
      occurrence({
        id: "meeting_occurrence:d",
        sequence: 4,
        status: "completed",
      }),
      occurrence({
        id: "meeting_occurrence:e",
        sequence: 5,
        status: "cancelled",
      }),
    ];
    expect(countUpcomingMeetings(meetings)).toBe(2);
  });
});
