import {
  asActionRecordId,
  asDecisionRecordId,
  asEventId,
  asSimulationRunId,
} from "@projectsim/domain";
import type { IdentifierGenerator } from "@projectsim/application";

/**
 * Produces a process-unique opaque suffix without coupling to Node/DOM crypto
 * typings: a monotonic counter (unique within the process) combined with a
 * short random component. Sufficient for the in-memory MVP; a UUID-based
 * generator can replace it later behind the same port.
 */
const createUniqueSuffix = (): (() => string) => {
  let counter = 0;
  return () => {
    counter += 1;
    const random = Math.random().toString(36).slice(2, 8);
    return `${counter.toString(36)}${random}`;
  };
};

/**
 * Concrete {@link IdentifierGenerator}. Identifiers are prefixed for
 * readability and unique within the running process.
 */
export const createIdentifierGenerator = (): IdentifierGenerator => {
  const nextSuffix = createUniqueSuffix();
  return {
    nextEventId: () => asEventId(`evt_${nextSuffix()}`),
    nextActionRecordId: () => asActionRecordId(`action_${nextSuffix()}`),
    nextSimulationRunId: () => asSimulationRunId(`run_${nextSuffix()}`),
    nextDecisionRecordId: () => asDecisionRecordId(`decision_${nextSuffix()}`),
  };
};
