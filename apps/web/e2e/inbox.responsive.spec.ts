import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  authenticateBrowserPage,
  createE2eAccessToken,
  uniqueIdentity,
} from "./helpers/auth";
import {
  cleanupAllE2eFixtures,
  createDecisionLifecycleFixture,
} from "./helpers/api";
import { openInboxPage, waitForCurrentInbox } from "./helpers/inbox";
import { requireE2eDatabase } from "./helpers/env";
import {
  expectWorkplaceNavDestinations,
  navigateWorkplaceToInbox,
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

test("pixel7_inbox_shell_navigation_and_empty_state", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity("inbox-pixel");
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

  await openInboxPage(page, identity.simulationRunId);
  await waitForCurrentInbox(page);
  await expectWorkplaceNavDestinations(page);
  await expect(page.getByTestId("inbox-empty")).toBeVisible();

  await openWorkplaceNavIfNeeded(page);
  await navigateWorkplaceToMissionControl(page);
  await navigateWorkplaceToInbox(page);
  await waitForCurrentInbox(page);

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  expect(overflow).toBe(false);

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const serious = axe.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
});
