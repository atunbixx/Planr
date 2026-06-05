import { test, expect } from "@playwright/test";

test("owner manages the workspace: rename, invite, and delete with type-to-confirm", async ({ page }) => {
  const email = `admin_${Date.now()}@example.com`;

  // Business onboarding gives a named workspace + dashboard (owner)
  await page.goto("/sign-up");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("link", { name: /planner \/ business/i }).click();
  await page.getByLabel("Business name").fill("Bliss Events");
  await page.getByRole("button", { name: "Create business" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // Open the workspace console from the dashboard header
  await page.getByRole("link", { name: "Workspace settings" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Bliss Events" })).toBeVisible();

  // Rename the workspace
  await page.getByLabel("Workspace name", { exact: true }).fill("Bliss & Co Events");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Bliss & Co Events" })).toBeVisible();

  // Invite a collaborator → shows in pending invitations
  await page.getByLabel("Invite email").fill("partner@example.com");
  await page.getByLabel("Invite role").selectOption("planner");
  await page.getByRole("button", { name: "Invite" }).click();
  await expect(page.getByText("partner@example.com")).toBeVisible();

  // Revoke it
  await page
    .locator(".invitelist li", { hasText: "partner@example.com" })
    .getByRole("button", { name: "Revoke" })
    .click();
  await expect(page.getByText("No pending invitations.")).toBeVisible();

  // Danger zone: typing the wrong name does nothing; the right name deletes + redirects
  const confirmBox = page.getByLabel("Type the workspace name to confirm");
  await confirmBox.fill("wrong name");
  await page.getByRole("button", { name: "Delete workspace" }).click();
  await expect(page).toHaveURL(/\/admin$/); // still here — guard held
  await expect(confirmBox).toHaveValue(""); // wait for the re-render to settle before retrying

  await confirmBox.fill("Bliss & Co Events");
  await page.getByRole("button", { name: "Delete workspace" }).click();
  // Deleting the only workspace leaves zero, so /dashboard bounces to onboarding.
  await expect(page).toHaveURL(/\/onboarding$/);
});
