#!/usr/bin/env node
/**
 * Start @projectsim/api for Decision lifecycle E2E (PS-ROADMAP-008).
 * Uses postgres composition, Supabase JWT verification, and opt-in E2E seams.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const env = {
  ...process.env,
  NODE_ENV:
    process.env.NODE_ENV === "production"
      ? "development"
      : process.env.NODE_ENV || "development",
  PROJECTSIM_API_COMPOSITION: "postgres",
  PROJECTSIM_AUTH_MODE: "supabase",
  PROJECTSIM_ALLOW_DEV_AUTH: "0",
  PROJECTSIM_ENABLE_DEV_ROUTES: "0",
  PROJECTSIM_ENABLE_E2E_SEAMS: "1",
  PROJECTSIM_E2E_SEAM_SECRET:
    process.env.PROJECTSIM_E2E_SEAM_SECRET?.trim() || "ps008-e2e-seam-secret",
  E2E_ALLOW_GLOBAL_RESET: process.env.E2E_ALLOW_GLOBAL_RESET || "1",
  PROJECTSIM_SEED_DEMO: "0",
  SUPABASE_JWT_SECRET:
    process.env.SUPABASE_JWT_SECRET?.trim() || "ps008-e2e-jwt-secret",
  PORT: process.env.PORT || "8787",
};

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL is required for E2E API startup.");
  process.exit(1);
}

const child = spawn(
  "pnpm",
  ["--filter", "@projectsim/api", "exec", "tsx", "src/server.ts"],
  {
    cwd: root,
    env,
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
