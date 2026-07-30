import type { Brand } from "./ids";

/**
 * An ISO-8601 timestamp string (shared kernel). Domain contracts represent time
 * as opaque ISO strings rather than `Date` objects so that serialized events and
 * commands are deterministic and framework-independent.
 */
export type IsoTimestamp = Brand<string, "IsoTimestamp">;

/** Brands a raw string as an {@link IsoTimestamp} without validating its format. */
export const asIsoTimestamp = (value: string): IsoTimestamp =>
  value as IsoTimestamp;
