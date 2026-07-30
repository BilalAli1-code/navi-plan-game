import type { ProjectionDomainEvent } from "../../projection/events";
import type { SimulationDomainEvent } from "./events";

/** Events that may enter the outbox / EventBus (Simulation + Projection). */
export type PublishableDomainEvent =
  SimulationDomainEvent | ProjectionDomainEvent;

/**
 * Event emission seam (port).
 *
 * `DomainEventPublisher` is a domain-owned interface (a port). Application
 * services / the simulation runtime depend on THIS abstraction to emit events;
 * infrastructure supplies the implementation (e.g. a transactional-outbox
 * publisher — see docs/architecture/03-system-architecture/07_Event_Processing_Architecture.md).
 *
 * Because the contract is expressed over the {@link SimulationDomainEvent} union
 * (an abstraction), command handlers never depend on concrete event object
 * construction: they build events via the factories in `factory.ts` and hand
 * them to a publisher. Growing the event set later therefore requires no change
 * to handler control flow — preserving clean DDD boundaries.
 *
 * Projection technical events may also be published through this seam; they are
 * not Simulation aggregate pending events.
 */
export interface DomainEventPublisher {
  /**
   * Publish domain events in aggregate-sequence order. Implementations must be
   * idempotent and honor at-least-once delivery
   * (13_Domain_Event_Catalog.md — Delivery Semantics).
   */
  publish(events: readonly PublishableDomainEvent[]): void | Promise<void>;
}

/**
 * ADR (MVP) — Rejection is a command result, not a domain event.
 *
 * A rejected command leaves authoritative state unchanged
 * (06_Command_Processing_Architecture.md), so rejection is represented by the
 * `CommandRejected` variant of `CommandResult` (a typed `CommandError`) and is
 * NOT emitted as a domain event in the MVP. `SimulationActionRejected` (present
 * in the Domain Event Catalog) is intentionally not implemented here.
 *
 * TODO(next-domain-model-iteration / event-sourcing): if future auditing,
 * analytics, or event-sourced replay require an explicit, durable rejection
 * signal, introduce a `SimulationActionRejected` event:
 *   1. add `SimulationActionRejectedPayload` (`payloads.ts`) + alias (`events.ts`),
 *   2. add `createSimulationActionRejectedEvent` (`factory.ts`),
 *   3. publish it via this same {@link DomainEventPublisher} port.
 * No new port or handler-flow change is required — this interface is the seam.
 */
