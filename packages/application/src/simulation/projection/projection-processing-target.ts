import type { WorkplaceProjectionType } from "@projectsim/domain";
import type { ProjectionTargetErrorClassification } from "./relay-retry-policy";

export type ProjectionProcessingTargetStatus =
  "pending" | "claimed" | "succeeded" | "retrying" | "exhausted";

/**
 * One registered projection instance affected by one outbox event.
 * Identity: (tenantId, eventId, projectionType).
 */
export interface ProjectionProcessingTarget {
  readonly tenantId: string;
  readonly eventId: string;
  readonly projectionType: WorkplaceProjectionType;
  readonly simulationRunId: string;
  readonly eventType: string;
  readonly status: ProjectionProcessingTargetStatus;
  readonly attemptCount: number;
  readonly nextAttemptAt: string;
  readonly claimedBy: string | null;
  readonly claimedAt: string | null;
  readonly claimExpiresAt: string | null;
  readonly completedAt: string | null;
  readonly exhaustedAt: string | null;
  readonly lastErrorClassification: ProjectionTargetErrorClassification | null;
  readonly lastErrorSummary: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProjectionProcessingTargetIdentity {
  readonly tenantId: string;
  readonly eventId: string;
  readonly projectionType: WorkplaceProjectionType;
}

export const projectionProcessingTargetKey = (
  identity: ProjectionProcessingTargetIdentity,
): string =>
  `${identity.tenantId}\0${identity.eventId}\0${identity.projectionType}`;

export interface MaterializeProjectionTargetInput {
  readonly tenantId: string;
  readonly eventId: string;
  readonly projectionType: WorkplaceProjectionType;
  readonly simulationRunId: string;
  readonly eventType: string;
}

export interface ClaimProjectionTargetsInput {
  readonly workerId: string;
  readonly batchSize: number;
  readonly claimLeaseMs: number;
  readonly now: Date;
}

export interface MarkProjectionTargetSucceededInput {
  readonly eventId: string;
  readonly projectionType: WorkplaceProjectionType;
  readonly attemptCount: number;
  readonly now: Date;
}

export interface MarkProjectionTargetFailedInput {
  readonly eventId: string;
  readonly projectionType: WorkplaceProjectionType;
  readonly attemptCount: number;
  readonly nextAttemptAt: Date | null;
  readonly exhausted: boolean;
  readonly classification: ProjectionTargetErrorClassification;
  readonly summary: string;
  readonly now: Date;
}

export interface ManualRetryProjectionTargetInput {
  readonly eventId: string;
  readonly projectionType: WorkplaceProjectionType;
  readonly now: Date;
}

export interface ProjectionTargetQueueSummary {
  readonly pending: number;
  readonly claimed: number;
  readonly retrying: number;
  readonly exhausted: number;
  readonly succeeded: number;
  readonly oldestPendingAt: string | null;
}

/**
 * Port for durable per-projection processing receipts (PS-ROADMAP-023).
 */
export interface ProjectionProcessingTargetRepository {
  materializeTargets(
    targets: readonly MaterializeProjectionTargetInput[],
  ): Promise<void>;
  getTarget(
    eventId: string,
    projectionType: WorkplaceProjectionType,
  ): Promise<ProjectionProcessingTarget | null>;
  listFailedTargets(input: {
    readonly limit: number;
    readonly offset: number;
    readonly simulationRunId?: string;
    readonly projectionType?: WorkplaceProjectionType;
  }): Promise<readonly ProjectionProcessingTarget[]>;
  claimTargets(
    input: ClaimProjectionTargetsInput,
  ): Promise<readonly ProjectionProcessingTarget[]>;
  markSucceeded(input: MarkProjectionTargetSucceededInput): Promise<void>;
  markFailed(input: MarkProjectionTargetFailedInput): Promise<void>;
  manualRetry(input: ManualRetryProjectionTargetInput): Promise<{
    readonly ok: boolean;
    readonly priorStatus: ProjectionProcessingTargetStatus | null;
  }>;
  allTargetsSucceeded(eventId: string): Promise<boolean>;
  queueSummary(): Promise<ProjectionTargetQueueSummary>;
  countByStatusForRun(input: {
    readonly simulationRunId: string;
    readonly projectionType?: WorkplaceProjectionType;
  }): Promise<ProjectionTargetQueueSummary>;
}
