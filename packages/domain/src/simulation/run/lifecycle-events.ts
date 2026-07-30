import type { DomainEvent } from "../../shared-kernel/event-envelope";
import type {
  ActorId,
  CausationId,
  ContentPackageVersionId,
  CorrelationId,
  EventId,
  SimulationRunId,
  TenantId,
} from "../../shared-kernel/ids";
import type { IsoTimestamp } from "../../shared-kernel/time";
import type { SimulationRunStatus } from "./status";

/**
 * Lifecycle events for SimulationRun (PS-DOM-013 Runtime family).
 *
 * Includes `SimulationRunArchived`, aligned with PS-DOM-003 / PS-DOM-014
 * Completed→Archived and catalog revision 1.1.
 *
 * `contentPackageVersionId` lives on the payload (not the shared DomainEvent
 * envelope) so the PS-002 envelope contract stays unchanged.
 */

export const SIMULATION_RUN_LIFECYCLE_EVENT_VERSION = 1;

export interface SimulationRunLifecyclePayload {
  readonly fromStatus: SimulationRunStatus | null;
  readonly toStatus: SimulationRunStatus;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly runtimeVersion: string;
}

export type SimulationRunCreatedEvent = DomainEvent<
  "SimulationRunCreated",
  SimulationRunLifecyclePayload
>;
export type SimulationRunStartedEvent = DomainEvent<
  "SimulationRunStarted",
  SimulationRunLifecyclePayload
>;
export type SimulationRunPausedEvent = DomainEvent<
  "SimulationRunPaused",
  SimulationRunLifecyclePayload
>;
export type SimulationRunResumedEvent = DomainEvent<
  "SimulationRunResumed",
  SimulationRunLifecyclePayload
>;
export type SimulationRunCompletedEvent = DomainEvent<
  "SimulationRunCompleted",
  SimulationRunLifecyclePayload
>;
export type SimulationRunFailedEvent = DomainEvent<
  "SimulationRunFailed",
  SimulationRunLifecyclePayload
>;
export type SimulationRunRecoveredEvent = DomainEvent<
  "SimulationRunRecovered",
  SimulationRunLifecyclePayload
>;
export type SimulationRunArchivedEvent = DomainEvent<
  "SimulationRunArchived",
  SimulationRunLifecyclePayload
>;

export type SimulationRunLifecycleEvent =
  | SimulationRunCreatedEvent
  | SimulationRunStartedEvent
  | SimulationRunPausedEvent
  | SimulationRunResumedEvent
  | SimulationRunCompletedEvent
  | SimulationRunFailedEvent
  | SimulationRunRecoveredEvent
  | SimulationRunArchivedEvent;

export type SimulationRunLifecycleEventType =
  SimulationRunLifecycleEvent["eventType"];

export interface CreateLifecycleEventInput {
  readonly eventId: EventId;
  readonly eventType: SimulationRunLifecycleEventType;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly aggregateVersion: number;
  readonly sequenceNumber: number;
  readonly actorId: ActorId | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly tenantId: TenantId;
  readonly simulationRunId: SimulationRunId;
  readonly fromStatus: SimulationRunStatus | null;
  readonly toStatus: SimulationRunStatus;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly runtimeVersion: string;
}

export const SIMULATION_RUN_AGGREGATE_TYPE = "SimulationRun";

export const createSimulationRunLifecycleEvent = (
  input: CreateLifecycleEventInput,
): SimulationRunLifecycleEvent =>
  ({
    eventId: input.eventId,
    eventType: input.eventType,
    eventVersion: SIMULATION_RUN_LIFECYCLE_EVENT_VERSION,
    aggregateId: input.simulationRunId,
    aggregateType: SIMULATION_RUN_AGGREGATE_TYPE,
    aggregateVersion: input.aggregateVersion,
    sequenceNumber: input.sequenceNumber,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    actorId: input.actorId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    tenantId: input.tenantId,
    simulationRunId: input.simulationRunId,
    payload: {
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      contentPackageVersionId: input.contentPackageVersionId,
      runtimeVersion: input.runtimeVersion,
    },
  }) as SimulationRunLifecycleEvent;
