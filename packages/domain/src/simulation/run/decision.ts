import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type {
  ActionRecordId,
  ActorId,
  DecisionId,
  DecisionOptionId,
  DecisionOutcomeId,
  DecisionRecordId,
} from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";

/**
 * Authoritative Decision record inside SimulationState.
 *
 * PS-ROADMAP-004: submitted. PS-ROADMAP-005: submitted → resolved.
 * Selected option / submitter / timestamps / sourceActionId remain immutable.
 */

export const decisionStatuses = ["submitted", "resolved"] as const;
export type DecisionStatus = (typeof decisionStatuses)[number];

export const isDecisionStatus = (value: string): value is DecisionStatus =>
  (decisionStatuses as readonly string[]).includes(value);

export interface Decision {
  readonly id: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionId: DecisionOptionId;
  readonly submittedBy: ActorId;
  readonly submittedAt: IsoTimestamp;
  readonly sourceActionId: ActionRecordId;
  /** SimulationState.stateVersion evaluated at submission time (pre-append). */
  readonly contextStateVersion: number;
  readonly status: DecisionStatus;
  readonly outcomeId: DecisionOutcomeId | null;
  readonly resolvedAt: IsoTimestamp | null;
}

export interface CreateDecisionInput {
  readonly id: DecisionRecordId;
  readonly decisionDefinitionId: DecisionId;
  readonly selectedOptionId: DecisionOptionId;
  readonly submittedBy: ActorId;
  readonly submittedAt: IsoTimestamp;
  readonly sourceActionId: ActionRecordId;
  readonly contextStateVersion: number;
}

const requireNonEmpty = (
  value: string,
  field: string,
): Result<string, RuleViolationError> => {
  if (value.trim().length === 0) {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        `Decision.${field} must be a non-empty string.`,
        { field },
      ),
    );
  }
  return ok(value);
};

/** Construct a new immutable Decision in `submitted` status. */
export const createDecision = (
  input: CreateDecisionInput,
): Result<Decision, RuleViolationError> => {
  for (const [field, value] of [
    ["id", input.id],
    ["decisionDefinitionId", input.decisionDefinitionId],
    ["selectedOptionId", input.selectedOptionId],
    ["submittedBy", input.submittedBy],
    ["sourceActionId", input.sourceActionId],
  ] as const) {
    const checked = requireNonEmpty(value, field);
    if (!checked.ok) {
      return checked;
    }
  }
  if (
    !Number.isInteger(input.contextStateVersion) ||
    input.contextStateVersion < 0
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Decision.contextStateVersion must be an integer >= 0.",
        { contextStateVersion: input.contextStateVersion },
      ),
    );
  }
  return ok({
    id: input.id,
    decisionDefinitionId: input.decisionDefinitionId,
    selectedOptionId: input.selectedOptionId,
    submittedBy: input.submittedBy,
    submittedAt: input.submittedAt,
    sourceActionId: input.sourceActionId,
    contextStateVersion: input.contextStateVersion,
    status: "submitted",
    outcomeId: null,
    resolvedAt: null,
  });
};

/**
 * Replace a submitted Decision with an immutable resolved representation.
 * Does not mutate the original object.
 */
export const markDecisionResolved = (
  decision: Decision,
  input: {
    readonly outcomeId: DecisionOutcomeId;
    readonly resolvedAt: IsoTimestamp;
  },
): Result<Decision, RuleViolationError> => {
  if (decision.status === "resolved") {
    return err(
      ruleViolationError(
        "DECISION_ALREADY_RESOLVED",
        `Decision '${decision.id}' is already resolved.`,
        { decisionRecordId: decision.id, outcomeId: decision.outcomeId },
      ),
    );
  }
  if (input.outcomeId.trim().length === 0) {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Resolved Decision requires a non-empty outcomeId.",
      ),
    );
  }
  return ok({
    ...decision,
    status: "resolved",
    outcomeId: input.outcomeId,
    resolvedAt: input.resolvedAt,
  });
};

/**
 * Rehydrate a persisted Decision. Validates fields; produces no events and
 * performs no eligibility evaluation.
 */
export const rehydrateDecision = (
  value: unknown,
): Result<Decision, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Persisted Decision must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Persisted Decision.id is required.",
      ),
    );
  }
  if (typeof record.decisionDefinitionId !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Persisted Decision.decisionDefinitionId is required.",
      ),
    );
  }
  if (typeof record.selectedOptionId !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Persisted Decision.selectedOptionId is required.",
      ),
    );
  }
  if (typeof record.submittedBy !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Persisted Decision.submittedBy is required.",
      ),
    );
  }
  if (typeof record.submittedAt !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Persisted Decision.submittedAt is required.",
      ),
    );
  }
  if (typeof record.sourceActionId !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Persisted Decision.sourceActionId is required.",
      ),
    );
  }
  if (
    typeof record.contextStateVersion !== "number" ||
    !Number.isInteger(record.contextStateVersion) ||
    record.contextStateVersion < 0
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Persisted Decision.contextStateVersion must be an integer >= 0.",
      ),
    );
  }
  if (typeof record.status !== "string" || !isDecisionStatus(record.status)) {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        `Persisted Decision.status '${String(record.status)}' is not supported.`,
        { status: record.status },
      ),
    );
  }

  const created = createDecision({
    id: record.id as DecisionRecordId,
    decisionDefinitionId: record.decisionDefinitionId as DecisionId,
    selectedOptionId: record.selectedOptionId as DecisionOptionId,
    submittedBy: record.submittedBy as ActorId,
    submittedAt: record.submittedAt as IsoTimestamp,
    sourceActionId: record.sourceActionId as ActionRecordId,
    contextStateVersion: record.contextStateVersion,
  });
  if (!created.ok) {
    return created;
  }

  if (record.status === "submitted") {
    if (record.outcomeId !== null && record.outcomeId !== undefined) {
      return err(
        ruleViolationError(
          "PERSISTED_DECISION_INVALID",
          "Submitted Decision must not reference an outcomeId.",
        ),
      );
    }
    return created;
  }

  if (typeof record.outcomeId !== "string" || record.outcomeId.length === 0) {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Resolved Decision requires outcomeId.",
      ),
    );
  }
  if (typeof record.resolvedAt !== "string") {
    return err(
      ruleViolationError(
        "PERSISTED_DECISION_INVALID",
        "Resolved Decision requires resolvedAt.",
      ),
    );
  }
  return markDecisionResolved(created.value, {
    outcomeId: record.outcomeId as DecisionOutcomeId,
    resolvedAt: record.resolvedAt as IsoTimestamp,
  });
};

export const serializeDecision = (
  decision: Decision,
): Readonly<Record<string, unknown>> => ({
  id: decision.id,
  decisionDefinitionId: decision.decisionDefinitionId,
  selectedOptionId: decision.selectedOptionId,
  submittedBy: decision.submittedBy,
  submittedAt: decision.submittedAt,
  sourceActionId: decision.sourceActionId,
  contextStateVersion: decision.contextStateVersion,
  status: decision.status,
  outcomeId: decision.outcomeId,
  resolvedAt: decision.resolvedAt,
});
