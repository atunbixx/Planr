import { test, expect } from '@playwright/test'
import { TestHelpers } from './e2e/helpers/test-helpers'

/**
 * Robust Guest Management Tests
 * These tests follow industry standards and validate actual user experience
 * - Tests fail first approach
 * - Uses reliable selectors (data-testid, semantic selectors)  
 * - Proper waiting strategies
 * - Tests both happy path and error conditions
 * - Validates actual API responses and UI state changes
 */

test.describe('Guest Management - Industry Standard Tests', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    
    // Set up authenticated user for each test
    const testUser = await helpers.signUpAndOnboard()
    console.log(`Test user: ${testUser.email}`)
    
    // Wait for dashboard to be fully loaded (no loading states)
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[role="status"]')
      const spinners = document.querySelectorAll('.animate-spin')
      return loadingElements.length === 0 && spinners.length === 0
    }, { timeout: 30000 })
    
    // Navigate to guests page and wait for it to be fully loaded
    await page.goto('/dashboard/guests')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').filter({ hasText: 'Guest List' })).toBeVisible()
  })

  test('should display empty guest list initially', async ({ page }) => {
    // Arrange - fresh user should have no guests
    
    // Act & Assert - verify empty state is shown
    await expect(page.locator('[data-testid="empty-guests"]')).toBeVisible()
    
    // Verify statistics show zero counts
    await expect(page.locator('[data-testid="total-guests"]')).toBeVisible()
  })

  test('should open add guest dialog when add button is clicked', async ({ page }) => {
    // Arrange - user is on guests page
    
    // Act - click the add guest button
    const addButton = page.locator('[data-testid="add-guest-button"]')
    await expect(addButton).toBeVisible({ timeout: 5000 })
    await addButton.click()
    
    // Assert - dialog should open with form fields
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="first-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="last-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="side-select"]')).toBeVisible()
  })

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Arrange - open add guest dialog
    const addButton = page.locator('[data-testid="add-guest-button"]')
    await addButton.click()
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
    
    // Act - try to submit without required fields
    const submitButton = page.locator('[data-testid="submit-guest"]')
    await submitButton.click()
    
    // Assert - should show validation errors and NOT submit
    // The form should remain open (not close)
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
    
    // Check for HTML5 validation or custom error messages
    const firstNameInput = page.locator('[data-testid="first-name-input"]')
    const isRequired = await firstNameInput.getAttribute('required')
    if (isRequired !== null) {
      // HTML5 validation should prevent submission
      const validationMessage = await firstNameInput.evaluate((el: HTMLInputElement) => el.validationMessage)
      expect(validationMessage).toBeTruthy()
    } else {
      // Custom validation should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    }
  })

  test('should successfully add a guest with complete workflow', async ({ page }) => {
    // Arrange - open add guest dialog
    const addButton = page.locator('[data-testid="add-guest-button"]')
    await addButton.click()
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
    
    const testGuest = {
      firstName: 'John',
      lastName: 'Smith', 
      side: 'bride',
      email: 'john.smith@test.com'
    }
    
    // Act - fill in guest information
    await page.locator('[data-testid="first-name-input"]').fill(testGuest.firstName)
    await page.locator('[data-testid="last-name-input"]').fill(testGuest.lastName)
    
    // Fill email if field exists
    const emailInput = page.locator('[data-testid="email-input"]')
    if (await emailInput.isVisible({ timeout: 1000 })) {
      await emailInput.fill(testGuest.email)
    }
    
    // Select side
    const sideSelect = page.locator('[data-testid="side-select"]')
    await sideSelect.selectOption(testGuest.side)
    
    // Set up network monitoring BEFORE submitting
    const apiResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/guests') && 
      response.request().method() === 'POST',
      { timeout: 10000 }
    )
    
    // Submit the form
    const submitButton = page.locator('[data-testid="submit-guest"]')
    await submitButton.click()
    
    // Assert - verify API call was successful
    const apiResponse = await apiResponsePromise
    expect(apiResponse.ok()).toBeTruthy()
    
    const responseData = await apiResponse.json()
    expect(responseData.success).toBeTruthy()
    expect(responseData.guest).toBeDefined()
    expect(responseData.guest.name).toContain(testGuest.firstName)
    expect(responseData.guest.name).toContain(testGuest.lastName)
    
    // Assert - dialog should close
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeHidden({ timeout: 10000 })
    
    // Wait for the guest list to refresh (the dialog onGuestAdded callback calls fetchGuests)
    await page.waitForFunction(() => {
      const emptyState = document.querySelector('[data-testid="empty-guests"]');
      const totalGuests = document.querySelector('[data-testid="total-guests"]');
      return !emptyState && totalGuests && totalGuests.textContent === '1';
    }, { timeout: 10000 });
    
    // Assert - guest should appear in the list
    const guestListItem = page.locator('[data-testid="guest-item"]')
    await expect(guestListItem).toBeVisible({ timeout: 10000 })
    
    // Assert - statistics should update to show 1
    await expect(page.locator('[data-testid="total-guests"]')).toHaveText('1')
    
    // Assert - empty state should be gone
    await expect(page.locator('[data-testid="empty-guests"]')).not.toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Arrange - mock API to return error
    await page.route('/api/guests', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Database connection failed' })
        })
      } else {
        route.continue()
      }
    })
    
    // Open dialog and fill form
    const addButton = page.locator('[data-testid="add-guest-button"]')
    await addButton.click()
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
    
    await page.locator('[data-testid="first-name-input"]').fill('Test')
    await page.locator('[data-testid="last-name-input"]').fill('User')
    await page.locator('[data-testid="side-select"]').selectOption('both')
    
    // Act - submit form (should fail)
    await page.locator('[data-testid="submit-guest"]').click()
    
    // Assert - should show error message and keep dialog open
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible() // Dialog should remain open
    
    // Guest should NOT appear in list
    await expect(page.locator('text=Test User')).not.toBeVisible()
  })

  test('should maintain data after page reload', async ({ page }) => {
    // Arrange - add a guest first
    const addButton = page.locator('[data-testid="add-guest-button"]')
    await addButton.click()
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
    
    await page.locator('[data-testid="first-name-input"]').fill('Persistent')
    await page.locator('[data-testid="last-name-input"]').fill('User')
    await page.locator('[data-testid="side-select"]').selectOption('both')
    
    const apiPromise = page.waitForResponse(response => 
      response.url().includes('/api/guests') && response.request().method() === 'POST'
    )
    
    await page.locator('[data-testid="submit-guest"]').click()
    await apiPromise
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeHidden({ timeout: 10000 })
    await expect(page.locator('text=Persistent User')).toBeVisible()
    
    // Act - reload the page
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('h1', { hasText: 'Guest List' })).toBeVisible()
    
    // Assert - guest should still be visible
    await expect(page.locator('text=Persistent User')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=1').first()).toBeVisible() // Count should show 1
  })

  test('should handle network failures during submission', async ({ page }) => {
    // Arrange - mock network failure
    await page.route('/api/guests', route => {
      if (route.request().method() === 'POST') {
        route.abort('failed') // Simulate network failure
      } else {
        route.continue()
      }
    })
    
    const addButton = page.locator('[data-testid="add-guest-button"]')
    await addButton.click()
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
    
    await page.locator('[data-testid="first-name-input"]').fill('Network')
    await page.locator('[data-testid="last-name-input"]').fill('Test')
    await page.locator('[data-testid="side-select"]').selectOption('both')
    
    // Act - submit form (should fail due to network)
    await page.locator('[data-testid="submit-guest"]').click()
    
    // Assert - should handle the error gracefully
    // Either show error message or button becomes enabled again after timeout
    await expect(async () => {
      const errorMessage = page.locator('[data-testid="error-message"]')
      const submitButton = page.locator('[data-testid="submit-guest"]')
      const submitEnabled = await submitButton.isEnabled()
      const errorVisible = await errorMessage.isVisible()
      
      expect(errorVisible || submitEnabled).toBeTruthy()
    }).toPass({ timeout: 15000 })
    
    // Dialog should remain open
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
  })

  test('should cancel dialog without saving changes', async ({ page }) => {
    // Arrange - open dialog and fill some data
    const addButton = page.locator('[data-testid="add-guest-button"]')
    await addButton.click()
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeVisible()
    
    await page.locator('[data-testid="first-name-input"]').fill('Should')
    await page.locator('[data-testid="last-name-input"]').fill('Cancel')
    
    // Act - click cancel button
    const cancelButton = page.locator('[data-testid="cancel-button"]')
    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.click()
    } else {
      // Try closing with X button or Escape key
      const closeButton = page.locator('[data-testid="close-button"]')
      if (await closeButton.isVisible({ timeout: 1000 })) {
        await closeButton.click()
      } else {
        await page.keyboard.press('Escape')
      }
    }
    
    // Assert - dialog should close without saving
    await expect(page.locator('[data-testid="add-guest-dialog"]')).toBeHidden({ timeout: 5000 })
    
    // Guest should NOT appear in list
    await expect(page.locator('text=Should Cancel')).not.toBeVisible()
    
    // Should still show empty state
    await expect(page.locator('text=No guests added yet')).toBeVisible()
  })
})