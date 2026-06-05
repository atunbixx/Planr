import { test, expect } from "@playwright/test";

test("a guest RSVPs via their link with no account; the host sees the response", async ({
  page,
  browser,
}) => {
  const email = `rsvp_${Date.now()}@example.com`;

  // Host: sign up + onboard → event
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

  // Host: add a guest
  await page.getByRole("link", { name: "Guests" }).click();
  await page.getByLabel("Guest name").fill("Aunt Mary");
  await page.getByRole("button", { name: "Add guest" }).click();
  await expect(page.getByText("Aunt Mary")).toBeVisible();

  // Host: open the RSVP page and read Aunt Mary's private link
  await page.getByRole("link", { name: "← Event" }).click();
  await page.getByRole("link", { name: "RSVP" }).click();
  await expect(page).toHaveURL(/\/rsvp$/);
  const link = await page.getByLabel("RSVP link for Aunt Mary").inputValue();
  const token = link.split("/rsvp/")[1]!;
  expect(token).toBeTruthy();

  // Guest: a brand-new, UNAUTHENTICATED browser context follows the link
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/rsvp/${token}`);
  await expect(guestPage.getByRole("heading", { name: "Our Wedding" })).toBeVisible();
  await expect(guestPage.getByText("Aunt Mary")).toBeVisible();

  // Guest: accept + plus-one
  await guestPage.getByLabel("Joyfully accepts").check();
  await guestPage.getByLabel("I'll bring a plus-one").check();
  await guestPage.getByRole("button", { name: "Send RSVP" }).click();
  await expect(guestPage.getByText(/marked as/i)).toContainText("Coming");
  await guestContext.close();

  // Host: refresh → the response is reflected
  await page.reload();
  await expect(page.getByText("1 coming", { exact: false })).toBeVisible();
  await expect(page.locator(".rsvplist li", { hasText: "Aunt Mary" })).toHaveAttribute(
    "data-rsvp",
    "coming",
  );
});
