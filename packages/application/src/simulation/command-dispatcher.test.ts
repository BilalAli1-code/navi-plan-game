import { describe, expect, it } from "vitest";
import {
  asActorId,
  asCommandId,
  asCorrelationId,
  asIsoTimestamp,
  asMeetingId,
  asSimulationRunId,
  asStakeholderId,
  type ScheduleMeetingCommand,
} from "@projectsim/domain";
import { createSimulationCommandDispatcher } from "./command-dispatcher";

const base = {
  commandId: asCommandId("cmd_1"),
  simulationRunId: asSimulationRunId("run_1"),
  actorId: asActorId("actor_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  expectedVersion: null,
} as const;

const scheduleMeeting: ScheduleMeetingCommand = {
  ...base,
  commandType: "ScheduleMeeting",
  payload: {
    meetingId: asMeetingId("meeting_1"),
    title: "Risk review",
    scheduledFor: asIsoTimestamp("2026-07-25T09:00:00.000Z"),
    participantIds: [asStakeholderId("stakeholder_1")],
  },
};

describe("SimulationCommandDispatcher", () => {
  it("given_a_valid_command_when_dispatched_then_it_routes_to_the_matching_handler", () => {
    const dispatcher = createSimulationCommandDispatcher();
    expect(dispatcher.validate(scheduleMeeting)).toEqual([]);
  });

  it("given_an_invalid_command_when_dispatched_then_the_handler_reports_field_errors", () => {
    const dispatcher = createSimulationCommandDispatcher();
    const errors = dispatcher.validate({
      ...scheduleMeeting,
      payload: { ...scheduleMeeting.payload, title: "", participantIds: [] },
    });
    expect(errors.map((error) => error.path).sort()).toEqual([
      "payload.participantIds",
      "payload.title",
    ]);
  });
});
