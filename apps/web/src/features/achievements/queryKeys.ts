export const achievementsQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["achievements", string, string] => [
  "achievements",
  actorId,
  simulationRunId,
];
