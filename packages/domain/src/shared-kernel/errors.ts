/**
 * Domain error contracts (shared kernel).
 *
 * The base {@link DomainError} shape follows
 * docs/architecture/03-system-architecture/06_Command_Processing_Architecture.md.
 * Canonical error codes are taken from
 * docs/architecture/05-api-architecture/12_Error_Handling.md. These are
 * platform-wide contracts and contain no business-case-specific logic.
 */

/** Base error shape shared by all domain errors. */
export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
}

/** A single field-level validation failure. */
export interface FieldValidationError {
  /** Dot/bracket path to the offending field, e.g. `payload.rationale`. */
  readonly path: string;
  /** Stable machine-readable reason, e.g. `required`, `too_long`, `invalid`. */
  readonly reason: string;
  /** Human-readable, audience-safe message. */
  readonly message: string;
}

/**
 * Command rejected because its structure/values failed schema validation.
 * Validation errors always identify the offending fields
 * (12_Error_Handling.md rule 5) and are never retryable as-is.
 */
export interface ValidationError extends DomainError {
  readonly kind: "validation";
  readonly code: "COMMAND_VALIDATION_FAILED";
  readonly retryable: false;
  readonly fieldErrors: readonly FieldValidationError[];
}

/** Optimistic-concurrency conflict (`If-Match` / `expectedVersion` mismatch). */
export interface ConcurrencyError extends DomainError {
  readonly kind: "concurrency";
  readonly code: "AGGREGATE_VERSION_CONFLICT";
  readonly retryable: false;
  readonly expectedVersion: number;
  readonly actualVersion: number;
}

/** An idempotency key was reused with a different payload. */
export interface IdempotencyError extends DomainError {
  readonly kind: "idempotency";
  readonly code: "IDEMPOTENCY_KEY_REUSED";
  readonly retryable: false;
}

/** The actor is not permitted to run the command in this tenant/context. */
export interface AuthorizationError extends DomainError {
  readonly kind: "authorization";
  readonly code: "TENANT_ACCESS_DENIED" | "PERMISSION_DENIED";
  readonly retryable: false;
}

