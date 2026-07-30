import { describe, expect, it, vi } from "vitest";
import type { ProjectionApiResult } from "../../api/client";
import { simulationProjectionQueryKey } from "./queryKeys";
import { toDecisionWorkspaceViewModel } from "./useSimulationProjection";

const sampleProjection = (): ProjectionApiResult => ({
  data: {
    simulationRunId: "run_1",
    learnerId: "learner_1",
    contentPackageVersionId: "cpv_1",
    sourceAggregateVersion: 2,
    sourceStateVersion: 0,
    sourceActionSequence: 0,
    generatedAt: "2026-07-25T12:00:00.000Z",
    projectionSchemaVersion: 1,
    run: { status: "active" },
    project: {
      status: "initiated",
      metrics: [{ metricKey: "budget", value: 100, unit: "USD" }],
    },
    availableDecisions: [
      {
        decisionDefinitionId: "decision_1",
        title: "Scaffold Decision",
        prompt: "Choose how to proceed.",
        description: null,
        expiresAt: null,
        authoredOrder: 0,
        options: [
          {
            optionId: "option_a",
            label: "Conservative option",
            authoredOrder: 0,
          },
        ],
      },
    ],
    decisionHistory: [],
  },
  meta: {
    requestId: "req_1",
    correlationId: "corr_1",
    apiVersion: "v1",
    projectionSchemaVersion: 1,
    sourceAggregateVersion: 2,
    freshness: "current",
    generatedAt: "2026-07-25T12:00:00.000Z",
  },
});

describe("useSimulationProjection contracts", () => {
  it("maps API projection envelopes into workspace view models without inventing state", () => {
    const model = toDecisionWorkspaceViewModel(sampleProjection());
    expect(model.freshness).toBe("current");
    expect(model.sourceAggregateVersion).toBe(2);
    expect(model.availableDecisions).toHaveLength(1);
    expect(model.decisionHistory).toEqual([]);
    expect(model.metrics[0]?.metricKey).toBe("budget");
  });

  it("uses a stable run- and actor-scoped query key", () => {
    expect(simulationProjectionQueryKey("run_1", "actor_1")).toEqual([
      "simulation-projection",
      "actor_1",
      "run_1",
    ]);
    expect(simulationProjectionQueryKey("run_1", "actor_1")).not.toEqual(
      simulationProjectionQueryKey("run_1", "actor_2"),
    );
  });

  it("retains rebuild_failed freshness from the envelope", () => {
    const result = sampleProjection();
    const failed: ProjectionApiResult = {
      ...result,
      meta: { ...result.meta, freshness: "rebuild_failed" },
    };
    expect(toDecisionWorkspaceViewModel(failed).freshness).toBe(
      "rebuild_failed",
    );
  });

  it("does not create a parallel global projection store", () => {
    const setGlobal = vi.fn();
    const model = toDecisionWorkspaceViewModel(sampleProjection());
    expect(setGlobal).not.toHaveBeenCalled();
    expect(model.simulationRunId).toBe("run_1");
  });
});
