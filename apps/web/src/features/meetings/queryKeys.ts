/**
 * TanStack Query key for Meetings projection (PS-ROADMAP-017).
 * Run-scoped; never includes browser-supplied tenant identity.
 */
export const meetingsQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["meetings", string, string] => [
  "meetings",
  actorId,
  simulationRunId,
];
