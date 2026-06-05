import { test, expect } from "@playwright/test";

test("host builds a seating plan: tables, seat guests, overfill is surfaced, move, unseat", async ({
  page,
}) => {
  const email = `seating_${Date.now()}@example.com`;

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

  // Add three guests via the Guests tool
  await page.getByRole("link", { name: "Guests" }).click();
  await expect(page).toHaveURL(/\/guests$/);
  for (const name of ["Ada", "Bo", "Cy"]) {
    await page.getByLabel("Guest name").fill(name);
    await page.getByRole("button", { name: "Add guest" }).click();
    await expect(page.getByText(name)).toBeVisible();
  }

  // Back to the event, open Seating
  await page.getByRole("link", { name: "← Event" }).click();
  await page.getByRole("link", { name: "Seating" }).click();
  await expect(page).toHaveURL(/\/seating$/);
  await expect(page.getByText("3 unseated", { exact: false })).toBeVisible();

  // Add a tiny table (capacity 1) and a big one
  await page.getByLabel("Table label").fill("Top");
  await page.getByLabel("Table capacity").fill("1");
  await page.getByRole("button", { name: "Add table" }).click();
  await expect(page.getByText("1 tables", { exact: false })).toBeVisible();
  await page.getByLabel("Table label").fill("Hall");
  await page.getByLabel("Table capacity").fill("8");
  await page.getByRole("button", { name: "Add table" }).click();
  await expect(page.getByText("2 tables", { exact: false })).toBeVisible();

  // Seat Ada at Top
  const adaRow = page.locator(".poollist li", { hasText: "Ada" });
  await adaRow.getByLabel("Seat Ada at").selectOption({ label: "Top" });
  await adaRow.getByRole("button", { name: "Seat" }).click();
  await expect(page.getByText("1 seated", { exact: false })).toBeVisible();

  // Seat Bo at Top too → over capacity (Top holds 1)
  const boRow = page.locator(".poollist li", { hasText: "Bo" });
  await boRow.getByLabel("Seat Bo at").selectOption({ label: "Top" });
  await boRow.getByRole("button", { name: "Seat" }).click();
  await expect(page.getByText("1 over capacity", { exact: false })).toBeVisible();
  await expect(page.locator(".tablecard", { hasText: "Top" })).toHaveAttribute(
    "data-over-capacity",
    "true",
  );

  // Move Bo: unseat from Top, then seat at Hall → over-capacity clears
  await page.getByRole("button", { name: "Unseat Bo" }).click();
  const boAgain = page.locator(".poollist li", { hasText: "Bo" });
  await boAgain.getByLabel("Seat Bo at").selectOption({ label: "Hall" });
  await boAgain.getByRole("button", { name: "Seat" }).click();
  await expect(page.getByText("over capacity")).toHaveCount(0);
  await expect(page.locator(".tablecard", { hasText: "Hall" })).toContainText("Bo");

  // Unseat Ada → back to the pool (2 unseated: Ada + Cy)
  await page.getByRole("button", { name: "Unseat Ada" }).click();
  await expect(page.getByText("2 unseated", { exact: false })).toBeVisible();
});
