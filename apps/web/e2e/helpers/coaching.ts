import { expect, type Page } from "@playwright/test";
import { expectWorkplaceShell, workplaceCoachingRoute } from "./workplace";

export const openCoachingPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceCoachingRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Coaching$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentCoaching = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("coaching-freshness")).toHaveText("Current", {
    timeout: 20_000,
  });
};
