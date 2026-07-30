import type {
  DomainEventPublisher,
  PublishableDomainEvent,
} from "@projectsim/domain";

/**
 * In-memory {@link DomainEventPublisher} that also records what it published.
 * Exposes the published log for observability and integration tests.
 */
export interface InMemoryDomainEventPublisher extends DomainEventPublisher {
  /** Events published so far, in publication order. */
  readonly published: readonly PublishableDomainEvent[];
}

/**
 * Concrete infrastructure event publisher for the MVP.
 *
 * Implements the domain `DomainEventPublisher` port for Simulation and
 * Projection technical events. Can be replaced by a transactional-outbox
 * publisher without application-layer changes.
 */
export const createInMemoryDomainEventPublisher =
  (): InMemoryDomainEventPublisher => {
    const log: PublishableDomainEvent[] = [];

    return {
      async publish(events) {
        log.push(...events);
      },
      get published() {
        return log;
      },
    };
  };
