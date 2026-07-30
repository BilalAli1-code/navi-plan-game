/** Stable run-scoped query keys shared across Decision surfaces. */

export const simulationProjectionQueryKey = (
  simulationRunId: string,
  actorId: string,
) => ["simulation-projection", actorId, simulationRunId] as const;
