/**
 * Authoritative crisis runtime state (BC-006 Workstream 4).
 *
 * Additive schema-8 field on SimulationState. Triggers once; resolution is
 * determined by authored `resolutionWhen` against authoritative facts.
 */

import {
  ruleViolationError,
  type RuleViolationError,
} from "../../shared-kernel/errors";
import type { ChapterId } from "../../shared-kernel/ids";
import { err, ok, type Result } from "../../shared-kernel/result";
import type { IsoTimestamp } from "../../shared-kernel/time";

export const crisisRuntimeStatuses = ["triggered", "resolved"] as const;
export type CrisisRuntimeStatus = (typeof crisisRuntimeStatuses)[number];

export const isCrisisRuntimeStatus = (
  value: string,
): value is CrisisRuntimeStatus =>
  (crisisRuntimeStatuses as readonly string[]).includes(value);

export interface CrisisRuntimeState {
  readonly crisisId: string;
  readonly chapterId: ChapterId;
  readonly status: CrisisRuntimeStatus;
  readonly triggeredAt: IsoTimestamp;
  readonly triggeredAtSequence: number;
  readonly resolvedAt: IsoTimestamp | null;
  readonly resolvedAtSequence: number | null;
  readonly contentPackageVersionId: string;
}

export const createCrisisRuntimeState = (input: {
  readonly crisisId: string;
  readonly chapterId: ChapterId;
  readonly triggeredAt: IsoTimestamp;
  readonly triggeredAtSequence: number;
  readonly contentPackageVersionId: string;
}): Result<CrisisRuntimeState, RuleViolationError> => {
  if (input.crisisId.trim().length === 0) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "CrisisRuntimeState.crisisId must be non-empty.",
      ),
    );
  }
  if (
    !Number.isInteger(input.triggeredAtSequence) ||
    input.triggeredAtSequence < 0
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "CrisisRuntimeState.triggeredAtSequence must be a non-negative integer.",
      ),
    );
  }
  return ok({
    crisisId: input.crisisId,
    chapterId: input.chapterId,
    status: "triggered",
    triggeredAt: input.triggeredAt,
    triggeredAtSequence: input.triggeredAtSequence,
    resolvedAt: null,
    resolvedAtSequence: null,
    contentPackageVersionId: input.contentPackageVersionId,
  });
};

export const resolveCrisisRuntimeState = (
  crisis: CrisisRuntimeState,
  input: {
    readonly resolvedAt: IsoTimestamp;
    readonly resolvedAtSequence: number;
  },
): Result<CrisisRuntimeState, RuleViolationError> => {
  if (crisis.status === "resolved") {
    return ok(crisis);
  }
  return ok({
    ...crisis,
    status: "resolved",
    resolvedAt: input.resolvedAt,
    resolvedAtSequence: input.resolvedAtSequence,
  });
};

export const serializeCrisisRuntimeState = (
  crisis: CrisisRuntimeState,
): Readonly<Record<string, unknown>> => ({
  crisisId: crisis.crisisId,
  chapterId: crisis.chapterId,
  status: crisis.status,
  triggeredAt: crisis.triggeredAt,
  triggeredAtSequence: crisis.triggeredAtSequence,
  resolvedAt: crisis.resolvedAt,
  resolvedAtSequence: crisis.resolvedAtSequence,
  contentPackageVersionId: crisis.contentPackageVersionId,
});

export const rehydrateCrisisRuntimeState = (
  value: unknown,
): Result<CrisisRuntimeState, RuleViolationError> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "CrisisRuntimeState must be an object.",
      ),
    );
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record.crisisId !== "string" ||
    typeof record.chapterId !== "string" ||
    typeof record.triggeredAt !== "string" ||
    typeof record.triggeredAtSequence !== "number" ||
    typeof record.contentPackageVersionId !== "string" ||
    !isCrisisRuntimeStatus(String(record.status))
  ) {
    return err(
      ruleViolationError(
        "PERSISTED_CONSEQUENCE_INVALID",
        "CrisisRuntimeState fields are incomplete or invalid.",
      ),
    );
  }
  const resolvedAt =
    record.resolvedAt === null || record.resolvedAt === undefined
      ? null
      : typeof record.resolvedAt === "string"
        ? (record.resolvedAt as IsoTimestamp)
        : null;
  const resolvedAtSequence =
    record.resolvedAtSequence === null ||
    record.resolvedAtSequence === undefined
      ? null
      : typeof record.resolvedAtSequence === "number"
        ? record.resolvedAtSequence
        : null;
  return ok({
    crisisId: record.crisisId,
    chapterId: record.chapterId as ChapterId,
    status: record.status as CrisisRuntimeStatus,
    triggeredAt: record.triggeredAt as IsoTimestamp,
    triggeredAtSequence: record.triggeredAtSequence,
    resolvedAt,
    resolvedAtSequence,
    contentPackageVersionId: record.contentPackageVersionId,
  });
};
