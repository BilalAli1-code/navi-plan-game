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
import {
  openMissionControlPage,
  waitForCurrentMissionControl,
} from "./helpers/mission-control";
import { requireE2eDatabase } from "./helpers/env";

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

test("mission_control_renders_without_horizontal_overflow_on_pixel_7", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("mc-pixel");
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
  await waitForCurrentMissionControl(page);

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  await expect(
    page.getByRole("link", { name: /Scaffold Decision/i }),
  ).toBeVisible();
  const box = await page
    .getByRole("link", { name: /Scaffold Decision/i })
    .boundingBox();
  expect(box).not.toBeNull();
  expect((box?.height ?? 0) >= 24).toBe(true);
});
