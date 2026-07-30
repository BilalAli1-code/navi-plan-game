/** In-memory event-ID inbox for projection consumer deduplication. */
export const createInMemoryProjectionEventInbox = (): {
  hasProcessedEventId: (eventId: string) => Promise<boolean>;
  rememberProcessedEventId: (eventId: string) => Promise<void>;
  readonly processed: ReadonlySet<string>;
} => {
  const processed = new Set<string>();
  return {
    async hasProcessedEventId(eventId) {
      return processed.has(eventId);
    },
    async rememberProcessedEventId(eventId) {
      processed.add(eventId);
    },
    get processed() {
      return processed;
    },
  };
};
