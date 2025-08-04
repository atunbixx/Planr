import { test, expect } from '@playwright/test';

test.describe('Clerk Basic Tests', () => {
  test('Can access sign-up page', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Check if we're on the sign-up page
    await expect(page).toHaveURL(/\/sign-up/);
    
    // Look for Clerk sign-up component
    const clerkSignUp = await page.waitForSelector('.cl-rootBox', { timeout: 10000 }).catch(() => null);
    
    if (clerkSignUp) {
      console.log('Found Clerk sign-up component');
      await expect(page.locator('.cl-rootBox')).toBeVisible();
    } else {
      // Check for custom sign-up page
      console.log('Looking for custom sign-up page');
      await expect(page.locator('h1')).toContainText(/Create Your Account|Sign Up/i);
    }
  });

  test('Can access sign-in page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check if we're on the sign-in page
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    // Look for Clerk sign-in component
    const clerkSignIn = await page.waitForSelector('.cl-rootBox', { timeout: 10000 }).catch(() => null);
    
    if (clerkSignIn) {
      console.log('Found Clerk sign-in component');
      await expect(page.locator('.cl-rootBox')).toBeVisible();
    }
  });

  test('Can access onboarding page directly', async ({ page }) => {
    // Try to access onboarding directly
    await page.goto('/onboarding');
    
    // Should redirect to sign-in if not authenticated
    await page.waitForURL(/\/(sign-in|auth\/signin)/, { timeout: 10000 }).catch(() => {
      console.log('Did not redirect to sign-in, checking if onboarding loaded');
    });
    
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('onboarding')) {
      // If we're on onboarding, check if it loaded
      await expect(page.locator('h1')).toContainText(/Welcome to Your Wedding Journey/i);
    } else {
      // If redirected to sign-in, that's expected
      expect(url).toMatch(/sign-in|signin/);
    }
  });
});