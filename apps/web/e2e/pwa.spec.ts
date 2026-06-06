import { test, expect } from "@playwright/test";

test("PWA: manifest, service worker and icons are served and linked", async ({ page }) => {
  await page.goto("/sign-in");

  // manifest is linked in <head>
  expect(await page.locator('link[rel="manifest"]').count()).toBeGreaterThan(0);

  // manifest is served and well-formed
  const m = await page.request.get("/manifest.webmanifest");
  expect(m.ok()).toBeTruthy();
  const json = await m.json();
  expect(json.name).toContain("Planr");
  expect(json.display).toBe("standalone");
  expect(json.start_url).toBe("/dashboard");
  expect(Array.isArray(json.icons) && json.icons.length).toBeGreaterThan(0);

  // service worker + icons are served
  expect((await page.request.get("/sw.js")).ok()).toBeTruthy();
  expect((await page.request.get("/icon.svg")).ok()).toBeTruthy();
  expect((await page.request.get("/icon-maskable.svg")).ok()).toBeTruthy();
});
