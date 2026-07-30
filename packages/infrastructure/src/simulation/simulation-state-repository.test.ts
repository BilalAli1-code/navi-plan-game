import { describe, expect, it } from "vitest";
import { asSimulationRunId } from "@projectsim/domain";
import { createInMemorySimulationStateRepository } from "./simulation-state-repository";

describe("InMemorySimulationStateRepository (deprecated shim)", () => {
  it("given_save_when_called_then_it_rejects_without_mutating_state", async () => {
    const repository = createInMemorySimulationStateRepository();
    const runId = asSimulationRunId("run_1");

    const saved = await repository.save(
      {
        simulationRunId: runId,
        aggregateVersion: 1,
        lastSequenceNumber: 1,
      },
      null,
    );

    expect(saved.ok).toBe(false);
    expect(await repository.load(runId)).toBeNull();
  });

  it("given_load_when_empty_then_it_returns_null", async () => {
    const repository = createInMemorySimulationStateRepository();
    expect(await repository.load(asSimulationRunId("missing"))).toBeNull();
  });
});
