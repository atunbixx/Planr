import { test, expect } from "@playwright/test";

test("host builds + publishes an event website; a visitor sees it with no account", async ({
  page,
  browser,
}) => {
  const email = `web_${Date.now()}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planning my own event/i }).click();
  await page.getByLabel("Space name").fill("Our Wedding Space");
  await page.getByLabel("Event type").selectOption("wedding");
  await page.getByLabel("Event name").fill("Sophie & James");
  await page.getByLabel("Event date").fill("2099-06-12");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page).toHaveURL(/\/event\/.+/);

  // Open the website editor from the dashboard
  await page.getByRole("link", { name: "Event website" }).click();
  await expect(page).toHaveURL(/\/website$/);

  // Fill, publish, save
  await page.getByLabel("Headline").fill("Forever starts now");
  await page.getByLabel("Our story").fill("We met in a tiny bookshop in 2019.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save website" }).click();

  // The live public link appears; grab its path
  const href = await page.locator(".gsummary a").getAttribute("href");
  expect(href).toMatch(/^\/e\//);

  // A brand-new, unauthenticated visitor opens the public site
  const visitor = await browser.newContext();
  const vp = await visitor.newPage();
  await vp.goto(href!);
  await expect(vp.getByRole("heading", { name: "Sophie & James" })).toBeVisible();
  await expect(vp.getByText("Forever starts now")).toBeVisible();
  await expect(vp.getByText("We met in a tiny bookshop in 2019.")).toBeVisible();
  await expect(vp.getByText("days to go", { exact: false })).toBeVisible();
  await visitor.close();
});
