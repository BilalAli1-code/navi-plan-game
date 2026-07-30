import type { DomainEvent } from "../shared-kernel/event-envelope";
import type {
  ActorId,
  CausationId,
  CorrelationId,
  EventId,
  SimulationRunId,
  TenantId,
} from "../shared-kernel/ids";
import type { IsoTimestamp } from "../shared-kernel/time";
import type { ProjectionHash, SimulationProjectionId } from "./ids";
import type { WorkplaceProjectionType } from "./workplace-types";

export const PROJECTION_AGGREGATE_TYPE = "ProjectionSet";
export const PROJECTION_REBUILT_EVENT_VERSION = 1;
export const PROJECTION_BUILD_FAILED_EVENT_VERSION = 1;

export interface ProjectionRebuiltPayload {
  readonly projectionId: SimulationProjectionId | string;
  readonly projectionType: WorkplaceProjectionType;
  readonly projectionSchemaVersion: number;
  readonly simulationRunId: SimulationRunId;
  readonly sourceAggregateVersion: number;
  readonly sourceStateVersion: number;
  readonly sourceActionSequence: number;
  readonly sourceEventId: EventId | null;
  readonly projectionHash: ProjectionHash;
  readonly generatedAt: IsoTimestamp;
}

export interface ProjectionBuildFailedPayload {
  readonly simulationRunId: SimulationRunId;
  readonly projectionType: WorkplaceProjectionType;
  readonly sourceAggregateVersion: number | null;
  readonly sourceStateVersion: number | null;
  readonly sourceActionSequence: number | null;
  readonly errorCode: string;
  readonly failedAt: IsoTimestamp;
  readonly retryable: boolean;
}

export type ProjectionRebuiltEvent = DomainEvent<
  "ProjectionRebuilt",
  ProjectionRebuiltPayload
>;

export type ProjectionBuildFailedEvent = DomainEvent<
  "ProjectionBuildFailed",
  ProjectionBuildFailedPayload
>;

export type ProjectionDomainEvent =
  ProjectionRebuiltEvent | ProjectionBuildFailedEvent;

export interface CreateProjectionRebuiltEventInput {
  readonly eventId: EventId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly tenantId: TenantId;
  readonly payload: ProjectionRebuiltPayload;
}

export const createProjectionRebuiltEvent = (
  input: CreateProjectionRebuiltEventInput,
): ProjectionRebuiltEvent => ({
  eventId: input.eventId,
  eventType: "ProjectionRebuilt",
  eventVersion: PROJECTION_REBUILT_EVENT_VERSION,
  aggregateId: input.payload.projectionId,
  aggregateType: PROJECTION_AGGREGATE_TYPE,
  aggregateVersion: input.payload.sourceAggregateVersion,
  sequenceNumber: input.payload.sourceActionSequence,
  occurredAt: input.occurredAt,
  recordedAt: input.recordedAt,
  actorId: input.actorId,
  correlationId: input.correlationId,
  causationId: input.causationId,
  tenantId: input.tenantId,
  simulationRunId: input.payload.simulationRunId,
  payload: input.payload,
});

export interface CreateProjectionBuildFailedEventInput {
  readonly eventId: EventId;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly tenantId: TenantId;
  readonly payload: ProjectionBuildFailedPayload;
}

export const createProjectionBuildFailedEvent = (
  input: CreateProjectionBuildFailedEventInput,
): ProjectionBuildFailedEvent => ({
  eventId: input.eventId,
  eventType: "ProjectionBuildFailed",
  eventVersion: PROJECTION_BUILD_FAILED_EVENT_VERSION,
  aggregateId: input.payload.simulationRunId,
  aggregateType: PROJECTION_AGGREGATE_TYPE,
  aggregateVersion: input.payload.sourceAggregateVersion ?? 0,
  sequenceNumber: input.payload.sourceActionSequence ?? 0,
  occurredAt: input.occurredAt,
  recordedAt: input.recordedAt,
  actorId: input.actorId,
  correlationId: input.correlationId,
  causationId: input.causationId,
  tenantId: input.tenantId,
  simulationRunId: input.payload.simulationRunId,
  payload: input.payload,
});
