import {
  assertNever,
  type FieldValidationError,
  type SimulationCommand,
} from "@projectsim/domain";
import type { SimulationCommandHandlerRegistry } from "./command-handler";
import { simulationCommandHandlers } from "./command-handlers";

/**
 * Routes a command to its handler for validation. Routing is an exhaustive
 * `switch` closed by {@link assertNever}, so adding a new command type without a
 * dispatch case is a compile-time error. The dispatcher owns no business rules;
 * it only selects the correct handler.
 */
export interface SimulationCommandDispatcher {
  validate(command: SimulationCommand): readonly FieldValidationError[];
}

export const createSimulationCommandDispatcher = (
  handlers: SimulationCommandHandlerRegistry = simulationCommandHandlers,
): SimulationCommandDispatcher => ({
  validate(command) {
    switch (command.commandType) {
      case "SubmitDecision":
        return handlers.SubmitDecision.validate(command);
      case "CompleteActivity":
        return handlers.CompleteActivity.validate(command);
      case "InitializeStakeholder":
        return handlers.InitializeStakeholder.validate(command);
      case "SendStakeholderMessage":
        return handlers.SendStakeholderMessage.validate(command);
      case "InitializeDocument":
        return handlers.InitializeDocument.validate(command);
      case "InitializeNotification":
        return handlers.InitializeNotification.validate(command);
      case "DeliverLearnerMessage":
        return handlers.DeliverLearnerMessage.validate(command);
      case "CompleteChapter":
        return handlers.CompleteChapter.validate(command);
      case "InitializeActivity":
        return handlers.InitializeActivity.validate(command);
      case "ScheduleMeeting":
        return handlers.ScheduleMeeting.validate(command);
      case "MakeMeetingAvailable":
        return handlers.MakeMeetingAvailable.validate(command);
      case "StartMeeting":
        return handlers.StartMeeting.validate(command);
      case "CompleteMeeting":
        return handlers.CompleteMeeting.validate(command);
      case "CancelMeeting":
        return handlers.CancelMeeting.validate(command);
      case "UploadArtifact":
        return handlers.UploadArtifact.validate(command);
      default:
        return assertNever(command);
    }
  },
});
