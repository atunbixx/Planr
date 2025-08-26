import { test, expect } from '@playwright/test'
import { randomBytes } from 'crypto'

test.describe('RSVP System E2E Tests', () => {
  let inviteToken: string
  let testEmail: string

  test.beforeEach(async ({ page }) => {
    // Generate unique test data for each test
    const testId = randomBytes(4).toString('hex')
    testEmail = `test-${testId}@example.com`
    inviteToken = `invite_${testId}_${Date.now()}`
    
    // Set up test data by creating an invite
    await page.goto('/api/test/setup-invite', {
      method: 'POST',
      data: {
        email: testEmail,
        token: inviteToken,
      }
    })
  })

  test('RSVP submission and persistence across refresh', async ({ page }) => {
    // Navigate to RSVP page
    await page.goto(`/rsvp/${inviteToken}`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Verify RSVP form is present
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('select[name="status"]')).toBeVisible()
    await expect(page.locator('input[name="partySize"]')).toBeVisible()
    
    // Fill out RSVP form
    await page.fill('input[name="email"]', testEmail)
    await page.selectOption('select[name="status"]', 'accepted')
    await page.fill('input[name="partySize"]', '2')
    await page.fill('textarea[name="notes"]', 'Looking forward to celebrating with you!')
    
    // Submit RSVP
    await page.click('button[type="submit"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="rsvp-success"]')).toContainText('RSVP submitted successfully')
    
    // Verify form shows submitted state
    await expect(page.locator('[data-testid="rsvp-status"]')).toContainText('Accepted')
    await expect(page.locator('[data-testid="party-size"]')).toContainText('2')
    
    // Test persistence: refresh the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Verify RSVP data persists after refresh
    await expect(page.locator('[data-testid="rsvp-status"]')).toContainText('Accepted')
    await expect(page.locator('[data-testid="party-size"]')).toContainText('2')
    await expect(page.locator('[data-testid="rsvp-notes"]')).toContainText('Looking forward to celebrating with you!')
    
    // Verify form is in read-only mode (already submitted)
    await expect(page.locator('button[type="submit"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="edit-rsvp-button"]')).toBeVisible()
  })

  test('Duplicate RSVP submission idempotency', async ({ page }) => {
    // Navigate to RSVP page
    await page.goto(`/rsvp/${inviteToken}`)
    await page.waitForLoadState('networkidle')
    
    // Submit first RSVP
    await page.fill('input[name="email"]', testEmail)
    await page.selectOption('select[name="status"]', 'accepted')
    await page.fill('input[name="partySize"]', '3')
    await page.fill('textarea[name="notes"]', 'First submission')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
    
    // Click edit to modify RSVP
    await page.click('[data-testid="edit-rsvp-button"]')
    
    // Modify and resubmit
    await page.fill('input[name="partySize"]', '4')
    await page.fill('textarea[name="notes"]', 'Updated submission')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
    
    // Verify the update was applied (idempotent update)
    await expect(page.locator('[data-testid="party-size"]')).toContainText('4')
    await expect(page.locator('[data-testid="rsvp-notes"]')).toContainText('Updated submission')
    
    // Verify only one RSVP record exists by checking the API
    const response = await page.request.get(`/api/rsvp/stats?inviteId=${inviteToken}`)
    const stats = await response.json()
    expect(stats.data.total).toBe(1)
    expect(stats.data.accepted).toBe(1)
  })

  test('RSVP form validation and error handling', async ({ page }) => {
    await page.goto(`/rsvp/${inviteToken}`)
    await page.waitForLoadState('networkidle')
    
    // Test empty form submission
    await page.click('button[type="submit"]')
    
    // Verify validation errors
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="status-error"]')).toBeVisible()
    
    // Test invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email')
    
    // Test invalid party size
    await page.fill('input[name="email"]', testEmail)
    await page.selectOption('select[name="status"]', 'accepted')
    await page.fill('input[name="partySize"]', '0')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="partySize-error"]')).toContainText('Party size must be at least 1')
    
    // Test party size too large
    await page.fill('input[name="partySize"]', '20')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="partySize-error"]')).toContainText('Party size cannot exceed 10')
  })

  test('Invalid invite token handling', async ({ page }) => {
    // Test with non-existent invite token
    await page.goto('/rsvp/invalid-token-123')
    
    // Verify error page is shown
    await expect(page.locator('[data-testid="invite-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="invite-error"]')).toContainText('Invalid or expired invite')
    
    // Verify RSVP form is not shown
    await expect(page.locator('form')).not.toBeVisible()
  })

  test('RSVP status changes and analytics tracking', async ({ page }) => {
    await page.goto(`/rsvp/${inviteToken}`)
    await page.waitForLoadState('networkidle')
    
    // Submit as declined
    await page.fill('input[name="email"]', testEmail)
    await page.selectOption('select[name="status"]', 'declined')
    await page.fill('input[name="partySize"]', '1')
    await page.fill('textarea[name="notes"]', 'Sorry, cannot attend')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
    
    // Verify declined status
    await expect(page.locator('[data-testid="rsvp-status"]')).toContainText('Declined')
    
    // Change to accepted
    await page.click('[data-testid="edit-rsvp-button"]')
    await page.selectOption('select[name="status"]', 'accepted')
    await page.fill('input[name="partySize"]', '2')
    await page.fill('textarea[name="notes"]', 'Changed my mind, will attend!')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
    
    // Verify status change
    await expect(page.locator('[data-testid="rsvp-status"]')).toContainText('Accepted')
    await expect(page.locator('[data-testid="party-size"]')).toContainText('2')
  })

  test('RSVP mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto(`/rsvp/${inviteToken}`)
    await page.waitForLoadState('networkidle')
    
    // Verify form is properly displayed on mobile
    await expect(page.locator('form')).toBeVisible()
    
    // Check that form elements are properly sized
    const emailInput = page.locator('input[name="email"]')
    const emailBox = await emailInput.boundingBox()
    expect(emailBox?.width).toBeGreaterThan(200) // Should be reasonably wide
    
    // Test form submission on mobile
    await page.fill('input[name="email"]', testEmail)
    await page.selectOption('select[name="status"]', 'accepted')
    await page.fill('input[name="partySize"]', '2')
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
    
    // Verify success message is visible on mobile
    const successMessage = page.locator('[data-testid="rsvp-success"]')
    await expect(successMessage).toBeInViewport()
  })

  test('RSVP accessibility compliance', async ({ page }) => {
    await page.goto(`/rsvp/${inviteToken}`)
    await page.waitForLoadState('networkidle')
    
    // Check for proper form labels
    await expect(page.locator('label[for="email"]')).toBeVisible()
    await expect(page.locator('label[for="status"]')).toBeVisible()
    await expect(page.locator('label[for="partySize"]')).toBeVisible()
    
    // Check for ARIA attributes
    await expect(page.locator('form')).toHaveAttribute('role', 'form')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('select[name="status"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="partySize"]')).toBeFocused()
    
    // Test form submission with Enter key
    await page.fill('input[name="email"]', testEmail)
    await page.selectOption('select[name="status"]', 'accepted')
    await page.fill('input[name="partySize"]', '2')
    
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Clean up test data
    await page.goto('/api/test/cleanup-invite', {
      method: 'POST',
      data: {
        token: inviteToken,
      }
    })
  })
})