import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/')
  })

  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('should show onboarding welcome page for new users', async ({ page }) => {
    // Mock authenticated user without onboarding
    // In a real test, you'd set up proper auth state
    await page.goto('/onboarding/welcome')
    
    // Check welcome page content
    await expect(page.getByRole('heading', { name: 'Welcome to Your Wedding Journey' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible()
  })

  test('should navigate through onboarding steps', async ({ page }) => {
    await page.goto('/onboarding/welcome')
    
    // Click Get Started
    await page.getByRole('button', { name: 'Get Started' }).click()
    await expect(page).toHaveURL('/onboarding/profile')
    
    // Fill profile form
    await page.getByLabel('Your name *').fill('Test User')
    await page.getByLabel('Partner\'s name (optional)').fill('Test Partner')
    await page.selectOption('select[id="role"]', 'bride')
    await page.selectOption('select[id="country"]', 'US')
    
    // Continue to event page
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL('/onboarding/event')
    
    // Fill event form
    await page.getByLabel('Yes, we have a date').check()
    await page.getByLabel('Wedding date *').fill('2025-06-15')
    await page.getByLabel('Wedding location (city) *').fill('New York')
    await page.getByLabel('Estimated number of guests *').fill('150')
    
    // Continue through remaining steps
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).toHaveURL('/onboarding/invite')
  })

  test('should allow skipping optional steps', async ({ page }) => {
    await page.goto('/onboarding/invite')
    
    // Check skip button is visible
    await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible()
    
    // Skip the invite step
    await page.getByRole('button', { name: 'Skip' }).click()
    await expect(page).toHaveURL('/onboarding/budget')
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/onboarding/profile')
    
    // Try to continue without filling required fields
    await page.getByRole('button', { name: 'Continue' }).click()
    
    // Should show validation errors
    await expect(page.getByText('Your name is required')).toBeVisible()
    await expect(page.getByText('Please select your role')).toBeVisible()
    await expect(page.getByText('Please select your country')).toBeVisible()
    
    // Should stay on the same page
    await expect(page).toHaveURL('/onboarding/profile')
  })

  test('should save and exit functionality', async ({ page }) => {
    await page.goto('/onboarding/profile')
    
    // Fill some data
    await page.getByLabel('Your name *').fill('Test User')
    
    // Click Save & Exit
    await page.getByRole('button', { name: 'Save & Exit' }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/onboarding/profile')
    
    // Check step indicator
    await expect(page.getByText('Step 2 of 8')).toBeVisible()
    
    // Navigate to event step
    await page.goto('/onboarding/event')
    await expect(page.getByText('Step 3 of 8')).toBeVisible()
  })

  test('should complete onboarding and redirect to dashboard', async ({ page }) => {
    await page.goto('/onboarding/review')
    
    // Check review page shows
    await expect(page.getByRole('heading', { name: 'Review your wedding details' })).toBeVisible()
    
    // Click Generate My Plan
    await page.getByRole('button', { name: 'Generate My Plan' }).click()
    
    // Should show success page
    await expect(page).toHaveURL('/onboarding/success')
    await expect(page.getByRole('heading', { name: 'Welcome to Your Wedding Command Center!' })).toBeVisible()
    
    // Click Go to Dashboard
    await page.getByRole('button', { name: 'Go to Dashboard' }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should persist data between steps', async ({ page }) => {
    // Go to profile and fill data
    await page.goto('/onboarding/profile')
    await page.getByLabel('Your name *').fill('Test User')
    await page.selectOption('select[id="role"]', 'bride')
    await page.selectOption('select[id="country"]', 'US')
    
    // Navigate away and come back
    await page.goto('/onboarding/event')
    await page.goto('/onboarding/profile')
    
    // Data should be preserved
    await expect(page.getByLabel('Your name *')).toHaveValue('Test User')
    await expect(page.locator('select[id="role"]')).toHaveValue('bride')
    await expect(page.locator('select[id="country"]')).toHaveValue('US')
  })

  test('should handle back navigation', async ({ page }) => {
    await page.goto('/onboarding/event')
    
    // Click back button
    await page.getByRole('button', { name: 'Back' }).click()
    
    // Should go to previous step
    await expect(page).toHaveURL('/onboarding/profile')
  })
})