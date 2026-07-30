import { describe, expect, expectTypeOf, it } from "vitest";
import {
  asActivityId,
  asActorId,
  asArtifactId,
  asChapterId,
  asCommandId,
  asConversationId,
  asCorrelationId,
  asDecisionId,
  asDecisionOptionId,
  asDocumentId,
  asIsoTimestamp,
  asLearnerMessageDefinitionId,
  asMeetingId,
  asNotificationId,
  asSimulationRunId,
  asStakeholderId,
  assertNever,
  domainEventTypesFor,
  isAccepted,
  isRejected,
  isSimulationCommandType,
  simulationCommandTypes,
  validationError,
  type CommandResult,
  type CompleteActivityCommand,
  type CompleteChapterCommand,
  type DeliverLearnerMessageCommand,
  type InitializeActivityCommand,
  type InitializeDocumentCommand,
  type InitializeNotificationCommand,
  type InitializeStakeholderCommand,
  type ScheduleMeetingCommand,
  type SendStakeholderMessageCommand,
  type SimulationCommand,
  type SimulationCommandType,
  type SubmitDecisionCommand,
  type SubmitDecisionPayload,
  type UploadArtifactCommand,
} from "../index";

const envelopeBase = {
  commandId: asCommandId("cmd_1"),
  simulationRunId: asSimulationRunId("run_1"),
  actorId: asActorId("actor_1"),
  occurredAt: asIsoTimestamp("2026-07-24T00:00:00.000Z"),
  correlationId: asCorrelationId("corr_1"),
  causationId: null,
  expectedVersion: 17,
} as const;

const submitDecision: SubmitDecisionCommand = {
  ...envelopeBase,
  commandType: "SubmitDecision",
  payload: {
    decisionId: asDecisionId("decision_1"),
    optionId: asDecisionOptionId("option_b"),
    rationale: "Balances stakeholder and risk impact.",
  },
};

const initializeActivity: InitializeActivityCommand = {
  ...envelopeBase,
  commandType: "InitializeActivity",
  payload: {
    activityId: asActivityId("activity_1"),
    title: "Review project charter",
    summary: "Read and acknowledge the project charter.",
    sourceKind: "simulation",
  },
};

const completeActivity: CompleteActivityCommand = {
  ...envelopeBase,
  commandType: "CompleteActivity",
  payload: { activityId: asActivityId("activity_1") },
};

const initializeStakeholder: InitializeStakeholderCommand = {
  ...envelopeBase,
  commandType: "InitializeStakeholder",
  payload: {
    stakeholderId: asStakeholderId("stakeholder_1"),
    displayName: "Alex Sponsor",
    roleLabel: "Executive Sponsor",
  },
};

const initializeDocument: InitializeDocumentCommand = {
  ...envelopeBase,
  commandType: "InitializeDocument",
  payload: {
    documentId: asDocumentId("document_1"),
    title: "Launch brief",
    body: "Plain-text launch brief.",
  },
};

const deliverLearnerMessage: DeliverLearnerMessageCommand = {
  ...envelopeBase,
  commandType: "DeliverLearnerMessage",
  payload: {
    messageDefinitionId: asLearnerMessageDefinitionId("message_1"),
    senderDisplayName: "Project Office",
    subject: "Welcome",
    body: "Your chapter inbox is ready.",
  },
};

const completeChapter: CompleteChapterCommand = {
  ...envelopeBase,
  commandType: "CompleteChapter",
  payload: {
    chapterId: asChapterId("chapter-01"),
    nextChapterId: asChapterId("chapter-02"),
    requiredDecisionIds: [asDecisionId("decision_1")],
    requiredActivityIds: [asActivityId("activity_1")],
    requiredMeetingIds: [asMeetingId("meeting_1")],
    endingNotification: {
      notificationId: asNotificationId("notification_chapter_end"),
      title: "Chapter complete",
      summary: "You finished Chapter One.",
    },
  },
};

const initializeNotification: InitializeNotificationCommand = {
  ...envelopeBase,
  commandType: "InitializeNotification",
  payload: {
    notificationId: asNotificationId("notification_1"),
    title: "Attention item",
    summary: "Something needs learner attention.",
    sourceKind: "simulation",
  },
};

const sendStakeholderMessage: SendStakeholderMessageCommand = {
  ...envelopeBase,
  commandType: "SendStakeholderMessage",
  payload: {
    recipientId: asStakeholderId("stakeholder_1"),
    conversationId: asConversationId("conversation:stakeholder_1"),
    body: "Following up on the scope change.",
  },
};

