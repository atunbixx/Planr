import { test, expect } from '@playwright/test'
import { TestSetup } from '../helpers/test-setup'

test.describe('Full Integration Flow Tests', () => {
  test('Complete wedding planning workflow', async ({ page }) => {
    // This test covers the entire user journey from signup to RSVP management
    
    const testEmail = TestSetup.generateTestEmail('integration')
    const testPassword = 'integrationtest123'
    
    // 1. User Registration
    await page.goto('/signup')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    
    await page.click('button[type="submit"]')
    
    // Verify successful registration and redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/)
    
    // 2. Complete Onboarding
    await page.fill('input[name="brideName"]', 'Jane Doe')
    await page.fill('input[name="groomName"]', 'John Smith')
    await page.fill('input[name="weddingDate"]', '2024-08-15')
    await page.fill('input[name="venue"]', 'Grand Ballroom')
    await page.fill('input[name="guestCount"]', '150')
    await page.fill('input[name="budget"]', '25000')
    
    await page.click('button[type="submit"]')
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    
    // 3. Set up Budget Categories
    await page.click('[data-testid="budget-tab"]')
    
    // Add venue budget
    await page.click('[data-testid="add-budget-item"]')
    await page.fill('input[name="category"]', 'Venue')
    await page.fill('input[name="amount"]', '8000')
    await page.click('button[type="submit"]')
    
    // Add photography budget
    await page.click('[data-testid="add-budget-item"]')
    await page.fill('input[name="category"]', 'Photography')
    await page.fill('input[name="amount"]', '3000')
    await page.click('button[type="submit"]')
    
    // Verify budget totals
    await expect(page.locator('[data-testid="total-budget"]')).toContainText('11000')
    
    // 4. Add Vendors
    await page.click('[data-testid="vendors-tab"]')
    
    // Add photographer
    await page.click('[data-testid="add-vendor"]')
    await page.fill('input[name="name"]', 'Amazing Photography')
    await page.selectOption('select[name="category"]', 'Photography')
    await page.fill('input[name="priceRange"]', '$2500-$3500')
    await page.fill('input[name="contact"]', 'info@amazingphoto.com')
    await page.fill('input[name="phone"]', '+1-555-987-6543')
    
    await page.click('button[type="submit"]')
    
    // Verify vendor added
    await expect(page.locator('[data-testid="vendor-list"]')).toContainText('Amazing Photography')
    
    // 5. Create Guest List and Invites
    await page.click('[data-testid="guests-tab"]')
    
    // Add guests
    const guests = [
      { name: 'Alice Johnson', email: 'alice@example.com', side: 'bride' },
      { name: 'Bob Wilson', email: 'bob@example.com', side: 'groom' },
      { name: 'Carol Davis', email: 'carol@example.com', side: 'bride' }
    ]
    
    for (const guest of guests) {
      await page.click('[data-testid="add-guest"]')
      await page.fill('input[name="name"]', guest.name)
      await page.fill('input[name="email"]', guest.email)
      await page.selectOption('select[name="side"]', guest.side)
      await page.click('button[type="submit"]')
    }
    
    // Verify guests added
    await expect(page.locator('[data-testid="guest-count"]')).toContainText('3')
    
    // 6. Send RSVP Invitations
    await page.click('[data-testid="send-invitations"]')
    
    // Select all guests
    await page.check('[data-testid="select-all-guests"]')
    
    // Customize invitation message
    await page.fill('textarea[name="message"]', 'You are cordially invited to our wedding celebration!')
    
    await page.click('[data-testid="send-invites-button"]')
    
    // Verify invitations sent
    await expect(page.locator('[data-testid="invites-sent-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="invites-sent-count"]')).toContainText('3')
    
    // 7. Test RSVP Submission (simulate guest response)
    // Get invite token for first guest
    const inviteResponse = await page.request.get('/api/invites', {
      headers: {
        'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('auth-token'))}`
      }
    })
    const invites = await inviteResponse.json()
    const firstInviteToken = invites.data[0].token
    
    // Open RSVP page in new context (simulate guest)
    const guestContext = await page.context().browser()?.newContext()
    const guestPage = await guestContext?.newPage()
    
    if (guestPage) {
      await guestPage.goto(`/rsvp/${firstInviteToken}`)
      await guestPage.waitForLoadState('networkidle')
      
      // Fill RSVP form
      await guestPage.fill('input[name="email"]', 'alice@example.com')
      await guestPage.selectOption('select[name="status"]', 'accepted')
      await guestPage.fill('input[name="partySize"]', '2')
      await guestPage.fill('textarea[name="notes"]', 'So excited to celebrate with you!')
      
      await guestPage.click('button[type="submit"]')
      
      // Verify RSVP success
      await expect(guestPage.locator('[data-testid="rsvp-success"]')).toBeVisible()
      
      await guestContext?.close()
    }
    
    // 8. Check RSVP Dashboard Updates
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Navigate to RSVP management
    await page.click('[data-testid="rsvp-tab"]')
    
    // Verify RSVP statistics updated
    await expect(page.locator('[data-testid="rsvp-stats"]')).toContainText('1 Accepted')
    await expect(page.locator('[data-testid="rsvp-stats"]')).toContainText('2 Pending')
    
    // Verify guest count updated
    await expect(page.locator('[data-testid="confirmed-guests"]')).toContainText('2') // Alice + 1 guest
    
    // 9. Test Messaging System
    await page.click('[data-testid="messaging-tab"]')
    
    // Check credit balance
    await expect(page.locator('[data-testid="credit-balance"]')).toBeVisible()
    
    // Send follow-up message to pending guests
    await page.click('[data-testid="send-reminder"]')
    
    // Select pending guests
    await page.check('[data-testid="select-pending-guests"]')
    
    await page.fill('input[name="subject"]', 'RSVP Reminder - Wedding Celebration')
    await page.fill('textarea[name="message"]', 'Just a friendly reminder to RSVP for our wedding!')
    
    await page.click('button[type="submit"]')
    
    // Verify message sent
    await expect(page.locator('[data-testid="message-success"]')).toBeVisible()
    
    // 10. Vendor Directory Integration
    // Navigate to public vendor directory
    await page.goto('/vendors/test-photographer-studio')
    await page.waitForLoadState('networkidle')
    
    // Verify vendor page loads with SSR content
    await expect(page.locator('h1')).toContainText('Test Photography Studio')
    
    // Test contact form
    await page.fill('input[name="name"]', 'Jane Doe')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="phone"]', '+1-555-123-4567')
    await page.fill('textarea[name="message"]', 'Interested in wedding photography services')
    await page.fill('input[name="eventDate"]', '2024-08-15')
    await page.fill('input[name="budget"]', '3000')
    
    await page.click('button[type="submit"]')
    
    // Verify contact form success
    await expect(page.locator('[data-testid="contact-success"]')).toBeVisible()
    
    // 11. Final Dashboard Review
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Verify all systems are working together
    await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible()
    
    // Check budget utilization
    await page.click('[data-testid="budget-tab"]')
    await expect(page.locator('[data-testid="budget-progress"]')).toBeVisible()
    
    // Check vendor management
    await page.click('[data-testid="vendors-tab"]')
    await expect(page.locator('[data-testid="vendor-list"]')).toContainText('Amazing Photography')
    
    // Check RSVP summary
    await page.click('[data-testid="rsvp-tab"]')
    await expect(page.locator('[data-testid="rsvp-summary"]')).toBeVisible()
    
    // Check messaging history
    await page.click('[data-testid="messaging-tab"]')
    await expect(page.locator('[data-testid="message-history"]')).toContainText('RSVP Reminder')
    
    console.log('✅ Complete integration workflow test passed')
  })

  test('Error handling and recovery flow', async ({ page }) => {
    // Test error scenarios and recovery mechanisms
    
    const testEmail = TestSetup.generateTestEmail('error-test')
    
    // 1. Test network error handling
    await page.route('**/api/auth/signup', route => route.abort())
    
    await page.goto('/signup')
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    // Verify error message displayed
    await expect(page.locator('[data-testid="signup-error"]')).toBeVisible()
    
    // 2. Test recovery after network restoration
    await page.unroute('**/api/auth/signup')
    
    await page.click('button[type="submit"]')
    
    // Should now succeed
    await expect(page).toHaveURL(/\/onboarding/)
    
    // 3. Test RSVP error handling
    const inviteToken = TestSetup.generateInviteToken()
    
    // Mock RSVP API error
    await page.route('**/api/rsvp', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' })
      })
    })
    
    await page.goto(`/rsvp/${inviteToken}`)
    
    // Try to submit RSVP
    await TestSetup.fillRSVPForm(page, {
      email: 'guest@example.com',
      status: 'accepted',
      partySize: '2'
    })
    
    await page.click('button[type="submit"]')
    
    // Verify error handling
    await expect(page.locator('[data-testid="rsvp-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="rsvp-error"]')).toContainText('failed')
    
    // 4. Test retry mechanism
    await page.unroute('**/api/rsvp')
    
    // Set up proper invite for retry
    await page.request.post('/api/test/setup-invite', {
      data: {
        email: 'guest@example.com',
        token: inviteToken
      }
    })
    
    await page.click('[data-testid="retry-button"]')
    
    // Should now succeed
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
    
    console.log('✅ Error handling and recovery test passed')
  })

  test('Performance and load testing', async ({ page }) => {
    // Test application performance under various conditions
    
    // 1. Measure page load performance
    const startTime = Date.now()
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    
    // 2. Test vendor page performance
    const vendorStartTime = Date.now()
    
    await page.goto('/vendors/test-photographer-studio')
    await page.waitForLoadState('networkidle')
    
    const vendorLoadTime = Date.now() - vendorStartTime
    expect(vendorLoadTime).toBeLessThan(2000) // Vendor pages should be fast due to SSR
    
    // 3. Test RSVP form performance with rapid submissions
    const inviteToken = TestSetup.generateInviteToken()
    
    await page.request.post('/api/test/setup-invite', {
      data: {
        email: 'performance-test@example.com',
        token: inviteToken
      }
    })
    
    await page.goto(`/rsvp/${inviteToken}`)
    await page.waitForLoadState('networkidle')
    
    // Measure form interaction performance
    const formStartTime = Date.now()
    
    await TestSetup.fillRSVPForm(page, {
      email: 'performance-test@example.com',
      status: 'accepted',
      partySize: '2',
      notes: 'Performance test submission'
    })
    
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
    
    const formSubmissionTime = Date.now() - formStartTime
    expect(formSubmissionTime).toBeLessThan(2000) // Form submission should be fast
    
    // 4. Test image loading performance
    await page.goto('/vendors/test-photographer-studio')
    
    const imageLoadStart = Date.now()
    await TestSetup.waitForImages(page)
    const imageLoadTime = Date.now() - imageLoadStart
    
    expect(imageLoadTime).toBeLessThan(5000) // Images should load within 5 seconds
    
    console.log('✅ Performance test passed', {
      dashboardLoad: loadTime,
      vendorPageLoad: vendorLoadTime,
      formSubmission: formSubmissionTime,
      imageLoad: imageLoadTime
    })
  })
})