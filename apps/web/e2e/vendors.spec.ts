import { test, expect } from "@playwright/test";

test("host tracks a vendor: add, book, see committed total, decline, remove", async ({ page }) => {
  const email = `ven_${Date.now()}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planning my own event/i }).click();
  await page.getByLabel("Space name").fill("Our Wedding Space");
  await page.getByLabel("Event type").selectOption("wedding");
  await page.getByLabel("Event name").fill("Our Wedding");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page).toHaveURL(/\/event\/.+/);

  await page.locator(`[data-module="vendors"] a`).click();
  await expect(page).toHaveURL(/\/vendors$/);

  // Add a booked florist with a cost
  await page.getByLabel("Vendor name").fill("Bloom Florists");
  await page.getByLabel("Vendor category").fill("Florist");
  await page.getByLabel("Vendor cost").fill("1200");
  await page.getByLabel("Vendor status").selectOption("booked");
  await page.getByRole("button", { name: "Add vendor" }).click();

  await expect(page.getByText("Bloom Florists")).toBeVisible();
  await expect(page.getByText("1 booked", { exact: false })).toBeVisible();
  await expect(page.getByText("£1,200.00 committed", { exact: false })).toBeVisible();

  // Decline it → no longer counts as booked
  const row = page.locator("li", { hasText: "Bloom Florists" });
  await row.getByLabel("Status for Bloom Florists").selectOption("declined");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("0 booked", { exact: false })).toBeVisible();

  // Remove
  await page.locator("li", { hasText: "Bloom Florists" }).getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("No vendors yet", { exact: false })).toBeVisible();
});
