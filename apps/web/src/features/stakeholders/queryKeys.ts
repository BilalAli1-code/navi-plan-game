/**
 * TanStack Query key for Stakeholders projection (PS-ROADMAP-019).
 * Run-scoped; never includes browser-supplied tenant identity.
 */
export const stakeholdersQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["stakeholders", string, string] => [
  "stakeholders",
  actorId,
  simulationRunId,
];
