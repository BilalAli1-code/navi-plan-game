/**
 * SimulationRun lifecycle statuses.
 *
 * Canonical transitions: docs/architecture/02-domain-model/14_Canonical_State_Machines.md
 * (Created/Active/Paused/Completed/Failed/Archived).
 *
 * Architecture gap: the GitHub issue also requires a persisted/rehydratable
 * `cancelled` status, but PS-DOM-014 does not define Cancel for SimulationRun
 * and there is no CancelSimulationRun / SimulationRunCancelled command/event.
 * `cancelled` is therefore loadable only — no transition into it is provided.
 */

export const simulationRunStatuses = [
  "created",
  "active",
  "paused",
  "completed",
  "cancelled",
  "failed",
  "archived",
] as const;

export type SimulationRunStatus = (typeof simulationRunStatuses)[number];

export const isSimulationRunStatus = (
  value: string,
): value is SimulationRunStatus =>
  (simulationRunStatuses as readonly string[]).includes(value);

/** Statuses that reject normal learner actions. */
export const isLearnerActionAllowed = (status: SimulationRunStatus): boolean =>
  status === "active";

export const isTerminalStatus = (status: SimulationRunStatus): boolean =>
  status === "completed" || status === "archived" || status === "cancelled";