const scheduleMeeting: ScheduleMeetingCommand = {
  ...envelopeBase,
  commandType: "ScheduleMeeting",
  payload: {
    meetingId: asMeetingId("meeting_1"),
    title: "Risk review",
    scheduledFor: asIsoTimestamp("2026-07-25T09:00:00.000Z"),
    participantIds: [
      asStakeholderId("stakeholder_1"),
      asStakeholderId("stakeholder_2"),
    ],
  },
};

const makeMeetingAvailable = {
  ...envelopeBase,
  commandType: "MakeMeetingAvailable" as const,
  payload: { meetingId: asMeetingId("meeting_1") },
};

const startMeeting = {
  ...envelopeBase,
  commandType: "StartMeeting" as const,
  payload: { meetingId: asMeetingId("meeting_1") },
};

const completeMeeting = {
  ...envelopeBase,
  commandType: "CompleteMeeting" as const,
  payload: { meetingId: asMeetingId("meeting_1") },
};

const cancelMeeting = {
  ...envelopeBase,
  commandType: "CancelMeeting" as const,
  payload: { meetingId: asMeetingId("meeting_1") },
};

const uploadArtifact: UploadArtifactCommand = {
  ...envelopeBase,
  commandType: "UploadArtifact",
  payload: {
    artifactId: asArtifactId("artifact_1"),
    fileName: "charter.pdf",
    contentType: "application/pdf",
    byteSize: 2048,
  },
};

const allCommands: readonly SimulationCommand[] = [
  submitDecision,
  initializeActivity,
  completeActivity,
  initializeStakeholder,
  initializeDocument,
  initializeNotification,
  deliverLearnerMessage,
  completeChapter,
  sendStakeholderMessage,
  scheduleMeeting,
  makeMeetingAvailable,
  startMeeting,
  completeMeeting,
  cancelMeeting,
  uploadArtifact,
];

/** Exhaustive narrowing over the command union; unhandled cases fail to compile. */
function payloadSummary(command: SimulationCommand): string {
  switch (command.commandType) {
    case "SubmitDecision":
      return command.payload.decisionId;
    case "InitializeActivity":
      return command.payload.title;
    case "CompleteActivity":
      return command.payload.activityId;
    case "InitializeStakeholder":
      return command.payload.displayName;
    case "InitializeDocument":
      return command.payload.title;
    case "InitializeNotification":
      return command.payload.title;
    case "DeliverLearnerMessage":
      return command.payload.subject;
    case "CompleteChapter":
      return command.payload.chapterId;
    case "SendStakeholderMessage":
      return command.payload.body;
    case "ScheduleMeeting":
      return command.payload.title;
    case "MakeMeetingAvailable":
    case "StartMeeting":
    case "CompleteMeeting":
    case "CancelMeeting":
      return command.payload.meetingId;
    case "UploadArtifact":
      return command.payload.fileName;
    default:
      return assertNever(command);
  }
}

describe("simulation command envelope", () => {
  it("given_each_command_when_built_then_the_shared_envelope_fields_are_present", () => {
    for (const command of allCommands) {
      expect(command.commandId).toBe("cmd_1");
      expect(command.simulationRunId).toBe("run_1");
      expect(command.actorId).toBe("actor_1");
      expect(command.correlationId).toBe("corr_1");
      expect(command.causationId).toBeNull();
      expect(command.expectedVersion).toBe(17);
      expect(command.occurredAt).toBe("2026-07-24T00:00:00.000Z");
    }
  });
});

describe("simulation command discriminated union", () => {
  it("given_a_command_when_narrowed_on_commandType_then_payload_is_correctly_typed", () => {
    expect(payloadSummary(submitDecision)).toBe("decision_1");
    expect(payloadSummary(initializeActivity)).toBe("Review project charter");
    expect(payloadSummary(completeActivity)).toBe("activity_1");
    expect(payloadSummary(initializeStakeholder)).toBe("Alex Sponsor");
    expect(payloadSummary(initializeDocument)).toBe("Launch brief");
    expect(payloadSummary(initializeNotification)).toBe("Attention item");
    expect(payloadSummary(sendStakeholderMessage)).toBe(
      "Following up on the scope change.",
    );
    expect(payloadSummary(scheduleMeeting)).toBe("Risk review");
    expect(payloadSummary(uploadArtifact)).toBe("charter.pdf");
  });

  it("given_a_submit_decision_command_when_narrowed_then_payload_type_is_exact", () => {
    if (submitDecision.commandType === "SubmitDecision") {
      expectTypeOf(
        submitDecision.payload,
      ).toEqualTypeOf<SubmitDecisionPayload>();
    }
  });
});

