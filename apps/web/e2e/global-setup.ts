import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

/**
 * Prepare Decision lifecycle E2E:
 * - apply migrations
 * - rebuild web with API base URL + E2E auth hook
 */
async function globalSetup(): Promise<void> {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_ADMIN_URL) {
    throw new Error(
      "DATABASE_URL and DATABASE_ADMIN_URL are required for Playwright Decision lifecycle E2E.",
    );
  }

  execSync("pnpm run db:migrate", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  execSync("pnpm --filter @projectsim/web run build:e2e", {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_API_BASE_URL:
        process.env.E2E_API_BASE_URL?.trim() || "http://127.0.0.1:8787",
      VITE_ENABLE_E2E_AUTH_HOOK: "1",
    },
  });
}

export default globalSetup;
