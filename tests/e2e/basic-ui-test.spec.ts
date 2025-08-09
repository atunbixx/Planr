import { test, expect } from '@playwright/test';

test.describe('Basic UI Test', () => {
  test('should navigate through public pages', async ({ page }) => {
    // Home page
    await page.goto('/');
    await expect(page).toHaveTitle(/Wedding/);
    
    // Sign up page
    await page.goto('/sign-up');
    await expect(page.locator('h1')).toContainText('Create Account');
    
    // Sign in page  
    await page.goto('/sign-in');
    await expect(page.locator('h1')).toContainText('Welcome Back');
    
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('h1')).toContainText('We couldn\'t find that page');
  });
  
  test('should validate sign-up form', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Test form validation
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'short');
    await page.fill('input[id="confirmPassword"]', 'different');
    
    await page.click('button:has-text("Create Account")');
    
    // Should show validation errors
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});