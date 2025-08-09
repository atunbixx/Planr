import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Debug Onboarding Flow', () => {
  test('should complete onboarding', async ({ page }) => {
    const testEmail = faker.internet.email();
    const testPassword = 'TestPassword123!';
    
    console.log('Test email:', testEmail);
    
    // First sign up
    await page.goto('/sign-up');
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button:has-text("Create Account")');
    
    // Wait for onboarding
    await page.waitForURL('/onboarding', { timeout: 10000 });
    console.log('Reached onboarding page');
    
    // Listen for network requests
    page.on('response', response => {
      if (response.url().includes('/api/couples')) {
        console.log('API Response:', response.url(), response.status());
        response.text().then(text => {
          console.log('Response body:', text);
        }).catch(() => {});
      }
    });
    
    // Fill step 1
    await page.fill('input[id="partner1Name"]', 'Test User');
    await page.click('button:has-text("Next Step")');
    
    // Fill step 2
    await page.selectOption('select[id="weddingStyle"]', 'modern');
    await page.click('button:has-text("Next Step")');
    
    // Fill step 3 (skip)
    await page.click('button:has-text("Next Step")');
    
    // Fill step 4
    await page.fill('input[id="guestCountEstimate"]', '100');
    await page.fill('input[id="totalBudget"]', '50000');
    
    // Click complete and check what happens
    console.log('Clicking Complete Setup...');
    await page.click('button:has-text("Complete Setup")');
    
    // Wait a bit to see what happens
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('Current URL after 5 seconds:', currentUrl);
    
    // Check for errors
    const errorElement = page.locator('text=error, text=Error, [role="alert"]');
    if (await errorElement.count() > 0) {
      const errorText = await errorElement.first().textContent();
      console.log('Error found:', errorText);
    }
    
    // Check if button is still enabled
    const completeButton = page.locator('button:has-text("Complete Setup")');
    if (await completeButton.isVisible()) {
      const isDisabled = await completeButton.isDisabled();
      console.log('Complete button still visible, disabled:', isDisabled);
    }
  });
});