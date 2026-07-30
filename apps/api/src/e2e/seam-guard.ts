/**
 * Shared server-side guards for opt-in E2E seams (PS-ROADMAP-008).
 * Client requests cannot enable these; enablement is process env only.
 */

export const E2E_SEAM_HEADER = "x-projectsim-e2e-seam";

/** Fixture/test IDs: stable, URL-safe, non-empty, bounded length. */
export const isFixtureId = (value: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9_-]{1,127}$/.test(value);

const ALLOWED_CAPABILITIES = new Set([
  "simulation.run.view",
  "simulation.run.start",
  "simulation.projection.ops",
]);

export const filterAllowedCapabilities = (
  values: readonly string[],
): string[] | null => {
  const next = values.filter((value) => ALLOWED_CAPABILITIES.has(value));
  return next.length === values.length ? next : null;
};

export const e2eSeamsAllowedInProcess = (
  env: NodeJS.ProcessEnv = process.env,
): boolean =>
  env.NODE_ENV !== "production" && env.PROJECTSIM_ENABLE_E2E_SEAMS === "1";

export const requireE2eSeamSecret = (
  headerValue: string | undefined,
  env: NodeJS.ProcessEnv = process.env,
): { readonly ok: true } | { readonly ok: false; readonly message: string } => {
  const expected = env.PROJECTSIM_E2E_SEAM_SECRET?.trim() ?? "";
  if (!expected) {
    return {
      ok: false,
      message:
        "PROJECTSIM_E2E_SEAM_SECRET is required when E2E seams are enabled.",
    };
  }
  if (!headerValue || headerValue !== expected) {
    return {
      ok: false,
      message: "Missing or invalid E2E seam credential.",
    };
  }
  return { ok: true };
};

export const globalE2eResetAllowed = (
  env: NodeJS.ProcessEnv = process.env,
): boolean => env.E2E_ALLOW_GLOBAL_RESET === "1";
