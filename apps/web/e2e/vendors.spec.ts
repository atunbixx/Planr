import { test, expect } from "@playwright/test";

test("host runs the vendor pipeline: add, track payment, move stage, decline, remove", async ({ page }) => {
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

  // Add a booked florist with a cost and a part-payment
  await page.getByRole("group").getByText("+ Add a vendor").click();
  await page.getByLabel("Vendor name").fill("Bloom Florists");
  await page.getByLabel("Vendor category").fill("Florist");
  await page.getByLabel("Vendor cost").fill("1200");
  await page.getByLabel("Vendor paid").fill("300");
  await page.getByLabel("Vendor status").selectOption("booked");
  await page.getByRole("button", { name: "Add vendor" }).click();

  await expect(page.getByText("Bloom Florists")).toBeVisible();
  // Summary reflects estimate, paid, outstanding + stage count
  await expect(page.getByText("£1,200.00", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Booked 1", { exact: false })).toBeVisible();

  // Card shows payment progress
  const card = page.locator('[data-vendor]', { hasText: "Bloom Florists" });
  await expect(card.getByText("£300.00 paid", { exact: false })).toBeVisible();
  await expect(card.getByText("£900.00 due", { exact: false })).toBeVisible();

  // Decline via the quick stage move → no longer counts as booked
  await card.getByLabel("Stage for Bloom Florists").selectOption("declined");
  await card.getByRole("button", { name: "Move" }).click();
  await expect(page.getByText("Booked 0", { exact: false })).toBeVisible();

  // Declined vendors live in their own section; remove from there
  await page.getByText(/^Declined \(1\)$/).click();
  const declinedCard = page.locator('[data-vendor]', { hasText: "Bloom Florists" });
  await declinedCard.getByText("Edit").click();
  await declinedCard.getByRole("button", { name: "Remove vendor" }).click();
  await expect(page.getByText("No vendors yet", { exact: false })).toBeVisible();
});
