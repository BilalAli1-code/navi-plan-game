import type { PublishableDomainEvent } from "@projectsim/domain";

/**
 * Downstream event-bus sink used by the outbox relay.
 *
 * The relay claims pending outbox rows and hands their payloads to this port.
 * Production can wire a real broker; tests and local development use an
 * in-memory recording sink with optional subscribers (e.g. projection rebuild).
 *
 * Subscriber isolation contract (PS-ROADMAP-006):
 * - Authoritative outbox rows are committed before relay publish begins.
 * - Subscriber failures must not fail `publish` (so the relay can mark the
 *   authoritative outbox row published without being blocked by projections).
 * - One subscriber failure must not prevent later subscribers from receiving
 *   the same event.
 * - Projection consumers must handle their own typed failures / retries.
 */
export type EventBusSubscriber = (
  event: PublishableDomainEvent,
) => Promise<void>;

export interface EventBus {
  publish(event: PublishableDomainEvent): Promise<void>;
  subscribe(subscriber: EventBusSubscriber): void;
}

/** In-memory sink that records published events for tests and local runs. */
export interface InMemoryEventBus extends EventBus {
  readonly published: readonly PublishableDomainEvent[];
  /** Subscriber errors swallowed by publish (observability for tests). */
  readonly subscriberErrors: readonly unknown[];
}

export const createInMemoryEventBus = (): InMemoryEventBus => {
  const published: PublishableDomainEvent[] = [];
  const subscriberErrors: unknown[] = [];
  const subscribers: EventBusSubscriber[] = [];
  return {
    async publish(event) {
      published.push(event);
      for (const subscriber of subscribers) {
        try {
          await subscriber(event);
        } catch (error) {
          // Supporting subscribers must not block authoritative delivery.
          subscriberErrors.push(error);
        }
      }
    },
    subscribe(subscriber) {
      subscribers.push(subscriber);
    },
    get published() {
      return published;
    },
    get subscriberErrors() {
      return subscriberErrors;
    },
  };
};
