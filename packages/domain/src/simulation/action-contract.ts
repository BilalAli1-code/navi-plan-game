import { assertNever } from "../shared-kernel/exhaustive";
import type { SimulationCommandType } from "./commands/envelope";
import type { SimulationDomainEventType } from "./events/events";

/**
 * The domain-event types a given command may produce when accepted.
 *
 * For the MVP every accepted command emits exactly one event —
 * `SimulationActionAccepted` — regardless of command type. `actionType` on that
 * event's payload is what distinguishes the individual actions. The `default`
 * branch uses {@link assertNever} so that adding a new `SimulationCommandType`
 * without updating this mapping is a compile-time error (exhaustive checking).
 *
 * This is contract metadata only — it declares which events are possible and
 * contains no business-case-specific decisioning.
 *
 * TODO(next-domain-model-iteration): when dedicated events are introduced, the
 * relevant cases below should additionally return them, e.g.
 *   - "CompleteActivity"        -> [..., "ActivityCompleted"]
 *   - "UploadArtifact"          -> [..., "ArtifactUploaded"]
 * None of these are emitted yet.
 */
export function domainEventTypesFor(
  commandType: SimulationCommandType,
): readonly SimulationDomainEventType[] {
  switch (commandType) {
    case "SubmitDecision":
      return [
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
      ];
    case "InitializeActivity":
      return ["SimulationActionAccepted", "ActivityInitialized"];
    case "CompleteActivity":
      return ["SimulationActionAccepted", "ActivityCompleted"];
    case "InitializeStakeholder":
      return ["SimulationActionAccepted", "StakeholderInitialized"];
    case "SendStakeholderMessage":
      return [
        "SimulationActionAccepted",
        "StakeholderConversationOpened",
        "StakeholderMessageSent",
      ];
    case "ScheduleMeeting":
      return ["SimulationActionAccepted", "MeetingScheduled"];
    case "MakeMeetingAvailable":
      return ["SimulationActionAccepted", "MeetingMadeAvailable"];
    case "StartMeeting":
      return ["SimulationActionAccepted", "MeetingStarted"];
    case "CompleteMeeting":
      return ["SimulationActionAccepted", "MeetingCompleted"];
    case "CancelMeeting":
      return ["SimulationActionAccepted", "MeetingCancelled"];
    case "InitializeDocument":
      return ["SimulationActionAccepted", "DocumentInitialized"];
    case "InitializeNotification":
      return ["SimulationActionAccepted", "NotificationInitialized"];
    case "DeliverLearnerMessage":
      return ["SimulationActionAccepted", "LearnerMessageDelivered"];
    case "CompleteChapter":
      return ["SimulationActionAccepted", "NotificationInitialized"];
    case "UploadArtifact":
      // TODO(next-domain-model-iteration): also emit "ArtifactUploaded".
      return ["SimulationActionAccepted"];
    default:
      return assertNever(commandType);
  }
}
