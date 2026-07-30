import { describe, expect, it } from "vitest";
import {
  SIMULATION_PROJECTION_TYPE,
  WORKPLACE_PROJECTION_TYPES,
  deriveProjectionId,
  deriveSimulationProjectionId,
  evaluateProjectionSave,
  isWorkplaceProjectionType,
} from "./index";

describe("workplace projection infrastructure (PS-ROADMAP-010)", () => {
  it("reserves the ADR-006 workplace projection taxonomy", () => {
    expect(WORKPLACE_PROJECTION_TYPES).toContain("simulation");
    expect(WORKPLACE_PROJECTION_TYPES).toContain("mission_control");
    expect(WORKPLACE_PROJECTION_TYPES).toContain("decision_log");
    expect(isWorkplaceProjectionType("simulation")).toBe(true);
    expect(isWorkplaceProjectionType("not_a_type")).toBe(false);
  });

  it("derives projection ids with the shared envelope pattern", () => {
    expect(
      deriveProjectionId({
        projectionType: "mission_control",
        tenantId: "tenant_1",
        simulationRunId: "run_1",
      }),
    ).toBe("projection:mission_control:tenant_1:run_1");
    expect(
      deriveSimulationProjectionId({
        tenantId: "tenant_1",
        simulationRunId: "run_1",
      }),
    ).toBe("projection:simulation:tenant_1:run_1");
    expect(SIMULATION_PROJECTION_TYPE).toBe("simulation");
  });

  it("applies shared saveIfNewer policy", () => {
    const base = {
      sourceAggregateVersion: 2,
      sourceStateVersion: 2,
      sourceActionSequence: 1,
      semanticHash: "fnv1a64:v1:aaaaaaaaaaaaaaaa",
    };
    const insert = evaluateProjectionSave(null, base);
    expect(insert.ok && insert.value.kind).toBe("insert");

    const unchanged = evaluateProjectionSave(base, base);
    expect(unchanged.ok && unchanged.value.kind).toBe("unchanged");

    const replace = evaluateProjectionSave(base, {
      ...base,
      sourceAggregateVersion: 3,
      semanticHash: "fnv1a64:v1:bbbbbbbbbbbbbbbb",
    });
    expect(replace.ok && replace.value.kind).toBe("replace");

    const stale = evaluateProjectionSave(base, {
      ...base,
      sourceAggregateVersion: 1,
    });
    expect(stale.ok).toBe(false);

    const nondeterministic = evaluateProjectionSave(base, {
      ...base,
      semanticHash: "fnv1a64:v1:cccccccccccccccc",
    });
    expect(nondeterministic.ok).toBe(false);
  });
});
