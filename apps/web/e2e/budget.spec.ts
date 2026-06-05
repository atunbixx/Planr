import { test, expect } from "@playwright/test";

test("host adds budget items with exact money, overspends, sees it surfaced, removes an item", async ({
  page,
}) => {
  const email = `budget_${Date.now()}@example.com`;

  // Sign up + onboard as individual → land in the event
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

  // Open the Budget tool from the toolkit
  await page.getByRole("link", { name: "Budget" }).click();
  await expect(page).toHaveURL(/\/budget$/);
  await expect(page.getByText("£0.00 budgeted", { exact: false })).toBeVisible();

  // Add the venue: £10,000 estimated, £2,500 paid
  await page.getByLabel("Item label").fill("Venue");
  await page.getByLabel("Estimated amount").fill("10000");
  await page.getByLabel("Paid amount").fill("2500");
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText("Venue")).toBeVisible();
  await expect(page.getByText("£10,000.00 budgeted", { exact: false })).toBeVisible();
  await expect(page.getByText("£2,500.00 paid", { exact: false })).toBeVisible();
  await expect(page.getByText("£7,500.00 to go", { exact: false })).toBeVisible();

  // Add the cake: £300 estimated, nothing paid
  await page.getByLabel("Item label").fill("Cake");
  await page.getByLabel("Estimated amount").fill("300");
  await page.getByRole("button", { name: "Add item" }).click();
  await expect(page.getByText("£10,300.00 budgeted", { exact: false })).toBeVisible();

  // Overspend the venue: pay £11,000 → remaining goes negative ("over")
  const venue = page.locator("li", { hasText: "Venue" });
  await venue.getByLabel("Paid for Venue").fill("11000");
  await venue.getByRole("button", { name: "Paid" }).click();
  await expect(page.getByText("-£700.00 over", { exact: false })).toBeVisible();

  // Remove the venue
  await venue.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Venue")).toHaveCount(0);
  await expect(page.getByText("£300.00 budgeted", { exact: false })).toBeVisible();
});
