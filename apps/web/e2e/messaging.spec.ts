import { test, expect } from "@playwright/test";

test("host posts an announcement; an unauthenticated guest sees it on their RSVP page", async ({
  page,
  browser,
}) => {
  const email = `msg_${Date.now()}@example.com`;

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
  await page.locator(`[data-module="guests"] a`).click();
  await page.getByLabel("Guest name").fill("Aunt Mary");
  await page.getByRole("button", { name: "Add guest" }).click();
  await expect(page.getByText("Aunt Mary")).toBeVisible();

  // Host: post an announcement
  await page.getByRole("link", { name: "← Event" }).click();
  await page.locator(`[data-module="messaging"] a`).click();
  await expect(page).toHaveURL(/\/messaging$/);
  await page.getByLabel("Announcement title").fill("Parking");
  await page.getByLabel("Announcement body").fill("Please use car park B.");
  await page.getByRole("button", { name: "Post" }).click();
  await expect(page.getByText("Parking")).toBeVisible();

  // Host: grab Aunt Mary's RSVP link
  await page.getByRole("link", { name: "← Event" }).click();
  await page.getByRole("link", { name: "RSVP" }).click();
  const link = await page.getByLabel("RSVP link for Aunt Mary").inputValue();
  const token = link.split("/rsvp/")[1]!;

  // Guest: unauthenticated context sees the announcement on the RSVP page
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  await guestPage.goto(`/rsvp/${token}`);
  await expect(guestPage.getByRole("heading", { name: "Our Wedding" })).toBeVisible();
  await expect(guestPage.getByText("News from your host")).toBeVisible();
  await expect(guestPage.getByText("Parking")).toBeVisible();
  await expect(guestPage.getByText("Please use car park B.")).toBeVisible();
  await guestContext.close();
});
