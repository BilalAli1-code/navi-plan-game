import type { CommandError } from "../../shared-kernel/errors";
import type {
  CommandId,
  CorrelationId,
  EventId,
  SimulationRunId,
} from "../../shared-kernel/ids";
import type { SimulationDomainEvent } from "../events/events";

/**
 * Standard result of processing a simulation command.
 *
 * Per docs/architecture/03-system-architecture/06_Command_Processing_Architecture.md
 * command results include state versions and emitted-event references, and per
 * docs/architecture/05-api-architecture/02_Resource_and_Command_Model.md a
 * command either succeeds once or returns the original result on retry.
 * Discriminated on `status`.
 */
export type CommandResult<
  TEvent extends SimulationDomainEvent = SimulationDomainEvent,
> = CommandAccepted<TEvent> | CommandRejected;

export interface CommandAccepted<
  TEvent extends SimulationDomainEvent = SimulationDomainEvent,
> {
  readonly status: "accepted";
  readonly commandId: CommandId;
  readonly simulationRunId: SimulationRunId;
  readonly correlationId: CorrelationId;
  /** Aggregate version after the command's events were applied. */
  readonly aggregateVersion: number;
  /** Events emitted by the command, in aggregate-sequence order. */
  readonly emittedEvents: readonly TEvent[];
  /** Convenience references to the emitted event ids (matches CommandReceipt). */
  readonly emittedEventIds: readonly EventId[];
}

export interface CommandRejected {
  readonly status: "rejected";
  readonly commandId: CommandId;
  readonly simulationRunId: SimulationRunId;
  readonly correlationId: CorrelationId;
  readonly error: CommandError;
}

export const isAccepted = <TEvent extends SimulationDomainEvent>(
  result: CommandResult<TEvent>,
): result is CommandAccepted<TEvent> => result.status === "accepted";

export const isRejected = <TEvent extends SimulationDomainEvent>(
  result: CommandResult<TEvent>,
): result is CommandRejected => result.status === "rejected";
