import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import { err, ok, type Result } from "../../shared-kernel/result";
import {
  isProjectStateStatus,
  type ProjectStateStatus,
} from "../content/consequence-definition";

/**
 * Authoritative project-state machine (PS-ROADMAP-005).
 *
 * PS-DOM-003 defines ProjectState as a Core Simulation aggregate content but
 * does not publish a finer-grained public status enum. The linear delivery
 * phases below are the minimum Domain-validated graph for deterministic
 * transitions in this slice (not business-case-specific fixture states).
 * Content may request a transition; it cannot bypass these invariants.
 * Expanding or renaming statuses requires an approved contract change.
 */

export interface ProjectState {
  readonly status: ProjectStateStatus;
  readonly lastReasonCode: string | null;
}

const allowedTransitions: Readonly<
  Record<ProjectStateStatus, readonly ProjectStateStatus[]>
> = {
  initiated: ["planning"],
  planning: ["executing"],
  executing: ["closing"],
  closing: ["closed"],
  closed: [],
};

export const createInitialProjectState = (): ProjectState => ({
  status: "initiated",
  lastReasonCode: null,
});

export const canTransitionProjectState = (
  from: ProjectStateStatus,
  to: ProjectStateStatus,
): boolean => allowedTransitions[from].includes(to);

export const transitionProjectState = (
  current: ProjectState,
  nextStatus: ProjectStateStatus,
  reasonCode: string,
): Result<
  {
    readonly previousStatus: ProjectStateStatus;
    readonly next: ProjectState;
  },
  RuleViolationError
> => {
  if (reasonCode.trim().length === 0) {
    return err(
      ruleViolationError(
        "CONSEQUENCE_DEFINITION_INVALID",
        "Project-state reasonCode must be a non-empty string.",
      ),
    );
  }
  if (!canTransitionProjectState(current.status, nextStatus)) {
    return err(
      ruleViolationError(
        "PROJECT_STATE_TRANSITION_INVALID",
        `Cannot transition project state from '${current.status}' to '${nextStatus}'.`,
        { from: current.status, to: nextStatus },
      ),
    );
  }
  return ok({
    previousStatus: current.status,
    next: {
      status: nextStatus,
      lastReasonCode: reasonCode,
    },
  });
};

export const serializeProjectState = (
  state: ProjectState,
): Readonly<Record<string, unknown>> => ({
  status: state.status,
  lastReasonCode: state.lastReasonCode,
});

export const rehydrateProjectState = (
  value: unknown,
): Result<ProjectState, RuleViolationError> => {
  if (value === undefined || value === null) {
    return ok(createInitialProjectState());
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        "projectState must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.status !== "string" ||
    !isProjectStateStatus(record.status)
  ) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        `Unsupported projectState.status '${String(record.status)}'.`,
      ),
    );
  }
  const lastReasonCode =
    record.lastReasonCode === undefined || record.lastReasonCode === null
      ? null
      : typeof record.lastReasonCode === "string"
        ? record.lastReasonCode
        : null;
  if (
    record.lastReasonCode !== undefined &&
    record.lastReasonCode !== null &&
    typeof record.lastReasonCode !== "string"
  ) {
    return err(
      ruleViolationError(
        "SIMULATION_RUN_REHYDRATION_FAILED",
        "projectState.lastReasonCode must be a string or null.",
      ),
    );
  }
  return ok({
    status: record.status,
    lastReasonCode,
  });
};
