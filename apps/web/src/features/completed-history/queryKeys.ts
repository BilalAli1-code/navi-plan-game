export const completedHistoryQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["completed-history", string, string] => [
  "completed-history",
  actorId,
  simulationRunId,
];
