import type {
  ActorId,
  AuthorizationError,
  Result,
  SimulationRunId,
} from "@projectsim/domain";

/** Read authorization for simulation projections (typically simulation.run.view). */
export interface SimulationProjectionAuthorizer {
  authorizeView(input: {
    readonly actorId: ActorId;
    readonly simulationRunId: SimulationRunId;
  }): Promise<Result<void, AuthorizationError>>;
}
