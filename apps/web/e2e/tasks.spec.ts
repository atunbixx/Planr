import { test, expect } from "@playwright/test";

test("host adds tasks, marks one done, sets a past due date → overdue, removes a task", async ({
  page,
}) => {
  const email = `tasks_${Date.now()}@example.com`;

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

  // Open the Checklist tool from the toolkit
  await page.getByRole("link", { name: "Tasks" }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByText("0 tasks", { exact: false })).toBeVisible();

  // Add a task with a past due date → should count as overdue
  await page.getByLabel("Task title").fill("Book the caterer");
  await page.getByLabel("Task due date").fill("2020-01-01");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByText("Book the caterer")).toBeVisible();
  await expect(page.getByText("1 tasks", { exact: false })).toBeVisible();
  await expect(page.getByText("1 overdue", { exact: false })).toBeVisible();

  // Add a second task (no due date)
  await page.getByLabel("Task title").fill("Send invitations");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByText("2 tasks", { exact: false })).toBeVisible();

  // Mark the caterer task done → done count rises, overdue clears (done is never overdue)
  const caterer = page.locator("li", { hasText: "Book the caterer" });
  await caterer.getByRole("button", { name: /Mark Book the caterer done/i }).click();
  await expect(page.getByText("1 done", { exact: false })).toBeVisible();
  await expect(page.getByText("0 overdue", { exact: false })).toBeVisible();

  // Remove the invitations task
  const invites = page.locator("li", { hasText: "Send invitations" });
  await invites.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Send invitations")).toHaveCount(0);
  await expect(page.getByText("1 tasks", { exact: false })).toBeVisible();
});

test("host generates a dated wedding checklist from the event date", async ({ page }) => {
  const email = `chk_${Date.now()}@example.com`;

  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planning my own event/i }).click();
  await page.getByLabel("Space name").fill("Our Wedding Space");
  await page.getByLabel("Event type").selectOption("wedding");
  await page.getByLabel("Event name").fill("Our Wedding");
  await page.getByLabel("Event date").fill("2099-06-12");
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page).toHaveURL(/\/event\/.+/);

  // Open the checklist and generate from the template
  await page.locator(`[data-module="tasks"] a`).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await page.getByRole("button", { name: "Generate checklist" }).click();

  // The dated timeline appears
  await expect(page.getByText("Book your venue")).toBeVisible();
  await expect(page.getByText("Finalise the seating plan")).toBeVisible();
  // and the generate banner is gone (one-shot)
  await expect(page.getByRole("button", { name: "Generate checklist" })).toHaveCount(0);
});
