export const E2E_API_BASE_URL =
  process.env.E2E_API_BASE_URL?.trim() || "http://127.0.0.1:8787";

export const E2E_WEB_BASE_URL =
  process.env.E2E_WEB_BASE_URL?.trim() || "http://127.0.0.1:4173";

export const E2E_JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET?.trim() || "ps008-e2e-jwt-secret";

/** Must match PROJECTSIM_E2E_SEAM_SECRET on the API process. */
export const E2E_SEAM_SECRET =
  process.env.PROJECTSIM_E2E_SEAM_SECRET?.trim() || "ps008-e2e-seam-secret";

export const E2E_DATABASE_URL = process.env.DATABASE_URL?.trim() ?? "";
export const E2E_DATABASE_ADMIN_URL =
  process.env.DATABASE_ADMIN_URL?.trim() ||
  process.env.DATABASE_URL?.replace(/\/\/[^@]+@/, "//postgres:postgres@") ||
  "";

export const requireE2eDatabase = (): void => {
  if (!E2E_DATABASE_URL || !E2E_DATABASE_ADMIN_URL) {
    throw new Error(
      "DATABASE_URL and DATABASE_ADMIN_URL are required for Decision lifecycle E2E tests.",
    );
  }
};
