import { expect, type Page } from "@playwright/test";
import { expectWorkplaceShell, workplaceAchievementsRoute } from "./workplace";

export const openAchievementsPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceAchievementsRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Achievements$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentAchievements = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("achievements-freshness")).toHaveText(
    "Current",
    { timeout: 20_000 },
  );
};
