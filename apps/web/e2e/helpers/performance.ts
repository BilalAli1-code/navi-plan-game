import { expect, type Page } from "@playwright/test";
import { expectWorkplaceShell, workplacePerformanceRoute } from "./workplace";

export { workplacePerformanceRoute };

export const openPerformancePage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplacePerformanceRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Performance$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentPerformance = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("performance-freshness")).toHaveText(
    "Current",
    {
      timeout: 20_000,
    },
  );
};
