export const activitiesQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["activities", string, string] => [
  "activities",
  actorId,
  simulationRunId,
];
