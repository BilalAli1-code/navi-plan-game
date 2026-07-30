import type { CommandResult } from "@projectsim/domain";
import type { IdempotencyStore } from "@projectsim/application";

/**
 * In-memory {@link IdempotencyStore} for the MVP.
 *
 * NOT durable: receipts live only in a process-local `Map` and are lost on
 * restart. Stores the receipt (`CommandResult`) of each processed command keyed
 * by command id so that a safe retry replays the original result instead of
 * re-executing. Because the application service consults `recall` before
 * publishing, a duplicate command never publishes its event twice within the
 * process lifetime.
 *
 * Duplicate-event prevention is the application service's responsibility (it
 * short-circuits on a recalled result); this store only provides in-memory
 * recall/remember. Swap for a persistent store (with documented retention)
 * without changing the application layer.
 */
export const createInMemoryIdempotencyStore = (): IdempotencyStore => {
  const receipts = new Map<string, CommandResult>();

  return {
    async recall(commandId) {
      return receipts.get(commandId) ?? null;
    },

    async remember(commandId, result) {
      receipts.set(commandId, result);
    },
  };
};
