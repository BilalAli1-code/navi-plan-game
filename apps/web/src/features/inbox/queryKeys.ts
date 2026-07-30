/**
 * TanStack Query key for Inbox projection (PS-ROADMAP-014).
 * Run-scoped; never includes browser-supplied tenant identity.
 */
export const inboxQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["inbox", string, string] => ["inbox", actorId, simulationRunId];
