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
  enterRationale,
  openDecisionPage,
  reviewAndSubmit,
  selectBalancedOption,
  waitForCurrentProjection,
  waitForResolvedDecision,
} from "./helpers/ui";
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

test("given_viewport_project_when_completing_decision_then_layout_remains_usable", async ({
  page,
}, testInfo) => {
  const identity = uniqueIdentity(`resp_${testInfo.project.name}`);
  await createDecisionLifecycleFixture(identity);
  const token = await createE2eAccessToken(identity);

  await page.goto("/");
  await authenticateBrowserPage(page, {
    actorId: identity.actorId,
    tenantId: identity.tenantId,
    accessToken: token,
  });
  await openDecisionPage(page, identity.simulationRunId);
  await waitForCurrentProjection(page);

  await expect(page.getByText(/Choose how to proceed/i)).toBeVisible();
  await selectBalancedOption(page);
  await enterRationale(page, `Responsive ${testInfo.project.name}`);
  await reviewAndSubmit(page);
  await waitForResolvedDecision(page);

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  const clientWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  await expect(page.getByRole("heading", { name: /^Decision$/i })).toHaveCount(
    1,
  );
});
