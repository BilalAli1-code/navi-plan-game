import { describe, expect, it } from "vitest";
import {
  e2eSeamsAllowedInProcess,
  filterAllowedCapabilities,
  globalE2eResetAllowed,
  isFixtureId,
  requireE2eSeamSecret,
} from "./seam-guard";

describe("E2E seam-guard", () => {
  it("accepts stable fixture identifiers and rejects unsafe values", () => {
    expect(isFixtureId("tenant_e2e_1")).toBe(true);
    expect(isFixtureId("run-abc_01")).toBe(true);
    expect(isFixtureId("a")).toBe(false);
    expect(isFixtureId("")).toBe(false);
    expect(isFixtureId("../etc/passwd")).toBe(false);
    expect(isFixtureId("tenant id")).toBe(false);
    expect(isFixtureId("x".repeat(129))).toBe(false);
  });

  it("allows only known simulation capabilities", () => {
    expect(
      filterAllowedCapabilities([
        "simulation.run.view",
        "simulation.run.start",
        "simulation.projection.ops",
      ]),
    ).toEqual([
      "simulation.run.view",
      "simulation.run.start",
      "simulation.projection.ops",
    ]);
    expect(filterAllowedCapabilities(["admin:all"])).toBeNull();
    expect(
      filterAllowedCapabilities(["simulation.run.view", "admin:all"]),
    ).toBeNull();
  });

  it("requires non-production NODE_ENV and explicit E2E flag", () => {
    expect(
      e2eSeamsAllowedInProcess({
        NODE_ENV: "development",
        PROJECTSIM_ENABLE_E2E_SEAMS: "1",
      }),
    ).toBe(true);
    expect(
      e2eSeamsAllowedInProcess({
        NODE_ENV: "production",
        PROJECTSIM_ENABLE_E2E_SEAMS: "1",
      }),
    ).toBe(false);
    expect(
      e2eSeamsAllowedInProcess({
        NODE_ENV: "development",
        PROJECTSIM_ENABLE_E2E_SEAMS: "0",
      }),
    ).toBe(false);
  });

  it("requires the server-side seam secret header", () => {
    const env = { PROJECTSIM_E2E_SEAM_SECRET: "ps008-e2e-seam-secret" };
    expect(requireE2eSeamSecret("ps008-e2e-seam-secret", env).ok).toBe(true);
    expect(requireE2eSeamSecret(undefined, env).ok).toBe(false);
    expect(requireE2eSeamSecret("wrong", env).ok).toBe(false);
    expect(
      requireE2eSeamSecret("ps008-e2e-seam-secret", {
        PROJECTSIM_E2E_SEAM_SECRET: "",
      }).ok,
    ).toBe(false);
  });

  it("gates global reset behind E2E_ALLOW_GLOBAL_RESET", () => {
    expect(globalE2eResetAllowed({ E2E_ALLOW_GLOBAL_RESET: "1" })).toBe(true);
    expect(globalE2eResetAllowed({})).toBe(false);
  });
});
