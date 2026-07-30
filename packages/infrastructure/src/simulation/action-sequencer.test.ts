import { describe, expect, it } from "vitest";
import { asSimulationRunId } from "@projectsim/domain";
import { createSimulationActionSequencer } from "./action-sequencer";

describe("createSimulationActionSequencer (deprecated)", () => {
  it("given_allocate_when_called_then_it_rejects_without_advancing_sequence", async () => {
    const sequencer = createSimulationActionSequencer();
    const first = await sequencer.allocate({
      simulationRunId: asSimulationRunId("run_1"),
      expectedVersion: null,
    });
    const second = await sequencer.allocate({
      simulationRunId: asSimulationRunId("run_1"),
      expectedVersion: 0,
    });

    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
  });
});
