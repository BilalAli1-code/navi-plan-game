import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 4173;
const API_PORT = 8787;
const WEB_BASE_URL =
  process.env.E2E_WEB_BASE_URL?.trim() || `http://127.0.0.1:${WEB_PORT}`;
const API_BASE_URL =
  process.env.E2E_API_BASE_URL?.trim() || `http://127.0.0.1:${API_PORT}`;

/**
 * Playwright configuration for ProjectSim browser tests.
 * - Home smoke: production preview shell
 * - Decision lifecycle: real API + PostgreSQL (PS-ROADMAP-008)
 *
 * Isolation strategy: serial workers (1) with unique tenant/run per test and
 * truncated cleanup between tests. Avoids shared mutable SimulationRun races.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: WEB_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      testMatch:
        /(decision-lifecycle|mission-control|decision-log|inbox|workplace)\.responsive/,
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: [
    {
      command: "node ../../scripts/e2e/run-api.mjs",
      url: `${API_BASE_URL}/healthz`,
      // Always start a fresh API so E2E seams match the current sources.
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: String(API_PORT),
        E2E_API_BASE_URL: API_BASE_URL,
        SUPABASE_JWT_SECRET:
          process.env.SUPABASE_JWT_SECRET?.trim() || "ps008-e2e-jwt-secret",
        PROJECTSIM_ENABLE_E2E_SEAMS: "1",
        PROJECTSIM_E2E_SEAM_SECRET:
          process.env.PROJECTSIM_E2E_SEAM_SECRET?.trim() ||
          "ps008-e2e-seam-secret",
        E2E_ALLOW_GLOBAL_RESET: "1",
        PROJECTSIM_API_COMPOSITION: "postgres",
        PROJECTSIM_AUTH_MODE: "supabase",
      },
    },
    {
      command: `pnpm run preview --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      url: WEB_BASE_URL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
