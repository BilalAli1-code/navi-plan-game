export const notificationsQueryKey = (
  simulationRunId: string,
  actorId: string,
): readonly ["notifications", string, string] => [
  "notifications",
  actorId,
  simulationRunId,
];
