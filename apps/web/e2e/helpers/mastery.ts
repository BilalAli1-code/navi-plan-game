import { expect, type Page } from "@playwright/test";
import { expectWorkplaceShell, workplaceMasteryRoute } from "./workplace";

export const openMasteryPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceMasteryRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Mastery$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentMastery = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("mastery-freshness")).toHaveText("Current", {
    timeout: 20_000,
  });
};
