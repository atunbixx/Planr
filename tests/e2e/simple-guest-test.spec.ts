import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-helpers';

test.describe('Simple Guest Test', () => {
  test('should add a guest successfully', async ({ page }) => {
    const helpers = new TestHelpers(page);
    
    // Sign up and complete onboarding
    const testUser = await helpers.signUpAndOnboard();
    console.log('Test user created:', testUser.email);
    
    // Wait for dashboard to load
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[role="status"]');
      return loadingElements.length === 0;
    }, { timeout: 30000 });
    
    // Navigate to guests page
    await page.goto('/dashboard/guests');
    await page.waitForSelector('h1:has-text("Guest List")');
    
    // Click Add Guest button
    await page.click('button:has-text("Add Guest")');
    await page.waitForSelector('h2:has-text("Add Guest")');
    
    // Fill only required fields
    await page.fill('input[type="text"]:near(label:has-text("First Name"))', 'Test');
    await page.fill('input[type="text"]:near(label:has-text("Last Name"))', 'User');
    
    // Select side (required)
    await page.selectOption('select:near(label:has-text("Side"))', 'both');
    
    // Monitor network requests
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/guests') && response.request().method() === 'POST'
    );
    
    // Click submit
    await page.click('button[type="submit"]:has-text("Add Guest")');
    
    // Wait for response
    const response = await responsePromise;
    const responseData = await response.json();
    console.log('API Response:', response.status(), responseData);
    
    if (!response.ok()) {
      throw new Error(`API Error: ${JSON.stringify(responseData)}`);
    }
    
    // Wait for dialog to close
    await expect(page.locator('h2:has-text("Add Guest")')).toBeHidden({ timeout: 10000 });
    
    // Check if guest appears
    await expect(page.locator('text=Test User')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Guest added successfully!');
  });
});