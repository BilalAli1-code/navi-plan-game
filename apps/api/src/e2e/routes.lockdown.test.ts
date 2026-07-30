import { afterEach, describe, expect, it } from "vitest";
import { createApiApp } from "../create-app";
import { createInMemorySimulationModuleRegistry } from "../module-registry";

const originalNodeEnv = process.env.NODE_ENV;
const originalSeamSecret = process.env.PROJECTSIM_E2E_SEAM_SECRET;
const originalEnable = process.env.PROJECTSIM_ENABLE_E2E_SEAMS;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalSeamSecret === undefined) {
    delete process.env.PROJECTSIM_E2E_SEAM_SECRET;
  } else {
    process.env.PROJECTSIM_E2E_SEAM_SECRET = originalSeamSecret;
  }
  if (originalEnable === undefined) {
    delete process.env.PROJECTSIM_ENABLE_E2E_SEAMS;
  } else {
    process.env.PROJECTSIM_ENABLE_E2E_SEAMS = originalEnable;
  }
});

describe("E2E route lockdown", () => {
  it("does not register /api/v1/e2e routes when seams are disabled", async () => {
    delete process.env.PROJECTSIM_ENABLE_E2E_SEAMS;
    const app = createApiApp({
      registry: createInMemorySimulationModuleRegistry(),
      enableE2eSeams: false,
      allowDevAuth: true,
    });
    const res = await app.request("/api/v1/e2e/projection-gate/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body.toLowerCase()).not.toContain("seam");
    expect(body.toLowerCase()).not.toContain("e2e secret");
    expect(body.toLowerCase()).not.toContain("projectsim_e2e");
  });

  it("returns opaque 404 without the seam secret even when seams are enabled", async () => {
    process.env.NODE_ENV = "development";
    process.env.PROJECTSIM_E2E_SEAM_SECRET = "ps008-e2e-seam-secret";
    const app = createApiApp({
      registry: createInMemorySimulationModuleRegistry(),
      enableE2eSeams: true,
      allowDevAuth: true,
    });
    const res = await app.request("/api/v1/e2e/projection-gate/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: { message: "Not found." } });
  });

  it("refuses to mount E2E seams when NODE_ENV=production even if forced", async () => {
    process.env.NODE_ENV = "production";
    process.env.PROJECTSIM_ENABLE_E2E_SEAMS = "1";
    process.env.PROJECTSIM_E2E_SEAM_SECRET = "ps008-e2e-seam-secret";
    const app = createApiApp({
      registry: createInMemorySimulationModuleRegistry(),
      enableE2eSeams: true,
      allowDevAuth: false,
    });
    const res = await app.request("/api/v1/e2e/projection-gate/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ProjectSim-E2E-Seam": "ps008-e2e-seam-secret",
      },
      body: "{}",
    });
    expect(res.status).toBe(404);
  });

  it("serves fixture helpers when seams are enabled with a valid secret", async () => {
    process.env.NODE_ENV = "development";
    process.env.PROJECTSIM_E2E_SEAM_SECRET = "ps008-e2e-seam-secret";
    const app = createApiApp({
      registry: createInMemorySimulationModuleRegistry(),
      enableE2eSeams: true,
      allowDevAuth: true,
    });
    const res = await app.request("/api/v1/e2e/projection-gate/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ProjectSim-E2E-Seam": "ps008-e2e-seam-secret",
      },
      body: "{}",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.mode).toBe("open");
  });
});
