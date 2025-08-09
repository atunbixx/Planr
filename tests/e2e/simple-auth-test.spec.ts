import { test, expect } from '@playwright/test';

test.describe('Simple Authentication Test', () => {
  test('should load sign-up page', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Check page loaded
    await expect(page).toHaveTitle(/Wedding/);
    await expect(page.locator('h1')).toContainText('Create Account');
    
    // Check form elements exist
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('input[id="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button:has-text("Create Account")')).toBeVisible();
  });
  
  test('should load sign-in page', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Check page loaded
    await expect(page).toHaveTitle(/Wedding/);
    await expect(page.locator('h1')).toContainText('Welcome Back');
    
    // Check form elements exist
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
  
  test('should attempt sign up with validation', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Try to submit empty form
    await page.click('button:has-text("Create Account")');
    
    // Fill email only
    await page.fill('input[id="email"]', 'test@example.com');
    await page.click('button:has-text("Create Account")');
    
    // Fill mismatched passwords
    await page.fill('input[id="password"]', 'password123');
    await page.fill('input[id="confirmPassword"]', 'password456');
    await page.click('button:has-text("Create Account")');
    
    // Check for error message
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});