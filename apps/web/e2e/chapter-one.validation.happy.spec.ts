/**
 * BC-005 — Chapter One validation happy path (Playwright / Chromium).
 *
 * Uses public APIs for Northstar run creation (not scaffold fixture projections).
 * Membership is seeded via the e2e fixture seam only; workplace state comes from
 * POST /api/v1/simulation-runs + relay convergence.
 */
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  authenticateBrowserPage,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import {
  cleanupE2eTenant,
  createDecisionLifecycleFixture,
} from "./helpers/api";
import { E2E_API_BASE_URL, requireE2eDatabase } from "./helpers/env";
import { convergeRelay } from "./helpers/convergence";
import {
  openMissionControlPage,
  waitForCurrentMissionControl,
} from "./helpers/mission-control";

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  requireE2eDatabase();
});

test("given_northstar_chapter_one_when_opening_catalog_and_mission_control_then_learner_surfaces_converge", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("bc005-ch1");
  // Seed membership only (scaffold run id is intentionally different).
  await createDecisionLifecycleFixture(
    {
      ...identity,
      simulationRunId: `${identity.simulationRunId}_membership`,
    },
    {
      capabilities: ["simulation.run.view", "simulation.run.start"],
    },
  );
  const token = await createE2eAccessToken(identity);
  testInfo.annotations.push({
    type: "fixture",
    description: `${identity.tenantId}/${identity.simulationRunId}`,
  });

  page.on("pageerror", (error) => {
    throw error;
  });

  try {
    const createRun = await fetch(
      `${E2E_API_BASE_URL}/api/v1/simulation-runs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Correlation-ID": `corr_bc005_${identity.simulationRunId}`,
        },
        body: JSON.stringify({
          businessCaseId: "northstar-connected-care",
          experienceLevel: "explorer",
          simulationRunId: identity.simulationRunId,
        }),
      },
    );
    const createBodyText = await createRun.text();
    expect(createRun.status, `create run failed: ${createBodyText}`).toBe(201);
    const created = JSON.parse(createBodyText) as {
      data: {
        simulationRunId: string;
        chapterId: string;
        contentPackageVersionId: string;
        experienceLevel: string;
      };
    };
    expect(created.data.simulationRunId).toBe(identity.simulationRunId);
    expect(created.data.chapterId).toBe("chapter-01");
    expect(created.data.contentPackageVersionId).toBe(
      "cpv:northstar-connected-care:1.0.0",
    );
    expect(created.data.experienceLevel).toBe("explorer");

    // Projections converge via relay (do not mock).
    await convergeRelay(identity.tenantId);

    await page.goto("/");
    await authenticateBrowserPage(page, {
      actorId: identity.actorId,
      tenantId: identity.tenantId,
      accessToken: token,
    });

    await page.goto("/catalog");
    await expect(
      page.getByRole("heading", { level: 1, name: /^Business Case Catalog$/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Northstar/i).first()).toBeVisible();

    const catalogAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const catalogSerious = catalogAxe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(catalogSerious, JSON.stringify(catalogSerious, null, 2)).toEqual([]);

    await page.goto("/catalog/northstar-connected-care");
    await expect(
      page.getByRole("heading", { level: 1, name: /Northstar/i }),
    ).toBeVisible({ timeout: 15_000 });

    await openMissionControlPage(page, identity.simulationRunId);
    await waitForCurrentMissionControl(page);

    // Chapter One pin surfaces as chapter-01; pending decisions exact label.
    await expect(
      page.getByRole("heading", { level: 2, name: /^Chapter$/i }),
    ).toBeVisible();
    await expect(page.getByText("chapter-01", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Pending decisions", { exact: true }),
    ).toBeVisible();
    // Progressive eligibility exposes the first required decision at start.
    await expect(
      page
        .locator("li")
        .filter({ hasText: /Pending decisions/i })
        .getByText("1", { exact: true }),
    ).toBeVisible();

    const mcAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const mcSerious = mcAxe.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical",
    );
    expect(mcSerious, JSON.stringify(mcSerious, null, 2)).toEqual([]);
  } finally {
    await cleanupE2eTenant(identity.tenantId);
  }
});
