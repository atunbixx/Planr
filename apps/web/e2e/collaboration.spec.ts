import { test, expect } from "@playwright/test";

test("owner invites a partner by email → partner signs up and sees the shared workspace", async ({
  browser,
}) => {
  const stamp = Date.now();
  const ownerEmail = `owner_${stamp}@example.com`;
  const partnerEmail = `partner_${stamp}@example.com`;

  // --- Owner: sign up, onboard as individual, invite the partner ---
  const ownerCtx = await browser.newContext();
  const owner = await ownerCtx.newPage();
  await owner.goto("/sign-up");
  await owner.getByLabel("Email").fill(ownerEmail);
  await owner.getByLabel("Password").fill("password123!");
  await owner.getByRole("button", { name: "Sign up" }).click();
  await expect(owner).toHaveURL(/\/onboarding$/);
  await owner.getByRole("link", { name: /planning my own event/i }).click();
  await owner.getByLabel("Space name").fill("Our Wedding Space");
  await owner.getByLabel("Event type").selectOption("wedding");
  await owner.getByLabel("Event name").fill("Our Wedding");
  await owner.getByRole("button", { name: "Start planning" }).click();
  await expect(owner).toHaveURL(/\/event\/.+/);

  await owner.goto("/dashboard");
  await owner.getByLabel("Invite email").fill(partnerEmail);
  await owner.getByLabel("Invite role").selectOption("editor");
  await owner.getByRole("button", { name: /invite/i }).click();

  // --- Partner: sign up with the invited email → auto-accepted into the workspace ---
  const partnerCtx = await browser.newContext();
  const partner = await partnerCtx.newPage();
  await partner.goto("/sign-up");
  await partner.getByLabel("Email").fill(partnerEmail);
  await partner.getByLabel("Password").fill("password123!");
  await partner.getByRole("button", { name: "Sign up" }).click();

  // Partner has the shared workspace now → lands on the dashboard, not onboarding.
  await expect(partner).toHaveURL(/\/dashboard/);
  await expect(partner.getByRole("heading", { name: "Our Wedding Space" })).toBeVisible();
  await expect(partner.getByText("Our Wedding", { exact: true })).toBeVisible();

  // --- Owner sees the partner in the member list ---
  await owner.reload();
  await expect(owner.getByText(partnerEmail)).toBeVisible();

  await ownerCtx.close();
  await partnerCtx.close();
});
