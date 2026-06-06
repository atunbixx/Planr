import { test, expect } from "@playwright/test";

test("host adds a gift; it appears on the published event website", async ({ page, browser }) => {
  const email = `reg_${Date.now()}@example.com`;

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

  // Add a gift
  await page.locator(`[data-module="gift_registry"] a`).click();
  await expect(page).toHaveURL(/\/registry$/);
  await page.getByLabel("Gift title").fill("Stand mixer");
  await page.getByLabel("Gift price").fill("199.99");
  await page.getByRole("button", { name: "Add gift" }).click();
  await expect(page.getByText("Stand mixer")).toBeVisible();

  // Publish the website
  await page.getByRole("link", { name: "← Event" }).click();
  await page.getByRole("link", { name: "Event website" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save website" }).click();
  const href = await page.locator(".gsummary a").getAttribute("href");

  // Visitor sees the gift registry on the public site
  const visitor = await browser.newContext();
  const vp = await visitor.newPage();
  await vp.goto(href!);
  await expect(vp.getByRole("heading", { name: "Gift registry" })).toBeVisible();
  await expect(vp.getByText("Stand mixer")).toBeVisible();
  await visitor.close();
});
