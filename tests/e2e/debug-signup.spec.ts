import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Debug Sign Up Flow', () => {
  test('should debug sign-up process', async ({ page }) => {
    const testEmail = faker.internet.email();
    const testPassword = 'TestPassword123!';
    
    console.log('Test email:', testEmail);
    
    // Navigate to sign-up
    await page.goto('/sign-up');
    await expect(page.locator('h1')).toContainText('Create Account');
    
    // Fill form
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    
    // Check button state before clicking
    const createButton = page.locator('button:has-text("Create Account")');
    const isDisabled = await createButton.isDisabled();
    console.log('Button disabled before click:', isDisabled);
    
    // Listen for console messages
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Listen for errors
    page.on('pageerror', err => console.log('Page error:', err.message));
    
    // Listen for network responses
    page.on('response', response => {
      if (response.url().includes('/auth/') || response.url().includes('/api/')) {
        console.log('Response:', response.url(), response.status());
      }
    });
    
    // Click create account
    await createButton.click();
    
    // Wait for any navigation or error
    try {
      await page.waitForURL(/\/(onboarding|dashboard|sign-in)/, { timeout: 10000 });
      console.log('Successfully navigated to:', page.url());
    } catch (e) {
      console.log('Navigation timeout, current URL:', page.url());
      
      // Check for error messages
      const errorElement = page.locator('.text-red-600, [role="alert"], text=error, text=Error');
      if (await errorElement.count() > 0) {
        const errorText = await errorElement.first().textContent();
        console.log('Error message found:', errorText);
      }
      
      // Check button state after click
      const isStillDisabled = await createButton.isDisabled();
      console.log('Button disabled after click:', isStillDisabled);
      
      throw e;
    }
  });
});