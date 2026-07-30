import { asIsoTimestamp } from "@projectsim/domain";
import type { Clock } from "@projectsim/application";

/**
 * System {@link Clock} backed by the standard `Date`. Kept behind the port so
 * time is injected (not read ambiently), which keeps the application layer and
 * its tests deterministic.
 */
export const createSystemClock = (): Clock => ({
  now: () => asIsoTimestamp(new Date().toISOString()),
});
