export const learnerProgressionQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["learner-progression", string, string] => [
  "learner-progression",
  actorId,
  simulationRunId,
];
