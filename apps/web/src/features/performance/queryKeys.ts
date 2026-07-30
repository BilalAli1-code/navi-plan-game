export const performanceQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["performance", string, string] => [
  "performance",
  actorId,
  simulationRunId,
];
