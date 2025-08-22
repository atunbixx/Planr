// Test cases covering dashboard, guest list, and budget pages with visual assertions
import { test, expect } from '@playwright/test';

test.describe('Dashboard Visual Regression', () => {
  test('@screenshot Dashboard Overview', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot({ fullPage: true });
  });

  test('@screenshot Guest List Page', async ({ page }) => {
    await page.goto('/dashboard/guests');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot({ fullPage: true });
  });

  test('@screenshot Budget Page', async ({ page }) => {
    await page.goto('/dashboard/budget');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot({ fullPage: true });
  });
});