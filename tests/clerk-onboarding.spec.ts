import { test, expect, Page } from '@playwright/test';

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'John Doe',
  partnerName: 'Jane Smith',
  weddingDate: '2025-06-15',
  venueName: 'The Grand Ballroom',
  venueLocation: 'San Francisco, CA',
  guestCount: 150,
  budget: 75000,
  weddingStyle: 'modern'
};

// Helper function to wait for Clerk to be ready
async function waitForClerkReady(page: Page) {
  await page.waitForFunction(
    () => window.Clerk !== undefined,
    { timeout: 10000 }
  );
}

// Helper to handle Clerk's iframe forms
async function fillClerkSignUpForm(page: Page) {
  // Wait for Clerk sign-up form to be ready
  await page.waitForSelector('.cl-rootBox', { timeout: 10000 });
  
  // Fill in the email
  await page.fill('input[name="emailAddress"]', testUser.email);
  
  // Click continue
  await page.click('button[data-localization-key="formButtonPrimary"]');
  
  // Wait for password field
  await page.waitForSelector('input[name="password"]', { timeout: 5000 });
  
  // Fill in password
  await page.fill('input[name="password"]', testUser.password);
  
  // Fill in first name and last name if available
  const firstNameInput = await page.$('input[name="firstName"]');
  if (firstNameInput) {
    await page.fill('input[name="firstName"]', 'John');
  }
  
  const lastNameInput = await page.$('input[name="lastName"]');
  if (lastNameInput) {
    await page.fill('input[name="lastName"]', 'Doe');
  }
  
  // Submit the form
  await page.click('button[data-localization-key="formButtonPrimary"]');
  
  // Handle email verification if required (Clerk might show a verification step)
  try {
    await page.waitForSelector('[data-localization-key="signUp.emailCode.title"]', { timeout: 3000 });
    console.log('Email verification required - skipping for test environment');
    // In a real test, you'd need to handle email verification
    // For now, we'll assume test mode bypasses this
  } catch {
    // No email verification required
  }
}

