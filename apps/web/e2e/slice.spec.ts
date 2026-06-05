import { test, expect } from "@playwright/test";

test("sign up → create org → create wedding event → see gated modules", async ({ page }) => {
  const email = `e2e_${Date.now()}@example.com`;

  // Sign up (local Supabase has email confirmations disabled → immediate session).
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(email)).toBeVisible();

  // Create an organization.
  await page.getByLabel("Organization name").fill("E2E Wedding Co");
  await page.getByRole("button", { name: "Create organization" }).click();
  const orgLink = page.getByRole("link", { name: "E2E Wedding Co" });
  await expect(orgLink).toBeVisible();
  await orgLink.click();

  // Create a wedding event.
  await expect(page).toHaveURL(/\/dashboard\/org\/.+/);
  await page.getByLabel("Event name").fill("Our Wedding");
  await page.getByLabel("Event type").selectOption("wedding");
  await page.getByRole("button", { name: "Create event" }).click();
  const eventLink = page.getByRole("link", { name: /Our Wedding \(wedding\)/ });
  await expect(eventLink).toBeVisible();
  await eventLink.click();

  // Gated modules: guests available (free baseline), seating locked (needs plan).
  await expect(page).toHaveURL(/\/event\/.+/);
  const guests = page.locator('[data-module="guests"]');
  const seating = page.locator('[data-module="seating"]');
  await expect(guests).toHaveAttribute("data-locked", "false");
  await expect(seating).toHaveAttribute("data-locked", "true");
  await expect(seating).toContainText("needs_event_type_plan");
});
