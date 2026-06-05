import { test, expect } from "@playwright/test";

test("host adds guests, sets RSVP, sees the summary update, removes a guest", async ({ page }) => {
  const email = `host_${Date.now()}@example.com`;

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

  // Open the Guests tool from the toolkit
  await page.getByRole("link", { name: "Guests" }).click();
  await expect(page).toHaveURL(/\/guests$/);
  await expect(page.getByText("0 guests", { exact: false })).toBeVisible();

  // Add a guest, coming
  await page.getByLabel("Guest name").fill("Aunt Mary");
  await page.getByLabel("Guest RSVP").selectOption("coming");
  await page.getByRole("button", { name: "Add guest" }).click();
  await expect(page.getByText("Aunt Mary")).toBeVisible();
  await expect(page.getByText("1 guests", { exact: false })).toBeVisible();
  await expect(page.getByText("1 coming", { exact: false })).toBeVisible();

  // Add a second guest (awaiting), then change them to declined
  await page.getByLabel("Guest name").fill("Uncle Joe");
  await page.getByRole("button", { name: "Add guest" }).click();
  await expect(page.getByText("2 guests", { exact: false })).toBeVisible();
  const joeRow = page.locator("li", { hasText: "Uncle Joe" });
  await joeRow.getByLabel("RSVP for Uncle Joe").selectOption("declined");
  await joeRow.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("1 declined", { exact: false })).toBeVisible();

  // Remove Aunt Mary
  const maryRow = page.locator("li", { hasText: "Aunt Mary" });
  await maryRow.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Aunt Mary")).toHaveCount(0);
  await expect(page.getByText("1 guests", { exact: false })).toBeVisible();
});
