import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import { err, ok, type Result } from "../shared-kernel/result";

/**
 * Source-position comparison for projection recency (PS-ROADMAP-006).
 *
 * Primary tuple (descending newer):
 *   1. sourceAggregateVersion
 *   2. sourceStateVersion
 *   3. sourceActionSequence
 *
 * sourceEventId is for deduplication/provenance only — never lexicographic
 * chronology. Broker delivery time and generatedAt are not authoritative.
 */

export interface ProjectionSourcePosition {
  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  readonly sourceActionSequence: number;
}

export type SourcePositionRelation = "older" | "equal" | "newer";

const isNonNegativeInteger = (value: number): boolean =>
  Number.isInteger(value) && value >= 0;

export const assertProjectionSourcePosition = (
  position: ProjectionSourcePosition,
): Result<ProjectionSourcePosition, RuleViolationError> => {
  if (
    !isNonNegativeInteger(position.sourceAggregateVersion) ||
    !isNonNegativeInteger(position.sourceStateVersion) ||
    !isNonNegativeInteger(position.sourceActionSequence)
  ) {
    return err(
      ruleViolationError(
        "PROJECTION_SOURCE_INVALID",
        "Projection source versions must be non-negative integers.",
        { ...position },
      ),
    );
  }
  return ok(position);
};

export const compareProjectionSourcePosition = (
  left: ProjectionSourcePosition,
  right: ProjectionSourcePosition,
): SourcePositionRelation => {
  if (left.sourceAggregateVersion !== right.sourceAggregateVersion) {
    return left.sourceAggregateVersion < right.sourceAggregateVersion
      ? "older"
      : "newer";
  }
  if (left.sourceStateVersion !== right.sourceStateVersion) {
    return left.sourceStateVersion < right.sourceStateVersion
      ? "older"
      : "newer";
  }
  if (left.sourceActionSequence !== right.sourceActionSequence) {
    return left.sourceActionSequence < right.sourceActionSequence
      ? "older"
      : "newer";
  }
  return "equal";
};
