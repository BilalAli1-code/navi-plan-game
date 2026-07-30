/** Stable run-scoped query keys for Decision Log (PS-ROADMAP-012). */

export const decisionLogQueryKey = (simulationRunId: string, actorId: string) =>
  ["decision-log", actorId, simulationRunId] as const;
