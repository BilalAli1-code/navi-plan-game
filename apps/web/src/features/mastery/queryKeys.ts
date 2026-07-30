export const masteryQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["mastery", string, string] => [
  "mastery",
  actorId,
  simulationRunId,
];
