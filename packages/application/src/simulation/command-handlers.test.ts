import { describe, expect, it } from "vitest";
import {
  asActivityId,
  asActorId,
  asArtifactId,
  asCommandId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asDocumentId,
  asIsoTimestamp,
  asMeetingId,
  asNotificationId,
  asSimulationRunId,
  asStakeholderId,
  simulationCommandTypes,
  type CompleteActivityCommand,
  type InitializeDocumentCommand,
  type InitializeNotificationCommand,
  type InitializeStakeholderCommand,
  type ScheduleMeetingCommand,
  type SendStakeholderMessageCommand,
  type SubmitDecisionCommand,
  type UploadArtifactCommand,
} from "@projectsim/domain";
import {
  cancelMeetingHandler,
  completeActivityHandler,
  completeMeetingHandler,
  initializeDocumentHandler,
  initializeNotificationHandler,
  initializeStakeholderHandler,
  makeMeetingAvailableHandler,
  scheduleMeetingHandler,
  sendStakeholderMessageHandler,
  simulationCommandHandlers,
  startMeetingHandler,
  submitDecisionHandler,
  uploadArtifactHandler,
} from "./command-handlers";

const base = {
  commandId: asCommandId("cmd_1"),
  simulationRunId: asSimulationRunId("run_1"),
  actorId: asActorId("actor_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  expectedVersion: null,
} as const;

const validSubmitDecision: SubmitDecisionCommand = {
  ...base,
  commandType: "SubmitDecision",
  payload: {
    decisionId: asDecisionId("decision_1"),
    optionId: asDecisionOptionId("option_b"),
  },
};

const validCompleteActivity: CompleteActivityCommand = {
  ...base,
  commandType: "CompleteActivity",
  payload: { activityId: asActivityId("activity_1") },
};

const validInitializeStakeholder: InitializeStakeholderCommand = {
  ...base,
  commandType: "InitializeStakeholder",
  payload: {
    stakeholderId: asStakeholderId("stakeholder_1"),
    displayName: "Alex Sponsor",
  },
};

const validSendMessage: SendStakeholderMessageCommand = {
  ...base,
  commandType: "SendStakeholderMessage",
  payload: { recipientId: asStakeholderId("stakeholder_1"), body: "Hello" },
};

const validInitializeDocument: InitializeDocumentCommand = {
  ...base,
  commandType: "InitializeDocument",
  payload: {
    documentId: asDocumentId("doc_1"),
    title: "Project brief",
    body: "Plain text brief",
  },
};

const validInitializeNotification: InitializeNotificationCommand = {
  ...base,
  commandType: "InitializeNotification",
  payload: {
    notificationId: asNotificationId("notification_1"),
    title: "Simulation milestone reached",
    summary: "Your project has hit a key milestone.",
    sourceKind: "simulation",
  },
};

const validScheduleMeeting: ScheduleMeetingCommand = {
  ...base,
  commandType: "ScheduleMeeting",
  payload: {
    meetingId: asMeetingId("meeting_1"),
    title: "Risk review",
    scheduledFor: asIsoTimestamp("2026-07-25T09:00:00.000Z"),
    participantIds: [asStakeholderId("stakeholder_1")],
  },
};

const validUploadArtifact: UploadArtifactCommand = {
  ...base,
  commandType: "UploadArtifact",
  payload: {
    artifactId: asArtifactId("artifact_1"),
    fileName: "charter.pdf",
    contentType: "application/pdf",
    byteSize: 2048,
  },
};

describe("simulation command handlers — valid payloads", () => {
  it("given_valid_payloads_when_validated_then_no_field_errors_are_returned", () => {
    expect(submitDecisionHandler.validate(validSubmitDecision)).toEqual([]);
    expect(completeActivityHandler.validate(validCompleteActivity)).toEqual([]);
    expect(
      initializeStakeholderHandler.validate(validInitializeStakeholder),
    ).toEqual([]);
    expect(sendStakeholderMessageHandler.validate(validSendMessage)).toEqual(
      [],
    );
    expect(initializeDocumentHandler.validate(validInitializeDocument)).toEqual(
      [],
    );
    expect(
      initializeNotificationHandler.validate(validInitializeNotification),
    ).toEqual([]);
    expect(scheduleMeetingHandler.validate(validScheduleMeeting)).toEqual([]);
    expect(
      makeMeetingAvailableHandler.validate({
        ...base,
        commandType: "MakeMeetingAvailable",
        payload: { meetingId: asMeetingId("meeting_1") },
      }),
    ).toEqual([]);
    expect(
      startMeetingHandler.validate({
        ...base,
        commandType: "StartMeeting",
        payload: { meetingId: asMeetingId("meeting_1") },
      }),
    ).toEqual([]);
    expect(
      completeMeetingHandler.validate({
        ...base,
        commandType: "CompleteMeeting",
        payload: { meetingId: asMeetingId("meeting_1") },
      }),
    ).toEqual([]);
    expect(
      cancelMeetingHandler.validate({
        ...base,
        commandType: "CancelMeeting",
        payload: { meetingId: asMeetingId("meeting_1") },
      }),
    ).toEqual([]);
    expect(uploadArtifactHandler.validate(validUploadArtifact)).toEqual([]);
  });
});

describe("simulation command handlers — invalid payloads", () => {
  it("given_a_blank_decision_when_validated_then_the_offending_fields_are_reported", () => {
    const errors = submitDecisionHandler.validate({
      ...validSubmitDecision,
      payload: {
        decisionId: asDecisionId(""),
        optionId: asDecisionOptionId(""),
      },
    });
    expect(errors.map((error) => error.path)).toEqual([
      "payload.decisionId",
      "payload.optionId",
    ]);
  });

  it("given_an_empty_message_body_when_validated_then_body_is_reported", () => {
    const errors = sendStakeholderMessageHandler.validate({
      ...validSendMessage,
      payload: { recipientId: asStakeholderId("stakeholder_1"), body: "  " },
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toBe("payload.body");
  });

  it("given_an_empty_document_body_when_validated_then_body_is_reported", () => {
    const errors = initializeDocumentHandler.validate({
      ...validInitializeDocument,
      payload: {
        ...validInitializeDocument.payload,
        body: "  ",
      },
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toBe("payload.body");
  });

  it("given_a_blank_notification_title_when_validated_then_title_is_reported", () => {
    const errors = initializeNotificationHandler.validate({
      ...validInitializeNotification,
      payload: {
        ...validInitializeNotification.payload,
        title: "  ",
      },
    });
    expect(errors.map((e) => e.path)).toContain("payload.title");
  });

  it("given_a_blank_notification_summary_when_validated_then_summary_is_reported", () => {
    const errors = initializeNotificationHandler.validate({
      ...validInitializeNotification,
      payload: {
        ...validInitializeNotification.payload,
        summary: "  ",
      },
    });
    expect(errors.map((e) => e.path)).toContain("payload.summary");
  });

  it("given_no_participants_when_validated_then_participants_are_reported", () => {
    const errors = scheduleMeetingHandler.validate({
      ...validScheduleMeeting,
      payload: { ...validScheduleMeeting.payload, participantIds: [] },
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toBe("payload.participantIds");
  });

  it("given_a_non_positive_byte_size_when_validated_then_byte_size_is_reported", () => {
    const errors = uploadArtifactHandler.validate({
      ...validUploadArtifact,
      payload: { ...validUploadArtifact.payload, byteSize: 0 },
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.path).toBe("payload.byteSize");
  });
});

describe("handler registry", () => {
  it("given_the_registry_then_it_has_exactly_one_handler_per_command_type", () => {
    const registryKeys = Object.keys(simulationCommandHandlers).sort();
    expect(registryKeys).toEqual([...simulationCommandTypes].sort());
    for (const commandType of simulationCommandTypes) {
      expect(simulationCommandHandlers[commandType].commandType).toBe(
        commandType,
      );
    }
  });
});
