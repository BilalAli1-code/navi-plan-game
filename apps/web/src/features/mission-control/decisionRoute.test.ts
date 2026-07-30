import { describe, expect, it } from "vitest";
import { decisionWorkspacePath } from "./decisionRoute";

describe("decisionWorkspacePath", () => {
  it("builds a trusted Decision workspace path", () => {
    expect(decisionWorkspacePath("run_1")).toBe("/app/runs/run_1/decisions");
    expect(decisionWorkspacePath("run_1", "decision_1")).toBe(
      "/app/runs/run_1/decisions?decision=decision_1",
    );
  });

  it("encodes run and decision identifiers", () => {
    expect(decisionWorkspacePath("run/odd", "dec a")).toBe(
      "/app/runs/run%2Fodd/decisions?decision=dec%20a",
    );
  });
});
