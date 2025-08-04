import { test, expect, Page } from '@playwright/test';

// Test configuration
const ONBOARDING_URL = '/onboarding';
const SIGNIN_URL = '/auth/signin';
const DASHBOARD_URL = '/dashboard';

// Test data
const testUser = {
  email: 'hello@atunbi.net',
  password: 'Teniola=1',
  partner1Name: 'John Smith',
  partner2Name: 'Jane Doe',
  weddingDate: '2025-06-15',
  venueName: 'Grand Ballroom',
  venueLocation: 'San Francisco, CA',
  guestCount: '150',
  budget: '75000',
  weddingStyle: 'modern'
};

// Helper functions
async function signInUser(page: Page) {
  await page.goto(SIGNIN_URL);
  await page.fill('input[type="email"]', testUser.email);
  await page.fill('input[type="password"]', testUser.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL(url => url.pathname === DASHBOARD_URL || url.pathname === ONBOARDING_URL, {
    timeout: 10000
  });
}

async function waitForStableForm(page: Page) {
  // Wait for any animations or state changes to settle
  await page.waitForTimeout(1000);
  
  // Ensure no elements are shaking by checking for stable positions
  const formCard = page.locator('.form-card').first();
  if (await formCard.isVisible()) {
    const initialBox = await formCard.boundingBox();
    await page.waitForTimeout(500);
    const finalBox = await formCard.boundingBox();
    
    if (initialBox && finalBox) {
      expect(Math.abs(initialBox.x - finalBox.x)).toBeLessThan(1);
      expect(Math.abs(initialBox.y - finalBox.y)).toBeLessThan(1);
    }
  }
}

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should redirect to signin when not authenticated', async ({ page }) => {
    await page.goto(ONBOARDING_URL);
    
    // Should redirect to signin
    await expect(page).toHaveURL(new RegExp(SIGNIN_URL));
  });

  test('should display onboarding page after signin', async ({ page }) => {
    await signInUser(page);
    
    // Navigate to onboarding if not already there
    if (page.url().includes(DASHBOARD_URL)) {
      await page.goto(ONBOARDING_URL);
    }
    
    // Verify onboarding elements are present
    await expect(page.locator('h1')).toContainText('Welcome to Your Wedding Journey');
    await expect(page.locator('.progress-bar')).toBeVisible();
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
  });

  test('should have stable form elements without shaking', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    
    await waitForStableForm(page);
    
    // Test input stability by typing
    const nameInput = page.locator('input[placeholder*="Enter your full name"]');
    await expect(nameInput).toBeVisible();
    
    // Record initial position
    const initialBox = await nameInput.boundingBox();
    
    // Type in the input
    await nameInput.fill('Test User');
    await page.waitForTimeout(500);
    
    // Check position hasn't changed significantly
    const finalBox = await nameInput.boundingBox();
    if (initialBox && finalBox) {
      expect(Math.abs(initialBox.x - finalBox.x)).toBeLessThan(2);
      expect(Math.abs(initialBox.y - finalBox.y)).toBeLessThan(2);
    }
  });

  test('should complete step 1 - About You', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Fill out step 1
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.fill('input[placeholder*="Enter partner\'s full name"]', testUser.partner2Name);
    
    // Verify auto-save indicator appears
    await expect(page.locator('text=Progress saved automatically')).toBeVisible({ timeout: 5000 });
    
    // Click Next
    await page.click('button:has-text("Next Step")');
    
    // Should advance to step 2
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Wedding Details');
  });

  test('should complete step 2 - Wedding Details', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Fill step 1 and advance
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.click('button:has-text("Next Step")');
    
    await waitForStableForm(page);
    
    // Fill step 2
    await page.selectOption('select', testUser.weddingStyle);
    
    // Handle date picker if present
    const dateInput = page.locator('input[placeholder*="Choose your special day"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(testUser.weddingDate);
    }
    
    // Click Next
    await page.click('button:has-text("Next Step")');
    
    // Should advance to step 3
    await expect(page.locator('text=Step 3 of 4')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Venue & Location');
  });

  test('should complete step 3 - Venue Information', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Navigate to step 3
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.click('button:has-text("Next Step")');
    await page.click('button:has-text("Next Step")');
    
    await waitForStableForm(page);
    
    // Fill step 3
    await page.fill('input[placeholder*="The Grand Ballroom"]', testUser.venueName);
    await page.fill('input[placeholder*="San Francisco, CA"]', testUser.venueLocation);
    
    // Click Next
    await page.click('button:has-text("Next Step")');
    
    // Should advance to step 4
    await expect(page.locator('text=Step 4 of 4')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Planning & Budget');
  });

  test('should complete step 4 - Planning Details', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Navigate to step 4
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.click('button:has-text("Next Step")');
    await page.click('button:has-text("Next Step")');
    await page.click('button:has-text("Next Step")');
    
    await waitForStableForm(page);
    
    // Fill step 4
    await page.fill('input[placeholder="100"]', testUser.guestCount);
    await page.fill('input[placeholder="50,000"]', testUser.budget);
    
    // Verify Complete Setup button is visible
    await expect(page.locator('button:has-text("Complete Setup")')).toBeVisible();
  });

  test('should complete full onboarding flow', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Step 1: About You
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.fill('input[placeholder*="Enter partner\'s full name"]', testUser.partner2Name);
    await page.click('button:has-text("Next Step")');
    
    // Step 2: Wedding Details
    await waitForStableForm(page);
    await page.selectOption('select', testUser.weddingStyle);
    
    const dateInput = page.locator('input[placeholder*="Choose your special day"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(testUser.weddingDate);
    }
    await page.click('button:has-text("Next Step")');
    
    // Step 3: Venue Information
    await waitForStableForm(page);
    await page.fill('input[placeholder*="The Grand Ballroom"]', testUser.venueName);
    await page.fill('input[placeholder*="San Francisco, CA"]', testUser.venueLocation);
    await page.click('button:has-text("Next Step")');
    
    // Step 4: Planning Details
    await waitForStableForm(page);
    await page.fill('input[placeholder="100"]', testUser.guestCount);
    await page.fill('input[placeholder="50,000"]', testUser.budget);
    
    // Complete the onboarding
    await page.click('button:has-text("Complete Setup")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(new RegExp(DASHBOARD_URL), { timeout: 15000 });
    
    // Verify we're on the dashboard
    await expect(page.locator('h1')).toContainText('Wedding Dashboard', { timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Try to proceed without filling required field
    await page.click('button:has-text("Next Step")');
    
    // Should show validation error
    await expect(page.locator('text=Your name is required')).toBeVisible();
    
    // Should still be on step 1
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
  });

  test('should allow skipping optional steps', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Fill required field in step 1
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.click('button:has-text("Next Step")');
    
    // Skip step 2
    await waitForStableForm(page);
    await page.click('button:has-text("Skip for now")');
    
    // Should advance to step 3
    await expect(page.locator('text=Step 3 of 4')).toBeVisible();
  });

  test('should persist data across page refreshes', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Fill some data
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.fill('input[placeholder*="Enter partner\'s full name"]', testUser.partner2Name);
    
    // Wait for auto-save
    await expect(page.locator('text=Progress saved automatically')).toBeVisible({ timeout: 5000 });
    
    // Refresh the page
    await page.reload();
    await waitForStableForm(page);
    
    // Data should be restored
    await expect(page.locator('input[placeholder*="Enter your full name"]')).toHaveValue(testUser.partner1Name);
    await expect(page.locator('input[placeholder*="Enter partner\'s full name"]')).toHaveValue(testUser.partner2Name);
  });

  test('should handle navigation between steps', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Complete step 1
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.click('button:has-text("Next Step")');
    
    // Go to step 2, then back to step 1
    await waitForStableForm(page);
    await page.click('button:has-text("Previous")');
    
    // Should be back on step 1
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    await expect(page.locator('input[placeholder*="Enter your full name"]')).toHaveValue(testUser.partner1Name);
  });

  test('should show progress indicators correctly', async ({ page }) => {
    await signInUser(page);
    await page.goto(ONBOARDING_URL);
    await waitForStableForm(page);
    
    // Check initial progress
    await expect(page.locator('text=25% Complete')).toBeVisible();
    
    // Complete step 1
    await page.fill('input[placeholder*="Enter your full name"]', testUser.partner1Name);
    await page.click('button:has-text("Next Step")');
    
    // Check progress updated
    await expect(page.locator('text=50% Complete')).toBeVisible();
    
    // Check step indicators
    const stepIndicators = page.locator('.w-8.h-8.rounded-full');
    await expect(stepIndicators.nth(0)).toHaveClass(/bg-green-500/); // Completed step
    await expect(stepIndicators.nth(1)).toHaveClass(/bg-black/); // Current step
  });
});