/**
 * Explicit API process runtime configuration.
 *
 * Composition is never inferred from the presence/absence of DATABASE_URL.
 * Callers must set PROJECTSIM_API_COMPOSITION to "postgres" or "memory".
 */

export type ApiCompositionMode = "postgres" | "memory";
export type ApiAuthMode = "supabase" | "dev";

export interface ApiRuntimeConfig {
  readonly composition: ApiCompositionMode;
  readonly authMode: ApiAuthMode;
  readonly databaseUrl: string | null;
  readonly supabaseJwtSecret: string | null;
  readonly supabaseUrl: string | null;
  readonly enableDevRoutes: boolean;
  readonly allowDevAuth: boolean;
  /** Opt-in PS-ROADMAP-008 E2E fixture/gate routes (forbidden in production). */
  readonly enableE2eSeams: boolean;
  readonly seedDemoOnBoot: boolean;
  readonly demoTenantId: string;
  readonly demoActorId: string;
  readonly demoRunId: string;
  readonly port: number;
}

export class ApiRuntimeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiRuntimeConfigError";
  }
}

const readMode = (value: string | undefined): string | undefined => {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }
  return value.trim().toLowerCase();
};

/**
 * Resolve process configuration for the API server entrypoint.
 * Throws {@link ApiRuntimeConfigError} when production-capable settings are incomplete.
 */
export const resolveApiRuntimeConfig = (
  env: NodeJS.ProcessEnv = process.env,
): ApiRuntimeConfig => {
  const compositionRaw = readMode(env.PROJECTSIM_API_COMPOSITION);
  if (compositionRaw !== "postgres" && compositionRaw !== "memory") {
    throw new ApiRuntimeConfigError(
      'PROJECTSIM_API_COMPOSITION must be set explicitly to "postgres" or "memory". ' +
        "The API never silently falls back between repository implementations.",
    );
  }
  const composition = compositionRaw;

  const nodeEnv = (env.NODE_ENV ?? "development").toLowerCase();
  const isProduction = nodeEnv === "production";

  if (composition === "memory" && isProduction) {
    throw new ApiRuntimeConfigError(
      'PROJECTSIM_API_COMPOSITION="memory" is not permitted when NODE_ENV=production.',
    );
  }

  const databaseUrl = env.DATABASE_URL?.trim() || null;
  if (composition === "postgres") {
    if (!databaseUrl) {
      throw new ApiRuntimeConfigError(
        'PROJECTSIM_API_COMPOSITION="postgres" requires DATABASE_URL. ' +
          "Refusing to start without a durable authoritative store.",
      );
    }
  }

  const allowDevAuth = env.PROJECTSIM_ALLOW_DEV_AUTH === "1";
  const enableDevRoutes = env.PROJECTSIM_ENABLE_DEV_ROUTES === "1";
  const enableE2eSeams = env.PROJECTSIM_ENABLE_E2E_SEAMS === "1";
  const seedDemoOnBoot = env.PROJECTSIM_SEED_DEMO === "1";

  if (
    isProduction &&
    (allowDevAuth || enableDevRoutes || seedDemoOnBoot || enableE2eSeams)
  ) {
    throw new ApiRuntimeConfigError(
      "Dev auth, seed routes, E2E seams, and demo seed bootstraps are not permitted when NODE_ENV=production.",
    );
  }

  const authModeRaw = readMode(env.PROJECTSIM_AUTH_MODE);
  let authMode: ApiAuthMode;
  if (authModeRaw === "supabase" || authModeRaw === "dev") {
    authMode = authModeRaw;
  } else if (authModeRaw === undefined) {
    // Defaults follow composition: postgres → supabase, memory → dev.
    authMode = composition === "postgres" ? "supabase" : "dev";
  } else {
    throw new ApiRuntimeConfigError(
      'PROJECTSIM_AUTH_MODE must be "supabase" or "dev" when set.',
    );
  }

  if (authMode === "dev" && !allowDevAuth && composition === "postgres") {
    throw new ApiRuntimeConfigError(
      'PROJECTSIM_AUTH_MODE="dev" requires PROJECTSIM_ALLOW_DEV_AUTH=1.',
    );
  }

  if (authMode === "dev" && isProduction) {
    throw new ApiRuntimeConfigError(
      'PROJECTSIM_AUTH_MODE="dev" is not permitted when NODE_ENV=production.',
    );
  }

  const supabaseJwtSecret = env.SUPABASE_JWT_SECRET?.trim() || null;
  const supabaseUrl =
    env.SUPABASE_URL?.trim() || env.VITE_SUPABASE_URL?.trim() || null;

  if (authMode === "supabase" && !supabaseJwtSecret) {
    throw new ApiRuntimeConfigError(
      'PROJECTSIM_AUTH_MODE="supabase" requires SUPABASE_JWT_SECRET for access-token verification.',
    );
  }

  return {
    composition,
    authMode,
    databaseUrl,
    supabaseJwtSecret,
    supabaseUrl,
    enableDevRoutes,
    allowDevAuth: allowDevAuth || authMode === "dev",
    enableE2eSeams,
    seedDemoOnBoot,
    demoTenantId: env.PROJECTSIM_DEMO_TENANT_ID?.trim() || "tenant_local",
    demoActorId: env.PROJECTSIM_DEMO_ACTOR_ID?.trim() || "actor_1",
    demoRunId: env.PROJECTSIM_DEMO_RUN_ID?.trim() || "run_1",
    port: Number(env.PORT ?? 8787),
  };
};
