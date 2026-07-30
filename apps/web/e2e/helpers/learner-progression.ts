import { expect, type Page } from "@playwright/test";
import { expectWorkplaceShell, workplaceProgressRoute } from "./workplace";

export { workplaceProgressRoute };

export const openProgressPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(workplaceProgressRoute(simulationRunId));
  await expectWorkplaceShell(page);
  await expect(
    page.getByRole("heading", { level: 1, name: /^Progress$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const waitForCurrentLearnerProgression = async (
  page: Page,
): Promise<void> => {
  await expect(page.getByTestId("learner-progression-freshness")).toHaveText(
    "Current",
    {
      timeout: 20_000,
    },
  );
};
