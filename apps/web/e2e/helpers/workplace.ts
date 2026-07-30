import { expect, type Page } from "@playwright/test";

export const workplaceRunRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}`;

export const workplaceMissionControlRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/mission-control`;

export const workplaceInboxRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/inbox`;

export const workplaceMeetingsRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/meetings`;

export const workplaceStakeholdersRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/stakeholders`;

export const workplaceDocumentsRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/documents`;

export const workplaceNotificationsRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/notifications`;

export const workplaceDecisionLogRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/decision-log`;

export const workplacePerformanceRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/performance`;

export const workplaceProgressRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/progress`;

export const workplaceAchievementsRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/achievements`;

export const workplaceMasteryRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/mastery`;

export const workplaceCoachingRoute = (simulationRunId: string): string =>
  `${workplaceRunRoute(simulationRunId)}/coaching`;

export const expectWorkplaceShell = async (page: Page): Promise<void> => {
  await expect(page.getByTestId("workplace-shell")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("workplace-run-id")).toBeVisible();
  // Nav list may be collapsed on narrow viewports until the menu opens.
  await expect(page.locator('nav[aria-label="Workplace"]')).toBeAttached();
};

export const openWorkplaceNavIfNeeded = async (page: Page): Promise<void> => {
  const toggle = page.getByRole("button", { name: /Workplace menu/i });
  if (await toggle.isVisible()) {
    const expanded = await toggle.getAttribute("aria-expanded");
    if (expanded !== "true") {
      await toggle.click();
    }
  }
  await expect(page.getByTestId("workplace-nav")).toBeVisible();
};

export const expectWorkplaceNavDestinations = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  const nav = page.getByTestId("workplace-nav");
  await expect(
    nav.getByRole("link", { name: "Mission Control" }),
  ).toBeVisible();
  await expect(nav.getByRole("link", { name: "Inbox" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Meetings" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Stakeholders" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Documents" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Notifications" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Activities" })).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Completed History" }),
  ).toBeVisible();
  await expect(nav.getByRole("link", { name: "Decision Log" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Performance" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Progress" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Achievements" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Mastery" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Coaching" })).toBeVisible();
  const linkNames = await nav.getByRole("link").allTextContents();
  expect(linkNames).toEqual([
    "Mission Control",
    "Inbox",
    "Meetings",
    "Stakeholders",
    "Documents",
    "Notifications",
    "Activities",
    "Completed History",
    "Decision Log",
    "Performance",
    "Progress",
    "Achievements",
    "Mastery",
    "Coaching",
  ]);
};

export const navigateWorkplaceToInbox = async (page: Page): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Inbox" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Inbox$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const navigateWorkplaceToMeetings = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Meetings" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Meetings$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const navigateWorkplaceToStakeholders = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Stakeholders" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Stakeholders$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const navigateWorkplaceToDecisionLog = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Decision Log" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Decision Log$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const navigateWorkplaceToDocuments = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Documents" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Documents$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const navigateWorkplaceToMissionControl = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Mission Control" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Mission Control$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const navigateWorkplaceToNotifications = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Notifications" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Notifications$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const navigateWorkplaceToActivities = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Activities" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Activities$/i }),
  ).toBeVisible({ timeout: 15_000 });
};

export const navigateWorkplaceToCompletedHistory = async (
  page: Page,
): Promise<void> => {
  await openWorkplaceNavIfNeeded(page);
  await page
    .getByTestId("workplace-nav")
    .getByRole("link", { name: "Completed History" })
    .click();
  await expect(
    page.getByRole("heading", { level: 1, name: /^Completed History$/i }),
  ).toBeVisible({ timeout: 15_000 });
};
