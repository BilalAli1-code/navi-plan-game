import { expect, type Page } from "@playwright/test";

export const decisionRoute = (simulationRunId: string): string =>
  `/app/runs/${encodeURIComponent(simulationRunId)}/decisions`;

export const openDecisionPage = async (
  page: Page,
  simulationRunId: string,
): Promise<void> => {
  await page.goto(decisionRoute(simulationRunId));
  await expect(page.getByRole("heading", { name: /^Decision$/i })).toBeVisible({
    timeout: 15_000,
  });
};

export const waitForCurrentProjection = async (page: Page): Promise<void> => {
  await expect(page.getByText(/Scaffold Decision/i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator("[data-freshness]")).toHaveCount(0);
};

export const selectBalancedOption = async (page: Page): Promise<void> => {
  await page.getByRole("radio", { name: /Balanced option/i }).check();
};

export const enterRationale = async (
  page: Page,
  rationale: string,
): Promise<void> => {
  await page.getByLabel(/Rationale \(optional\)/i).fill(rationale);
};

export const reviewAndSubmit = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: /Review and submit/i }).click();
  await expect(
    page.getByRole("heading", { name: /Confirm submission/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Submit decision$/i }).click();
};

export const decisionStatus = (page: Page) =>
  page.locator(".ps-decision-status");

/** Wait for the mutation-driven resolved phase (status live region). */
export const waitForResolvedPhase = async (page: Page): Promise<void> => {
  await expect(decisionStatus(page)).toContainText(/Decision resolved/i, {
    timeout: 20_000,
  });
};

/** Assert authoritative resolved projection content (works after reload/reopen). */
export const waitForResolvedDecision = async (page: Page): Promise<void> => {
  await expect(page.getByText(/No decisions available/i)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(/Balanced option/i).first()).toBeVisible();
  await expect(page.getByText(/resolved/i).first()).toBeVisible();
  await expect(page.getByText(/Project state:\s*planning/i)).toBeVisible();
  await expect(page.getByText(/budget:\s*105/i)).toBeVisible();
};

export const assertHiddenDataAbsent = async (page: Page): Promise<void> => {
  const html = await page.content();
  const forbidden = [
    "consequenceDefinitions",
    "applicationKey",
    "resolverVersion",
    "learning_signal",
    "stakeholder_signal",
    "analytics_signal",
    "schedule_event",
    "FIXTURE_DELAYED_REVIEW",
    "semanticHash",
    "service_role",
    "event_outbox",
    "projection_event_inbox",
  ];
  for (const token of forbidden) {
    expect(html, `UI must not expose ${token}`).not.toContain(token);
  }
};

export const submitButton = (page: Page) =>
  page.getByRole("button", { name: /^Submit decision$/i });

export const reviewButton = (page: Page) =>
  page.getByRole("button", { name: /Review and submit/i });
