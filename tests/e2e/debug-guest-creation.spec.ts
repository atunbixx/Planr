import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-helpers';

test.describe('Debug Guest Creation', () => {
  test('should debug guest creation flow', async ({ page }) => {
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
    await page.waitForLoadState('networkidle');
    
    // Skip API test for now and go straight to UI
    
    // Now try via UI
    await page.click('button:has-text("Add Guest")');
    await page.waitForSelector('h2:has-text("Add Guest")', { state: 'visible' });
    
    // Fill the form
    await page.locator('div').filter({ hasText: /^First Name \*$/ }).getByRole('textbox').fill('UI Test');
    await page.locator('div').filter({ hasText: /^Last Name \*$/ }).getByRole('textbox').fill('Guest');
    await page.fill('input[type="email"]', 'uitest@example.com');
    
    const sideSelect = page.locator('div').filter({ hasText: /^Side \*Bride's SideGroom's SideBoth$/ }).getByRole('combobox');
    await sideSelect.selectOption('both');
    
    // Check console for errors before submitting
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Click submit
    const submitButton = page.locator('button[type="submit"]:has-text("Add Guest")');
    await submitButton.click();
    
    // Wait a bit and check state
    await page.waitForTimeout(3000);
    
    // Check if dialog is still open
    const dialogStillOpen = await page.locator('h2:has-text("Add Guest")').isVisible();
    console.log('Dialog still open after submit:', dialogStillOpen);
    
    // Check for error message
    const errorElement = page.locator('div.bg-red-50.text-red-600');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('Error displayed:', errorText);
    }
    
    // Check button state
    const buttonText = await submitButton.textContent();
    console.log('Submit button text:', buttonText);
  });
});