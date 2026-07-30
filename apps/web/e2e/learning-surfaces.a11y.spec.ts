/**
 * BC-006 W7 — accessibility smoke for learning projection surfaces.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  authenticateBrowserPage,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import { createDecisionLifecycleFixture } from "./helpers/api";
import {
  workplaceAchievementsRoute,
  workplaceCoachingRoute,
  workplaceMasteryRoute,
} from "./helpers/workplace";
import { waitForCurrentAchievements } from "./helpers/achievements";
import { waitForCurrentMastery } from "./helpers/mastery";
import { waitForCurrentCoaching } from "./helpers/coaching";

const assertNoSeriousAxe = async (page: import("@playwright/test").Page) => {
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
};

test("learning_surfaces_have_no_serious_axe_violations_on_desktop", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("learn-a11y");
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

  await page.goto(workplaceAchievementsRoute(identity.simulationRunId));
  await waitForCurrentAchievements(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Achievements$/i }),
  ).toBeVisible();
  await assertNoSeriousAxe(page);

  await page.goto(workplaceMasteryRoute(identity.simulationRunId));
  await waitForCurrentMastery(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Mastery$/i }),
  ).toBeVisible();
  await assertNoSeriousAxe(page);

  await page.goto(workplaceCoachingRoute(identity.simulationRunId));
  await waitForCurrentCoaching(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Coaching$/i }),
  ).toBeVisible();
  await assertNoSeriousAxe(page);
});

test("learning_surfaces_remain_usable_on_phone_viewport", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const identity = uniqueIdentity("learn-phone");
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

  await page.goto(workplaceMasteryRoute(identity.simulationRunId));
  await waitForCurrentMastery(page);
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
  await assertNoSeriousAxe(page);
});
