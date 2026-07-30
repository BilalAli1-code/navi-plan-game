/** Stable run-scoped query keys for Mission Control (PS-ROADMAP-011). */

export const missionControlQueryKey = (
  simulationRunId: string,
  actorId: string,
) => ["mission-control", actorId, simulationRunId] as const;
