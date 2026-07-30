import type {
  FieldValidationError,
  SimulationCommand,
  SimulationCommandType,
} from "@projectsim/domain";

/** The concrete command variant for a given command type. */
export type CommandOfType<TType extends SimulationCommandType> = Extract<
  SimulationCommand,
  { commandType: TType }
>;

/**
 * A small, focused handler for a single command type.
 *
 * For the MVP a handler's responsibility is schema-level validation of its own
 * payload (structural preconditions expressible without loaded aggregate
 * state). Invariant checks that require authoritative state are deferred until
 * persistence exists (see technical-debt notes on the application service).
 * Handlers own no cross-cutting concerns and emit no events themselves — the
 * application service coordinates sequencing, event creation, and publication.
 */
export interface SimulationCommandHandler<
  TType extends SimulationCommandType = SimulationCommandType,
> {
  readonly commandType: TType;
  validate(command: CommandOfType<TType>): readonly FieldValidationError[];
}

/** A registry providing exactly one handler per command type (exhaustive). */
export type SimulationCommandHandlerRegistry = {
  readonly [TType in SimulationCommandType]: SimulationCommandHandler<TType>;
};

// --- Small, reusable validation helpers (composition over duplication) ---

export const requireNonEmpty = (
  value: string,
  path: string,
): FieldValidationError | null =>
  value.trim().length === 0
    ? { path, reason: "required", message: `${path} must not be empty.` }
    : null;

export const requirePositive = (
  value: number,
  path: string,
): FieldValidationError | null =>
  Number.isFinite(value) && value > 0
    ? null
    : {
        path,
        reason: "invalid",
        message: `${path} must be greater than zero.`,
      };

export const requireNonEmptyArray = (
  value: readonly unknown[],
  path: string,
): FieldValidationError | null =>
  value.length === 0
    ? {
        path,
        reason: "required",
        message: `${path} must contain at least one item.`,
      }
    : null;

/** Collects non-null field errors into a readonly list. */
export const collectFieldErrors = (
  ...candidates: readonly (FieldValidationError | null)[]
): readonly FieldValidationError[] =>
  candidates.filter((error): error is FieldValidationError => error !== null);
