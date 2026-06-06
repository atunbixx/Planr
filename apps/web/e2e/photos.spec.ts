import { test, expect } from "@playwright/test";

// A 1x1 PNG — enough to exercise the real upload → storage → gallery path.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

test("a guest uploads a photo via their RSVP link; the host gallery shows it", async ({
  page,
  browser,
}) => {
  const email = `pho_${Date.now()}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planning my own event/i }).click();
  await page.getByLabel("Space name").fill("Our Wedding Space");
  await page.getByLabel("Event type").selectOption("wedding");
  await page.getByLabel("Event name").fill("Sophie & James");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page).toHaveURL(/\/event\/.+/);

  // Add a guest, then grab their RSVP link
  await page.locator(`[data-module="guests"] a`).click();
  await page.getByLabel("Guest name").fill("Aunt Mary");
  await page.getByRole("button", { name: "Add guest" }).click();
  await expect(page.getByText("Aunt Mary")).toBeVisible();
  await page.getByRole("link", { name: "← Event" }).click();
  await page.getByRole("link", { name: "RSVP" }).click();
  const link = await page.getByLabel("RSVP link for Aunt Mary").inputValue();
  const token = link.split("/rsvp/")[1]!;

  // Guest (unauthenticated) uploads a photo
  const visitor = await browser.newContext();
  const vp = await visitor.newPage();
  await vp.goto(`/rsvp/${token}`);
  await vp
    .getByLabel("Photo", { exact: true })
    .setInputFiles({ name: "us.png", mimeType: "image/png", buffer: PNG });
  await vp.getByLabel("Photo caption").fill("On the dance floor");
  await vp.getByRole("button", { name: "Upload photo" }).click();
  // give the server action a beat to finish the upload+record
  await vp.waitForTimeout(1500);
  await visitor.close();

  // Host sees it in the gallery
  await page.getByRole("link", { name: "← Event" }).click();
  await page.getByRole("link", { name: "Photos" }).click();
  await expect(page).toHaveURL(/\/photos$/);
  await expect(page.locator(".photogrid li")).toHaveCount(1);
});
