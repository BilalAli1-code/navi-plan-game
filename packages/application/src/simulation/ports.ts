import type {
  ActionRecordId,
  AuthorizationError,
  CommandId,
  CommandResult,
  ConcurrencyError,
  DecisionRecordId,
  EventId,
  IsoTimestamp,
  Result,
  SimulationCommand,
  SimulationRunId,
} from "@projectsim/domain";

/**
 * Application ports (hexagonal boundaries).
 *
 * These interfaces express what the application layer NEEDS from the outside
 * world (time, identifiers, authorization, idempotency, sequencing). They are
 * abstractions only — concrete implementations (persistence, Supabase, clocks,
 * etc.) are infrastructure and are intentionally NOT provided here
 * (docs/handbook/05_Domain_and_Application_Coding_Standards.md: "Domain and
 * application layers depend on interfaces. Infrastructure provides
 * implementations."). Event publication reuses the domain `DomainEventPublisher`
 * port from PS-002.
 */

/** Supplies the current time as an ISO timestamp (no ambient clock access). */
export interface Clock {
  now(): IsoTimestamp;
}

/** Generates the identifiers required to record an action and its event. */
export interface IdentifierGenerator {
  nextEventId(): EventId;
  nextActionRecordId(): ActionRecordId;
  nextSimulationRunId(): SimulationRunId;
  nextDecisionRecordId(): DecisionRecordId;
}

/**
 * Authorizes a command before execution
 * (06_Command_Processing_Architecture.md: authorization occurs before
 * execution). Returns a typed {@link AuthorizationError} on denial.
 */
export interface SimulationCommandAuthorizer {
  authorize(
    command: SimulationCommand,
  ): Promise<Result<void, AuthorizationError>>;
}

/**
 * Idempotency boundary: mutating commands "either succeed once or return the
 * original result on retry" (05-api-architecture/02_Resource_and_Command_Model.md).
 * A concrete store (with documented retention) is infrastructure and deferred.
 */
export interface IdempotencyStore {
  /** Returns the previously recorded result for a command id, or `null`. */
  recall(commandId: CommandId): Promise<CommandResult | null>;
  /** Records the result of a freshly processed command for safe retries. */
  remember(commandId: CommandId, result: CommandResult): Promise<void>;
}

/** The sequence number and resulting aggregate version for an accepted action. */
export interface ActionSequenceAllocation {
  readonly sequenceNumber: number;
  readonly aggregateVersion: number;
}

export interface AllocateActionSequenceInput {
  readonly simulationRunId: SimulationRunId;
  /** Optimistic-concurrency expectation; `null` when not version-sensitive. */
  readonly expectedVersion: number | null;
}

/**
 * @deprecated PS-ROADMAP-003: sequence allocation is performed by
 * `recordAcceptedLearnerAction` + {@link SimulationRunRepository.save}.
 * Infrastructure sequencers reject writes so they cannot compete for authority.
 */
export interface SimulationActionSequencer {
  allocate(
    input: AllocateActionSequenceInput,
  ): Promise<Result<ActionSequenceAllocation, ConcurrencyError>>;
}
