/**
 * BC-008 documentation tooling: capture learner UI baseline screenshots.
 * Does not modify application runtime code.
 *
 * Prerequisites:
 * - DATABASE_URL / DATABASE_ADMIN_URL
 * - API on :8787 (e2e seams) and web preview on :4173 with E2E auth hook
 *
 * Usage (from repo root after servers are up):
 *   node docs/business-cases/11-lovable-experience-refinement/scripts/capture-baseline.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../..",
);
const require = createRequire(path.join(root, "apps/web/package.json"));
const { chromium, devices } = require(
  path.join(
    root,
    "node_modules/.pnpm/playwright@1.61.1/node_modules/playwright",
  ),
);
const { SignJWT } = require("jose");
void pathToFileURL;
const outRoot = path.join(
  root,
  "docs/business-cases/11-lovable-experience-refinement/screenshots",
);

const WEB = process.env.E2E_WEB_BASE_URL?.trim() || "http://127.0.0.1:4173";
const API = process.env.E2E_API_BASE_URL?.trim() || "http://127.0.0.1:8787";
const JWT_SECRET =
  process.env.SUPABASE_JWT_SECRET?.trim() || "ps008-e2e-jwt-secret";
const SEAM =
  process.env.PROJECTSIM_E2E_SEAM_SECRET?.trim() || "ps008-e2e-seam-secret";

const VIEWPORTS = [
  { name: "phone", ...devices["iPhone 13"] },
  {
    name: "large-phone",
    viewport: { width: 430, height: 932 },
    isMobile: true,
    hasTouch: true,
  },
  { name: "tablet", ...devices["iPad (gen 7)"] },
  { name: "laptop", viewport: { width: 1280, height: 800 } },
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "wide-desktop", viewport: { width: 1920, height: 1080 } },
];

const SURFACES = [
  { folder: "catalog", path: "/catalog", ready: "text=Business Cases" },
  {
    folder: "mission-control",
    pathOf: (id) => `/app/runs/${id}/mission-control`,
    ready: "[data-testid=mission-control-freshness]",
  },
  {
    folder: "inbox",
    pathOf: (id) => `/app/runs/${id}/inbox`,
    ready: "[data-testid=inbox-freshness], [data-testid=inbox-empty]",
  },
  {
    folder: "meetings",
    pathOf: (id) => `/app/runs/${id}/meetings`,
    ready: "[data-testid=meetings-freshness], [data-testid=meetings-empty]",
  },
  {
    folder: "stakeholders",
    pathOf: (id) => `/app/runs/${id}/stakeholders`,
    ready:
      "[data-testid=stakeholders-freshness], [data-testid=stakeholders-empty]",
  },
  {
    folder: "documents",
    pathOf: (id) => `/app/runs/${id}/documents`,
    ready: "[data-testid=documents-freshness], [data-testid=documents-empty]",
  },
  {
    folder: "activities",
    pathOf: (id) => `/app/runs/${id}/activities`,
    ready: "[data-testid=activities-freshness], [data-testid=activities-empty]",
  },
  {
    folder: "decision",
    pathOf: (id) => `/app/runs/${id}/decisions`,
    ready: "text=Loading simulation projection, css=.ps-decision-workspace, text=No decisions",
  },
  {
    folder: "performance",
    pathOf: (id) => `/app/runs/${id}/performance`,
    ready: "[data-testid=performance-freshness]",
  },
  {
    folder: "progress",
    pathOf: (id) => `/app/runs/${id}/progress`,
    ready:
      "[data-testid=learner-progression-freshness], [data-testid=learner-progression-empty]",
  },
  {
    folder: "achievements",
    pathOf: (id) => `/app/runs/${id}/achievements`,
    ready:
      "[data-testid=achievements-freshness], [data-testid=achievements-empty]",
  },
  {
    folder: "mastery",
    pathOf: (id) => `/app/runs/${id}/mastery`,
    ready: "[data-testid=mastery-freshness], [data-testid=mastery-empty]",
  },
  {
    folder: "coaching",
    pathOf: (id) => `/app/runs/${id}/coaching`,
    ready: "[data-testid=coaching-freshness], [data-testid=coaching-empty]",
  },
];

const createToken = async (actorId, tenantId) =>
  new SignJWT({
    role: "authenticated",
    app_metadata: { tenant_id: tenantId },
    session_id: `sess_bc008_${actorId}`,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(actorId)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(JWT_SECRET));

const e2eFetch = async (p, init) => {
  const response = await fetch(`${API}${p}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-ProjectSim-E2E-Seam": SEAM,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`${p} -> ${response.status} ${await response.text()}`);
  }
  return response.json();
};

const authenticate = async (page, identity, token) => {
  await page.goto(`${WEB}/`);
  await page.waitForFunction(() => Boolean(window.__PROJECTSIM_E2E_AUTH__), {
    timeout: 20_000,
  });
  await page.evaluate(
    (session) => {
      window.__PROJECTSIM_E2E_AUTH__.setSession({
        actorId: session.actorId,
        tenantId: session.tenantId,
        accessToken: session.accessToken,
        authSource: "supabase",
      });
    },
    {
      actorId: identity.actorId,
      tenantId: identity.tenantId,
      accessToken: token,
    },
  );
};

const shot = async (page, folder, name) => {
  const dir = path.join(outRoot, folder);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
};

const main = async () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const identity = {
    actorId: `actor_bc008_${stamp.slice(0, 19)}`,
    tenantId: `tenant_bc008_${stamp.slice(0, 19)}`,
    learnerId: `learner_bc008_${stamp.slice(0, 19)}`,
    simulationRunId: `run_bc008_${stamp.slice(0, 19)}`,
  };

  await e2eFetch("/api/v1/e2e/fixtures/cleanup", {
    method: "POST",
    body: JSON.stringify({ global: true }),
  });
  await e2eFetch("/api/v1/e2e/fixtures/decision-lifecycle", {
    method: "POST",
    body: JSON.stringify(identity),
  });
  const token = await createToken(identity.actorId, identity.tenantId);

  const browser = await chromium.launch({ headless: true });
  const manifest = [];

  try {
    // Auth-required empty state (desktop)
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(`${WEB}/catalog`);
      await page.waitForTimeout(500);
      const file = await shot(page, "auth", `catalog-unauthenticated-desktop-${stamp}`);
      manifest.push({ surface: "auth", viewport: "desktop", file });
      await context.close();
    }

    for (const vp of VIEWPORTS) {
      const {
        name: _viewportName,
        defaultBrowserType: _defaultBrowserType,
        ...deviceOptions
      } = vp;
      const context = await browser.newContext({
        ...deviceOptions,
        viewport: vp.viewport,
      });
      const page = await context.newPage();
      await authenticate(page, identity, token);

      // Home / shell context
      await page.goto(`${WEB}/`);
      await page.waitForTimeout(300);
      manifest.push({
        surface: "shell",
        viewport: vp.name,
        file: await shot(page, "shell", `home-${vp.name}-${stamp}`),
      });

      for (const surface of SURFACES) {
        const route = surface.pathOf
          ? surface.pathOf(identity.simulationRunId)
          : surface.path;
        await page.goto(`${WEB}${route}`);
        try {
          await page.waitForSelector(surface.ready, { timeout: 20_000 });
        } catch {
          // Still capture whatever rendered for baseline evidence.
        }
        await page.waitForTimeout(400);
        const file = await shot(
          page,
          surface.folder,
          `${surface.folder}-${vp.name}-${stamp}`,
        );
        manifest.push({
          surface: surface.folder,
          viewport: vp.name,
          file: path.relative(outRoot, file),
        });

        // Responsive folder mirrors for key surfaces
        if (
          ["mission-control", "inbox", "decision", "documents"].includes(
            surface.folder,
          )
        ) {
          const responsiveFile = await shot(
            page,
            "responsive",
            `${surface.folder}-${vp.name}-${stamp}`,
          );
          manifest.push({
            surface: "responsive",
            viewport: vp.name,
            file: path.relative(outRoot, responsiveFile),
          });
        }
      }

      await context.close();
    }

    // Explicit state captures (desktop, authenticated)
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const page = await context.newPage();
      await authenticate(page, identity, token);

      // Empty-ish lists on scaffold fixture
      for (const [folder, route, ready] of [
        [
          "states",
          `/app/runs/${identity.simulationRunId}/completed-history`,
          "[data-testid=completed-history-empty], [data-testid=completed-history-freshness]",
        ],
        [
          "states",
          `/app/runs/${identity.simulationRunId}/notifications`,
          "[data-testid=notifications-empty], [data-testid=notifications-freshness]",
        ],
        [
          "states",
          `/app/runs/${identity.simulationRunId}/decision-log`,
          "[data-testid=dlog-empty], [data-testid=decision-log-freshness]",
        ],
      ]) {
        await page.goto(`${WEB}${route}`);
        try {
          await page.waitForSelector(ready, { timeout: 15_000 });
        } catch {
          /* capture anyway */
        }
        await page.waitForTimeout(300);
        const name = route.split("/").pop();
        manifest.push({
          surface: "states",
          viewport: "desktop",
          file: path.relative(
            outRoot,
            await shot(page, folder, `${name}-desktop-${stamp}`),
          ),
        });
      }

      // Hold projection gate → stale/catch-up messaging if supported
      try {
        await e2eFetch("/api/v1/e2e/projection-gate", {
          method: "POST",
          body: JSON.stringify({ mode: "hold" }),
        });
        await page.goto(
          `${WEB}/app/runs/${identity.simulationRunId}/mission-control?expectVersion=999999`,
        );
        await page.waitForTimeout(1500);
        manifest.push({
          surface: "states",
          viewport: "desktop",
          file: path.relative(
            outRoot,
            await shot(page, "states", `mission-control-expectVersion-desktop-${stamp}`),
          ),
        });
        await e2eFetch("/api/v1/e2e/projection-gate", {
          method: "POST",
          body: JSON.stringify({ mode: "open" }),
        });
      } catch (error) {
        console.warn("projection-gate state capture skipped:", error.message);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const manifestPath = path.join(outRoot, `manifest-${stamp}.json`);
  await writeFile(manifestPath, JSON.stringify({ identity, stamp, manifest }, null, 2));
  console.log(`Wrote ${manifest.length} screenshots; manifest ${manifestPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