test.describe('Clerk Onboarding Flow', () => {
  test('Complete sign-up and onboarding flow', async ({ page }) => {
    // Step 1: Navigate to sign-up page
    await page.goto('/sign-up');
    
    // Wait for Clerk to load
    await waitForClerkReady(page);
    
    // Step 2: Create new account with Clerk
    await fillClerkSignUpForm(page);
    
    // Wait for redirect to onboarding
    await page.waitForURL('**/onboarding', { timeout: 10000 });
    
    // Verify we're on the onboarding page
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.locator('h1')).toContainText('Welcome to Your Wedding Journey');
    
    // Step 3: Complete Step 1 - About You
    await page.waitForSelector('input[placeholder="Enter your full name"]');
    
    // Clear and fill partner 1 name (might be pre-filled from Clerk)
    const partner1Input = page.locator('input[placeholder="Enter your full name"]');
    await partner1Input.clear();
    await partner1Input.fill(testUser.fullName);
    
    // Fill partner 2 name
    await page.fill('input[placeholder="Enter partner\'s full name"]', testUser.partnerName);
    
    // Click Next
    await page.click('button:has-text("Next Step")');
    
    // Verify we moved to step 2
    await expect(page.locator('.form-section-title')).toContainText('Your Wedding Vision');
    
    // Step 4: Complete Step 2 - Wedding Details
    // Click on date picker
    await page.click('input[placeholder="Choose your special day"]');
    
    // Select a date (simplified - just type it)
    await page.fill('input[placeholder="Choose your special day"]', testUser.weddingDate);
    
    // Select wedding style
    await page.selectOption('select', testUser.weddingStyle);
    
    // Click Next
    await page.click('button:has-text("Next Step")');
    
    // Step 5: Complete Step 3 - Venue Information
    await expect(page.locator('.form-section-title')).toContainText('Venue & Location');
    
    await page.fill('input[placeholder="e.g., The Grand Ballroom"]', testUser.venueName);
    await page.fill('input[placeholder="e.g., San Francisco, CA"]', testUser.venueLocation);
    
    // Click Next
    await page.click('button:has-text("Next Step")');
    
    // Step 6: Complete Step 4 - Planning Details
    await expect(page.locator('.form-section-title')).toContainText('Planning & Budget');
    
    // Clear and fill guest count
    const guestInput = page.locator('input[placeholder="100"]');
    await guestInput.clear();
    await guestInput.fill(testUser.guestCount.toString());
    
    // Clear and fill budget
    const budgetInput = page.locator('input[placeholder="50,000"]');
    await budgetInput.clear();
    await budgetInput.fill(testUser.budget.toString());
    
    // Click Complete Setup
    await page.click('button:has-text("Complete Setup")');
    
    // Step 7: Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify dashboard loaded successfully
    await expect(page.locator('h1')).toContainText(/Welcome|Dashboard/i);
  });

  test('Form validation works correctly', async ({ page }) => {
    // Navigate directly to onboarding (assuming we have a test user logged in)
    await page.goto('/onboarding');
    
    // Try to submit empty form
    await page.click('button:has-text("Next Step")');
    
    // Should see validation error
    await expect(page.locator('.error-message')).toContainText('Your name is required');
    
    // Fill in required field
    await page.fill('input[placeholder="Enter your full name"]', testUser.fullName);
    
    // Error should disappear
    await expect(page.locator('.error-message')).not.toBeVisible();
    
    // Should be able to proceed now
    await page.click('button:has-text("Next Step")');
    await expect(page.locator('.form-section-title')).toContainText('Your Wedding Vision');
  });

  test('Skip functionality works', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');
    
    // Fill required field in step 1
    await page.fill('input[placeholder="Enter your full name"]', testUser.fullName);
    await page.click('button:has-text("Next Step")');
    
    // On step 2, click Skip
    await page.click('button:has-text("Skip for now")');
    
    // Should move to step 3
    await expect(page.locator('.form-section-title')).toContainText('Venue & Location');
    
    // Skip again
    await page.click('button:has-text("Skip for now")');
    
    // Should move to step 4
    await expect(page.locator('.form-section-title')).toContainText('Planning & Budget');
  });

  test('Navigation between steps works', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Fill step 1 and move forward
    await page.fill('input[placeholder="Enter your full name"]', testUser.fullName);
    await page.click('button:has-text("Next Step")');
    
    // Should be on step 2
    await expect(page.locator('.form-section-title')).toContainText('Your Wedding Vision');
    
    // Go back
    await page.click('button:has-text("Previous")');
    
    // Should be back on step 1
    await expect(page.locator('.form-section-title')).toContainText('Tell Us About You');
    
    // Data should be preserved
    await expect(page.locator('input[placeholder="Enter your full name"]')).toHaveValue(testUser.fullName);
  });

  test('Data persistence across page refresh', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Fill some data
    await page.fill('input[placeholder="Enter your full name"]', testUser.fullName);
    await page.fill('input[placeholder="Enter partner\'s full name"]', testUser.partnerName);
    
    // Wait for auto-save
    await page.waitForTimeout(1500);
    await expect(page.locator('.save-indicator')).toContainText('Progress saved automatically');
    
    // Refresh the page
    await page.reload();
    
    // Data should be preserved
    await expect(page.locator('input[placeholder="Enter your full name"]')).toHaveValue(testUser.fullName);
    await expect(page.locator('input[placeholder="Enter partner\'s full name"]')).toHaveValue(testUser.partnerName);
  });

  test('Progress indicators update correctly', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Check initial progress
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    await expect(page.locator('text=25% Complete')).toBeVisible();
    
    // Move to step 2
    await page.fill('input[placeholder="Enter your full name"]', testUser.fullName);
    await page.click('button:has-text("Next Step")');
    
    // Progress should update
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
    await expect(page.locator('text=50% Complete')).toBeVisible();
    
    // Check step indicators
    const step1Indicator = page.locator('.w-8.h-8.rounded-full').first();
    await expect(step1Indicator).toHaveClass(/bg-green-500/); // Completed
  });

  test('Guest count and budget validation', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Navigate to step 4
    await page.fill('input[placeholder="Enter your full name"]', testUser.fullName);
    await page.click('button:has-text("Next Step")');
    await page.click('button:has-text("Skip for now")'); // Skip step 2
    await page.click('button:has-text("Skip for now")'); // Skip step 3
    
    // Try invalid guest count
    const guestInput = page.locator('input[placeholder="100"]');
    await guestInput.clear();
    await guestInput.fill('0');
    await page.click('button:has-text("Complete Setup")');
    
    await expect(page.locator('.error-message')).toContainText('Guest count must be between 1 and 1000');
    
    // Try negative budget
    const budgetInput = page.locator('input[placeholder="50,000"]');
    await budgetInput.clear();
    await budgetInput.fill('-1000');
    await page.click('button:has-text("Complete Setup")');
    
    await expect(page.locator('.error-message')).toContainText('Budget cannot be negative');
    
    // Fix values
    await guestInput.clear();
    await guestInput.fill('100');
    await budgetInput.clear();
    await budgetInput.fill('50000');
    
    // Errors should be gone
    await expect(page.locator('.error-message')).not.toBeVisible();
  });
});