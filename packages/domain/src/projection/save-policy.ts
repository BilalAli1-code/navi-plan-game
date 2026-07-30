import {
  ruleViolationError,
  type RuleViolationError,
} from "../shared-kernel/errors";
import { err, ok, type Result } from "../shared-kernel/result";
import {
  compareProjectionSourcePosition,
  type ProjectionSourcePosition,
} from "./source-position";

export type ProjectionSaveDecision =
  | { readonly kind: "insert" }
  | { readonly kind: "replace" }
  | { readonly kind: "unchanged" };

export interface ProjectionSaveCandidate extends ProjectionSourcePosition {
  readonly semanticHash: string;
}

/**
 * Shared saveIfNewer decision policy for all workplace projection types.
 * Pure — no I/O. Used by memory and Postgres adapters.
 */
export const evaluateProjectionSave = (
  existing: ProjectionSaveCandidate | null,
  incoming: ProjectionSaveCandidate,
): Result<ProjectionSaveDecision, RuleViolationError> => {
  if (existing === null) {
    return ok({ kind: "insert" });
  }
  const relation = compareProjectionSourcePosition(existing, incoming);
  if (relation === "newer") {
    return err(
      ruleViolationError(
        "PROJECTION_STALE_WRITE",
        "Refusing to overwrite a newer projection with an older source position.",
      ),
    );
  }
  if (relation === "equal") {
    if (existing.semanticHash !== incoming.semanticHash) {
      return err(
        ruleViolationError(
          "PROJECTION_NONDETERMINISTIC",
          "Same source versions produced a different semantic hash.",
        ),
      );
    }
    return ok({ kind: "unchanged" });
  }
  return ok({ kind: "replace" });
};
