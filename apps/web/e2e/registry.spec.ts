import { test, expect, type Page } from "@playwright/test";

// The add form lives in a <details> panel that collapses on re-render after a
// server action. This ensures it's open before we fill it.
async function openAddPanel(page: Page) {
  if (!(await page.getByLabel("Gift title").isVisible())) {
    await page.getByText("+ Add a gift or cash fund").click();
  }
}

test("host adds a gift and a cash fund; guests view and contribute on the public site", async ({
  page,
  browser,
}) => {
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

  // Add a normal gift
  await page.locator(`[data-module="gift_registry"] a`).click();
  await expect(page).toHaveURL(/\/registry$/);
  await openAddPanel(page);
  await page.getByLabel("Gift title").fill("Stand mixer");
  await page.getByLabel("Gift price").fill("199.99");
  await page.getByRole("button", { name: "Add to registry" }).click();
  await expect(page.getByText("Stand mixer")).toBeVisible();

  // Add a cash fund with a goal
  await openAddPanel(page);
  await page.getByLabel("Gift title").fill("Honeymoon fund");
  await page.getByLabel("This is a cash fund").check();
  await page.getByLabel("Fund goal").fill("2000");
  await page.getByRole("button", { name: "Add to registry" }).click();
  await expect(page.getByText("Honeymoon fund")).toBeVisible();
  await expect(page.getByText("Cash fund", { exact: true })).toBeVisible();

  // Publish the website
  await page.getByRole("link", { name: "← Event" }).click();
  await page.getByRole("link", { name: "Event website" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Save website" }).click();
  const href = await page.locator(".gsummary a").getAttribute("href");

  // Visitor sees the registry + cash fund, then contributes
  const visitor = await browser.newContext();
  const vp = await visitor.newPage();
  await vp.goto(href!);
  await expect(vp.getByRole("heading", { name: "Gift registry" })).toBeVisible();
  await expect(vp.getByText("Stand mixer")).toBeVisible();
  await expect(vp.getByText("Honeymoon fund")).toBeVisible();
  await expect(vp.getByText("£0.00 raised", { exact: false })).toBeVisible();

  await vp.getByText("Contribute to this fund").click();
  await vp.getByLabel("Your name for Honeymoon fund").fill("Aunt May");
  await vp.getByLabel("Amount for Honeymoon fund").fill("150");
  await vp.getByLabel("Message for Honeymoon fund").fill("Have the best time!");
  await vp.getByRole("button", { name: "Contribute" }).click();
  await expect(vp.getByText("£150.00 raised", { exact: false })).toBeVisible();
  await visitor.close();

  // Host sees the contribution on the registry page
  await page.getByRole("link", { name: "← Event" }).click();
  await page.locator(`[data-module="gift_registry"] a`).click();
  await expect(page).toHaveURL(/\/registry$/);
  await expect(page.getByText("£150.00 contributed", { exact: false })).toBeVisible();
  await expect(page.getByText("Aunt May")).toBeVisible();
  await expect(page.getByText("Have the best time!", { exact: false })).toBeVisible();
});
