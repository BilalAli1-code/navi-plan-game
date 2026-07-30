import { concurrencyError, err } from "@projectsim/domain";
import type { SimulationActionSequencer } from "@projectsim/application";
import type { SimulationStateRepository } from "./simulation-state-repository";

/**
 * @deprecated PS-ROADMAP-003: sequence advancement belongs inside
 * `recordAcceptedLearnerAction` + {@link SimulationRunRepository.save}.
 * This adapter always rejects so it cannot write a competing snapshot.
 *
 * Removal path: drop exports after confirming no external consumers.
 */
export const createSimulationActionSequencer = (
  _repository?: SimulationStateRepository,
): SimulationActionSequencer => ({
  async allocate({ expectedVersion }) {
    void _repository;
    return err(concurrencyError(expectedVersion ?? 0, expectedVersion ?? 0));
  },
});