describe("command type guards", () => {
  it("given_known_and_unknown_strings_when_guarded_then_only_known_pass", () => {
    expect(isSimulationCommandType("SubmitDecision")).toBe(true);
    expect(isSimulationCommandType("Frobnicate")).toBe(false);
  });

  it("given_the_registry_when_listed_then_it_contains_all_command_types", () => {
    expect([...simulationCommandTypes].sort()).toEqual(
      [
        "CancelMeeting",
        "CompleteActivity",
        "CompleteChapter",
        "CompleteMeeting",
        "DeliverLearnerMessage",
        "InitializeActivity",
        "InitializeDocument",
        "InitializeNotification",
        "InitializeStakeholder",
        "MakeMeetingAvailable",
        "ScheduleMeeting",
        "SendStakeholderMessage",
        "StartMeeting",
        "SubmitDecision",
        "UploadArtifact",
      ].sort(),
    );
  });
});

describe("command result", () => {
  it("given_an_accepted_result_when_guarded_then_it_reports_version_and_events", () => {
    const result: CommandResult = {
      status: "accepted",
      commandId: asCommandId("cmd_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      aggregateVersion: 18,
      emittedEvents: [],
      emittedEventIds: [],
    };
    expect(isAccepted(result)).toBe(true);
    expect(isRejected(result)).toBe(false);
    if (isAccepted(result)) {
      expect(result.aggregateVersion).toBe(18);
    }
  });

  it("given_a_rejected_result_when_guarded_then_it_carries_a_typed_error", () => {
    const result: CommandResult = {
      status: "rejected",
      commandId: asCommandId("cmd_1"),
      simulationRunId: asSimulationRunId("run_1"),
      correlationId: asCorrelationId("corr_1"),
      error: validationError([
        {
          path: "payload.body",
          reason: "required",
          message: "Body is required.",
        },
      ]),
    };
    expect(isRejected(result)).toBe(true);
    if (isRejected(result)) {
      expect(result.error.kind).toBe("validation");
    }
  });
});

describe("command-to-event contract", () => {
  it("given_command_types_then_emitted_event_types_match_the_action_contract", () => {
    for (const commandType of simulationCommandTypes) {
      if (commandType === "SubmitDecision") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "DecisionSubmitted",
          "ConsequenceCreated",
          "ProjectMetricChanged",
          "ProjectStateTransitioned",
          "LearningSignalEmitted",
          "StakeholderSignalEmitted",
          "AnalyticsSignalEmitted",
          "LearnerMessageDelivered",
          "ConsequenceApplied",
          "ConsequenceScheduled",
          "DecisionResolved",
        ]);
      } else if (commandType === "ScheduleMeeting") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "MeetingScheduled",
        ]);
      } else if (commandType === "MakeMeetingAvailable") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "MeetingMadeAvailable",
        ]);
      } else if (commandType === "StartMeeting") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "MeetingStarted",
        ]);
      } else if (commandType === "CompleteMeeting") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "MeetingCompleted",
        ]);
      } else if (commandType === "CancelMeeting") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "MeetingCancelled",
        ]);
      } else if (commandType === "InitializeStakeholder") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "StakeholderInitialized",
        ]);
      } else if (commandType === "InitializeDocument") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "DocumentInitialized",
        ]);
      } else if (commandType === "InitializeNotification") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "NotificationInitialized",
        ]);
      } else if (commandType === "DeliverLearnerMessage") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "LearnerMessageDelivered",
        ]);
      } else if (commandType === "CompleteChapter") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "NotificationInitialized",
        ]);
      } else if (commandType === "InitializeActivity") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "ActivityInitialized",
        ]);
      } else if (commandType === "CompleteActivity") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "ActivityCompleted",
        ]);
      } else if (commandType === "SendStakeholderMessage") {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
          "StakeholderConversationOpened",
          "StakeholderMessageSent",
        ]);
      } else {
        expect(domainEventTypesFor(commandType)).toEqual([
          "SimulationActionAccepted",
        ]);
      }
    }
  });

  it("given_the_command_type_literal_then_it_matches_the_registry_element_type", () => {
    expectTypeOf(simulationCommandTypes[0]).toEqualTypeOf<
      SimulationCommandType | undefined
    >();
  });
});

describe("optimistic-concurrency metadata", () => {
  it("given_a_non_version_sensitive_command_then_the_fields_are_present_and_null", () => {
    const rootCommand: CompleteActivityCommand = {
      ...envelopeBase,
      commandType: "CompleteActivity",
      causationId: null,
      expectedVersion: null,
      payload: { activityId: asActivityId("activity_9") },
    };

    // Required-but-nullable: keys always exist and are explicitly null, not omitted.
    expect("expectedVersion" in rootCommand).toBe(true);
    expect("causationId" in rootCommand).toBe(true);
    expect(rootCommand.expectedVersion).toBeNull();
    expect(rootCommand.causationId).toBeNull();
  });
});