/** Canonical business-rule rejection codes (12_Error_Handling.md). */
export type RuleViolationCode =
  | "SIMULATION_RUN_NOT_ACTIVE"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "CONTENT_PACKAGE_VERSION_IMMUTABLE"
  | "SIMULATION_RUN_REHYDRATION_FAILED"
  | "SIMULATION_RUN_LEGACY_INCOMPLETE"
  | "SIMULATION_RUN_NOT_FOUND"
  | "DECISION_ALREADY_RESOLVED"
  | "DECISION_NOT_FOUND"
  | "DECISION_NOT_SUBMITTED"
  | "DECISION_OUTCOME_ALREADY_EXISTS"
  | "DECISION_DEFINITION_NOT_FOUND"
  | "DECISION_OPTION_NOT_FOUND"
  | "DECISION_OPTION_MISMATCH"
  | "DECISION_NOT_ELIGIBLE"
  | "DECISION_PREREQUISITES_NOT_SATISFIED"
  | "DECISION_EXPIRED"
  | "DECISION_ALREADY_SUBMITTED"
  | "DECISION_SOURCE_ACTION_DUPLICATE"
  | "CONTENT_DEFINITION_NOT_FOUND"
  | "CONTENT_VERSION_MISMATCH"
  | "RESOLVER_VERSION_UNSUPPORTED"
  | "DECISION_OUTCOME_DEFINITION_INVALID"
  | "CONSEQUENCE_DEFINITION_INVALID"
  | "CONSEQUENCE_TYPE_UNSUPPORTED"
  | "CONSEQUENCE_TARGET_INVALID"
  | "CONSEQUENCE_ALREADY_APPLIED"
  | "CONSEQUENCE_REFERENCE_INVALID"
  | "METRIC_NOT_FOUND"
  | "METRIC_BOUNDS_EXCEEDED"
  | "PROJECT_STATE_TRANSITION_INVALID"
  | "SCHEDULED_EVENT_INSTRUCTION_INVALID"
  | "PERSISTED_DECISION_INVALID"
  | "PERSISTED_OUTCOME_INVALID"
  | "PERSISTED_CONSEQUENCE_INVALID"
  | "LEARNER_MESSAGE_CONTENT_INVALID"
  | "LEARNER_MESSAGE_OCCURRENCE_INVALID"
  | "LEARNER_MESSAGE_SEQUENCE_INVALID"
  | "LEARNER_MESSAGE_OCCURRENCE_CONFLICT"
  | "CHAPTER_COMPLETION_REQUIREMENTS_NOT_MET"
  | "CHAPTER_ALREADY_COMPLETED"
  | "MEETING_CONTENT_INVALID"
  | "MEETING_OCCURRENCE_INVALID"
  | "MEETING_SEQUENCE_INVALID"
  | "MEETING_OCCURRENCE_CONFLICT"
  | "MEETING_NOT_FOUND"
  | "MEETING_TRANSITION_INVALID"
  | "STAKEHOLDER_PROFILE_INVALID"
  | "STAKEHOLDER_DEFINITION_INVALID"
  | "STAKEHOLDER_IDENTITY_INVALID"
  | "STAKEHOLDER_IDENTITY_CONFLICT"
  | "STAKEHOLDER_SEQUENCE_INVALID"
  | "STAKEHOLDER_OCCURRENCE_INVALID"
  | "STAKEHOLDER_NOT_FOUND"
  | "STAKEHOLDER_CONVERSATION_IDENTITY_INVALID"
  | "STAKEHOLDER_CONVERSATION_IDENTITY_CONFLICT"
  | "STAKEHOLDER_CONVERSATION_INVALID"
  | "STAKEHOLDER_MESSAGE_IDENTITY_INVALID"
  | "STAKEHOLDER_MESSAGE_IDENTITY_CONFLICT"
  | "STAKEHOLDER_MESSAGE_SEQUENCE_INVALID"
  | "STAKEHOLDER_MESSAGE_DIRECTION_INVALID"
  | "STAKEHOLDER_MESSAGE_AUTHOR_INVALID"
  | "STAKEHOLDER_MESSAGE_CONTENT_INVALID"
  | "STAKEHOLDER_MESSAGE_OCCURRENCE_INVALID"
  | "STAKEHOLDER_MESSAGE_CONVERSATION_MISMATCH"
  | "STAKEHOLDER_MESSAGE_STAKEHOLDER_MISMATCH"
  | "DOCUMENT_CONTENT_INVALID"
  | "DOCUMENT_DEFINITION_INVALID"
  | "DOCUMENT_IDENTITY_INVALID"
  | "DOCUMENT_IDENTITY_CONFLICT"
  | "DOCUMENT_SEQUENCE_INVALID"
  | "DOCUMENT_OCCURRENCE_INVALID"
  | "DOCUMENT_NOT_FOUND"
  | "NOTIFICATION_CONTENT_INVALID"
  | "NOTIFICATION_PROVENANCE_INVALID"
  | "NOTIFICATION_IDENTITY_INVALID"
  | "NOTIFICATION_IDENTITY_CONFLICT"
  | "NOTIFICATION_SEQUENCE_INVALID"
  | "NOTIFICATION_OCCURRENCE_INVALID"
  | "NOTIFICATION_NOT_FOUND"
  | "ACTIVITY_CONTENT_INVALID"
  | "ACTIVITY_PROVENANCE_INVALID"
  | "ACTIVITY_IDENTITY_INVALID"
  | "ACTIVITY_IDENTITY_CONFLICT"
  | "ACTIVITY_SEQUENCE_INVALID"
  | "ACTIVITY_COMPLETION_SEQUENCE_INVALID"
  | "ACTIVITY_COMPLETION_TIME_INVALID"
  | "ACTIVITY_ALREADY_COMPLETED"
  | "ACTIVITY_OCCURRENCE_INVALID"
  | "ACTIVITY_NOT_FOUND"
  | "ACTIVITY_NOT_AVAILABLE"
  | "CONTENT_VERSION_NOT_PUBLISHED"
  | "PROJECTION_NOT_FOUND"
  | "PROJECTION_CONTENT_UNAVAILABLE"
  | "PROJECTION_CONTENT_VERSION_MISMATCH"
  | "PROJECTION_SOURCE_INVALID"
  | "PROJECTION_SCHEMA_UNSUPPORTED"
  | "PROJECTION_STATE_UNSUPPORTED"
  | "PROJECTION_BUILD_FAILED"
  | "PROJECTION_NONDETERMINISTIC"
  | "PROJECTION_STALE_WRITE"
  | "PROJECTION_PAYLOAD_INVALID"
  | "PROJECTION_PERSISTENCE_FAILED"
  | "PROJECTION_EVENT_UNSUPPORTED"
  | "PROJECTION_REFERENCE_INVALID"
  | "PROJECTION_PROCESSING_TARGET_NOT_FOUND";

/** A valid command rejected by a domain invariant / rule. */
export interface RuleViolationError extends DomainError {
  readonly kind: "rule_violation";
  readonly code: RuleViolationCode;
}

/**
 * Discriminated union of everything that can cause a command to be rejected.
 * Discriminated on `kind` for exhaustive handling.
 */
export type CommandError =
  | ValidationError
  | ConcurrencyError
  | IdempotencyError
  | AuthorizationError
  | RuleViolationError;

export const validationError = (
  fieldErrors: readonly FieldValidationError[],
  message = "The command failed validation.",
): ValidationError => ({
  kind: "validation",
  code: "COMMAND_VALIDATION_FAILED",
  retryable: false,
  message,
  fieldErrors,
});

export const concurrencyError = (
  expectedVersion: number,
  actualVersion: number,
): ConcurrencyError => ({
  kind: "concurrency",
  code: "AGGREGATE_VERSION_CONFLICT",
  retryable: false,
  message: `Expected aggregate version ${expectedVersion} but found ${actualVersion}.`,
  expectedVersion,
  actualVersion,
});

export const ruleViolationError = (
  code: RuleViolationCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): RuleViolationError => ({
  kind: "rule_violation",
  code,
  retryable: false,
  message,
  ...(details === undefined ? {} : { details }),
});

/**
 * Thrown when a persistence adapter must surface a typed {@link CommandError}
 * across an async boundary that returns `T | null` (e.g. incomplete legacy rows).
 * Application services should catch via {@link getThrownDomainError}.
 */
export class ThrownDomainError extends Error {
  readonly domainError: CommandError;

  constructor(domainError: CommandError) {
    super(domainError.message);
    this.name = "ThrownDomainError";
    this.domainError = domainError;
  }
}

export const throwDomainError = (domainError: CommandError): never => {
  throw new ThrownDomainError(domainError);
};

export const getThrownDomainError = (error: unknown): CommandError | null =>
  error instanceof ThrownDomainError ? error.domainError : null;
