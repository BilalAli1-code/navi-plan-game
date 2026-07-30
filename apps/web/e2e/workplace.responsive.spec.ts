import { expect, test } from "@playwright/test";
import {
  authenticateBrowserPage,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import {
  cleanupAllE2eFixtures,
  createDecisionLifecycleFixture,
} from "./helpers/api";
import { openMissionControlPage } from "./helpers/mission-control";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceShell,
  navigateWorkplaceToDecisionLog,
  navigateWorkplaceToMissionControl,
  openWorkplaceNavIfNeeded,
} from "./helpers/workplace";

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  requireE2eDatabase();
});

test.beforeEach(async () => {
  await cleanupAllE2eFixtures();
});

test.afterEach(async () => {
  await cleanupAllE2eFixtures();
});

test("workplace_shell_mobile_nav_works_without_horizontal_overflow_on_pixel_7", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("wp-pixel");
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);
  testInfo.annotations.push({
    type: "fixture",
    description: `${identity.tenantId}/${identity.simulationRunId}`,
  });

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openMissionControlPage(page, identity.simulationRunId);
  await expectWorkplaceShell(page);

  const toggle = page.getByRole("button", { name: /Workplace menu/i });
  const mobileProject = testInfo.project.name === "mobile-chrome";
  if (mobileProject) {
    await expect(toggle).toBeVisible();
    await openWorkplaceNavIfNeeded(page);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }

  await navigateWorkplaceToDecisionLog(page);
  if (mobileProject) {
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  }

  await navigateWorkplaceToMissionControl(page);

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  if (mobileProject) {
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.height ?? 0) >= 24).toBe(true);
  }
});
