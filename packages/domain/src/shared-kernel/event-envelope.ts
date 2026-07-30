import type {
  ActorId,
  CausationId,
  CorrelationId,
  EventId,
  SimulationRunId,
  TenantId,
} from "./ids";
import type { IsoTimestamp } from "./time";

/**
 * Canonical domain-event envelope (shared kernel).
 *
 * Field-for-field this mirrors the canonical envelope in
 * docs/architecture/02-domain-model/13_Domain_Event_Catalog.md, with branded
 * identifiers applied where the shared kernel defines them.
 *
 * @typeParam TType    Literal event-type discriminant (e.g. `"SimulationActionAccepted"`).
 * @typeParam TPayload Event-specific payload shape.
 */
export interface DomainEvent<TType extends string, TPayload> {
  readonly eventId: EventId;
  readonly eventType: TType;
  readonly eventVersion: number;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly aggregateVersion: number;
  readonly sequenceNumber: number;
  readonly occurredAt: IsoTimestamp;
  readonly recordedAt: IsoTimestamp;
  readonly actorId: ActorId | null;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId | null;
  readonly tenantId: TenantId | null;
  readonly simulationRunId: SimulationRunId | null;
  readonly payload: TPayload;
}
