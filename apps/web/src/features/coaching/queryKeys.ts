export const coachingQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["coaching", string, string] => [
  "coaching",
  actorId,
  simulationRunId,
];
