import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

test.describe('Basic User Flow', () => {
  test('should complete registration, onboarding, and basic operations', async ({ page }) => {
    // Generate test data
    const testEmail = faker.internet.email();
    const testPassword = 'TestPassword123!';
    const userName = faker.person.fullName();
    const partnerName = faker.person.fullName();
    
    // 1. Sign up
    await page.goto('/sign-up');
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button:has-text("Create Account")');
    
    // 2. Complete onboarding
    await page.waitForURL('/onboarding', { timeout: 10000 });
    
    // Step 1: About You
    await page.fill('input[id="partner1Name"]', userName);
    await page.fill('input[id="partner2Name"]', partnerName);
    await page.click('button:has-text("Next Step")');
    
    // Step 2: Wedding Details
    const weddingDate = new Date();
    weddingDate.setFullYear(weddingDate.getFullYear() + 1);
    await page.fill('input[id="weddingDate"]', weddingDate.toISOString().split('T')[0]);
    await page.selectOption('select[id="weddingStyle"]', 'modern');
    await page.click('button:has-text("Next Step")');
    
    // Step 3: Venue & Location
    await page.fill('input[id="venueName"]', 'Beautiful Garden Venue');
    await page.fill('input[id="venueLocation"]', 'San Francisco, CA');
    await page.click('button:has-text("Next Step")');
    
    // Step 4: Planning & Budget
    await page.fill('input[id="guestCountEstimate"]', '100');
    await page.fill('input[id="totalBudget"]', '50000');
    await page.click('button:has-text("Complete Setup")');
    
    // 3. Verify dashboard loads
    await page.waitForURL('/dashboard', { timeout: 30000 });
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[role="status"]');
      return loadingElements.length === 0;
    }, { timeout: 30000 });
    
    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Days Until')).toBeVisible();
    
    // 4. Test navigation to guests page
    await page.click('a[href="/dashboard/guests"]');
    await expect(page).toHaveURL('/dashboard/guests');
    await expect(page.getByRole('heading', { name: 'Guest List' })).toBeVisible();
    
    console.log('✅ Basic user flow completed successfully!');
    console.log('✅ Registration and sign-up working');
    console.log('✅ Onboarding flow working');
    console.log('✅ Dashboard loading working');
    console.log('✅ Navigation to guests page working');
  });
});