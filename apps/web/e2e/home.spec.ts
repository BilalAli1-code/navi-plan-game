import { expect, test } from "@playwright/test";

test("given_the_home_page_when_loaded_then_decision_ui_shell_shows", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /decision ui/i }),
  ).toBeVisible();

  // Preview/CI serve production builds, so DEV-only session controls are absent.
  await expect(
    page.getByRole("status").filter({
      hasText: /sign in with supabase auth to load decision projections/i,
    }),
  ).toBeVisible();
});
