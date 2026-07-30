import { describe, expect, it } from "vitest";
import { ApiRuntimeConfigError, resolveApiRuntimeConfig } from "./runtime";

describe("resolveApiRuntimeConfig", () => {
  it("requires an explicit composition mode", () => {
    expect(() => resolveApiRuntimeConfig({})).toThrow(ApiRuntimeConfigError);
    expect(() =>
      resolveApiRuntimeConfig({ DATABASE_URL: "postgres://x" }),
    ).toThrow(/PROJECTSIM_API_COMPOSITION/);
  });

  it("does not treat DATABASE_URL alone as permission to use postgres", () => {
    expect(() =>
      resolveApiRuntimeConfig({
        DATABASE_URL: "postgresql://localhost/db",
      }),
    ).toThrow(/explicitly/);
  });

  it("requires DATABASE_URL when composition is postgres", () => {
    expect(() =>
      resolveApiRuntimeConfig({
        PROJECTSIM_API_COMPOSITION: "postgres",
        PROJECTSIM_AUTH_MODE: "supabase",
        SUPABASE_JWT_SECRET: "test-secret",
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("requires SUPABASE_JWT_SECRET for supabase auth", () => {
    expect(() =>
      resolveApiRuntimeConfig({
        PROJECTSIM_API_COMPOSITION: "postgres",
        DATABASE_URL: "postgresql://localhost/db",
        PROJECTSIM_AUTH_MODE: "supabase",
      }),
    ).toThrow(/SUPABASE_JWT_SECRET/);
  });

  it("rejects memory composition in production", () => {
    expect(() =>
      resolveApiRuntimeConfig({
        NODE_ENV: "production",
        PROJECTSIM_API_COMPOSITION: "memory",
        PROJECTSIM_AUTH_MODE: "dev",
        PROJECTSIM_ALLOW_DEV_AUTH: "1",
      }),
    ).toThrow(/production/);
  });

  it("rejects dev routes and demo seed in production", () => {
    expect(() =>
      resolveApiRuntimeConfig({
        NODE_ENV: "production",
        PROJECTSIM_API_COMPOSITION: "postgres",
        DATABASE_URL: "postgresql://localhost/db",
        SUPABASE_JWT_SECRET: "secret",
        PROJECTSIM_ENABLE_DEV_ROUTES: "1",
      }),
    ).toThrow(/Dev auth, seed routes/);
  });

  it("rejects E2E seams in production", () => {
    expect(() =>
      resolveApiRuntimeConfig({
        NODE_ENV: "production",
        PROJECTSIM_API_COMPOSITION: "postgres",
        DATABASE_URL: "postgresql://localhost/db",
        SUPABASE_JWT_SECRET: "secret",
        PROJECTSIM_ENABLE_E2E_SEAMS: "1",
      }),
    ).toThrow(/E2E seams/);
  });

  it("accepts explicit memory local demo configuration", () => {
    const config = resolveApiRuntimeConfig({
      PROJECTSIM_API_COMPOSITION: "memory",
      PROJECTSIM_AUTH_MODE: "dev",
      PROJECTSIM_ALLOW_DEV_AUTH: "1",
      PROJECTSIM_ENABLE_DEV_ROUTES: "1",
      PROJECTSIM_SEED_DEMO: "1",
    });
    expect(config.composition).toBe("memory");
    expect(config.authMode).toBe("dev");
    expect(config.enableDevRoutes).toBe(true);
    expect(config.seedDemoOnBoot).toBe(true);
  });

  it("accepts explicit postgres production-capable configuration", () => {
    const config = resolveApiRuntimeConfig({
      NODE_ENV: "production",
      PROJECTSIM_API_COMPOSITION: "postgres",
      DATABASE_URL: "postgresql://localhost/db",
      SUPABASE_JWT_SECRET: "super-secret",
      PROJECTSIM_AUTH_MODE: "supabase",
    });
    expect(config.composition).toBe("postgres");
    expect(config.authMode).toBe("supabase");
    expect(config.enableDevRoutes).toBe(false);
    expect(config.allowDevAuth).toBe(false);
  });
});
