import { test, expect } from "@playwright/test";

test("individual onboarding: sign up → my own event → name space → baby shower → land in event", async ({
  page,
}) => {
  const email = `ind_${Date.now()}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();

  // A brand-new user is routed to onboarding (0 workspaces → /dashboard redirects to /onboarding).
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planning my own event/i }).click();

  await expect(page).toHaveURL(/\/onboarding\/individual$/);
  // The word "organization" must never appear in the consumer flow.
  await expect(page.locator("body")).not.toContainText(/organization/i);
  await page.getByLabel("Space name").fill("Ada's Planning");
  await page.getByLabel("Event type").selectOption("bridal_shower");
  await page.getByLabel("Event name").fill("Sarah's Baby Shower");
  await page.getByRole("button", { name: "Start planning" }).click();

  // Lands inside the event's module page.
  await expect(page).toHaveURL(/\/event\/.+/);
  await expect(page.locator('[data-module="guests"]')).toHaveAttribute("data-locked", "false");
  await expect(page.locator('[data-module="seating"]')).toHaveAttribute("data-locked", "true");
});

test("business onboarding: sign up → planner/business → name → dashboard shows the business", async ({
  page,
}) => {
  const email = `biz_${Date.now()}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planner \/ business/i }).click();

  await expect(page).toHaveURL(/\/onboarding\/business$/);
  await page.getByLabel("Business name").fill("Bliss Events");
  await page.getByRole("button", { name: "Create business" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Bliss Events" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create an event" })).toBeVisible(); // business terminology
});
