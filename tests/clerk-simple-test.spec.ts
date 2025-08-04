import { test, expect } from '@playwright/test';

test.describe('Clerk Authentication Basic Tests', () => {
  test.use({
    baseURL: 'http://localhost:3006'
  });

  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Wedding/);
    
    // Check for main heading
    await expect(page.locator('h1').first()).toContainText('WEDDING STUDIO');
    
    // Check for sign in link
    await expect(page.getByRole('link', { name: 'SIGN IN' })).toBeVisible();
  });

  test('sign-in page loads with Clerk', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for Clerk sign-in component
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    
    // Check for Clerk form or root element
    const clerkElement = page.locator('.cl-rootBox, [data-clerk-element]').first();
    await expect(clerkElement).toBeVisible();
  });

  test('sign-up page loads with Clerk', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for Clerk sign-up component
    const clerkElement = page.locator('.cl-rootBox, [data-clerk-element]').first();
    await expect(clerkElement).toBeVisible();
  });

  test('protected route redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test('onboarding page redirects when not authenticated', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });
});