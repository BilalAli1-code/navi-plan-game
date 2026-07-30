export const documentsQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["documents", string, string] => [
  "documents",
  actorId,
  simulationRunId,
];
