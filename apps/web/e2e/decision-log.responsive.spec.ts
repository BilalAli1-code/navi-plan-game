import { expect, test } from "@playwright/test";
import {
  authenticateBrowserPage,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import {
  cleanupAllE2eFixtures,
  createDecisionLifecycleFixture,
  tickOutboxRelay,
} from "./helpers/api";
import {
  enterRationale,
  openDecisionPage,
  reviewAndSubmit,
  selectBalancedOption,
  waitForCurrentProjection,
  waitForResolvedPhase,
} from "./helpers/ui";
import {
  openDecisionLogPage,
  waitForCurrentDecisionLog,
} from "./helpers/decision-log";
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

test("decision_log_renders_without_horizontal_overflow_on_pixel_7", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("dlog-pixel");
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

  await openDecisionPage(page, identity.simulationRunId);
  await waitForCurrentProjection(page);
  await selectBalancedOption(page);
  await enterRationale(
    page,
    "Pixel 7 Decision Log wrapping check with a deliberately long rationale that should not appear in Decision Log.",
  );
  await reviewAndSubmit(page);
  await waitForResolvedPhase(page);
  await tickOutboxRelay(identity.tenantId);

  await openDecisionLogPage(page, identity.simulationRunId);
  await waitForCurrentDecisionLog(page);
  await expect(page.getByTestId("dlog-entries")).toBeVisible({
    timeout: 20_000,
  });

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  const retry = page.getByRole("button", { name: /^Retry$/i });
  await expect(retry).toBeVisible();
  const box = await retry.boundingBox();
  expect(box).not.toBeNull();
  expect((box?.height ?? 0) >= 24).toBe(true);
});
