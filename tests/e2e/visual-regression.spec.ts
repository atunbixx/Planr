import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test.describe('RSVP System Visual Tests', () => {
    test('@screenshot RSVP form initial state', async ({ page }) => {
      await page.goto('/rsvp/test-invite-token')
      await page.waitForLoadState('networkidle')
      
      // Hide dynamic elements that might cause flakiness
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('rsvp-form-initial.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot RSVP form filled state', async ({ page }) => {
      await page.goto('/rsvp/test-invite-token')
      await page.waitForLoadState('networkidle')
      
      // Fill form
      await page.fill('input[name="email"]', 'test@example.com')
      await page.selectOption('select[name="status"]', 'accepted')
      await page.fill('input[name="partySize"]', '2')
      await page.fill('textarea[name="notes"]', 'Looking forward to celebrating with you!')
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('rsvp-form-filled.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot RSVP success state', async ({ page }) => {
      await page.goto('/rsvp/test-invite-token')
      await page.waitForLoadState('networkidle')
      
      // Submit RSVP
      await page.fill('input[name="email"]', 'test@example.com')
      await page.selectOption('select[name="status"]', 'accepted')
      await page.fill('input[name="partySize"]', '2')
      
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="rsvp-success"]')).toBeVisible()
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('rsvp-success-state.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot RSVP mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/rsvp/test-invite-token')
      await page.waitForLoadState('networkidle')
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('rsvp-mobile-view.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })
  })

  test.describe('Vendor Pages Visual Tests', () => {
    test('@screenshot Vendor page desktop view', async ({ page }) => {
      await page.goto('/vendors/test-photographer-studio')
      await page.waitForLoadState('networkidle')
      
      // Wait for images to load
      await page.waitForFunction(() => {
        const images = document.querySelectorAll('img')
        return Array.from(images).every(img => img.complete)
      })
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse,
          .skeleton {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('vendor-page-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot Vendor page mobile view', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/vendors/test-photographer-studio')
      await page.waitForLoadState('networkidle')
      
      await page.waitForFunction(() => {
        const images = document.querySelectorAll('img')
        return Array.from(images).every(img => img.complete)
      })
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse,
          .skeleton {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('vendor-page-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot Vendor image gallery', async ({ page }) => {
      await page.goto('/vendors/test-photographer-studio')
      await page.waitForLoadState('networkidle')
      
      // Focus on image gallery
      const gallery = page.locator('[data-testid="image-gallery"]')
      await expect(gallery).toBeVisible()
      
      await page.waitForFunction(() => {
        const images = document.querySelectorAll('[data-testid="image-gallery"] img')
        return Array.from(images).every(img => img.complete)
      })
      
      await expect(gallery).toHaveScreenshot('vendor-image-gallery.png', {
        animations: 'disabled'
      })
    })

    test('@screenshot Vendor contact form', async ({ page }) => {
      await page.goto('/vendors/test-photographer-studio')
      await page.waitForLoadState('networkidle')
      
      // Scroll to contact form
      const contactForm = page.locator('[data-testid="contact-form"]')
      await contactForm.scrollIntoViewIfNeeded()
      
      await expect(contactForm).toHaveScreenshot('vendor-contact-form.png', {
        animations: 'disabled'
      })
    })
  })

  test.describe('Dashboard Visual Tests', () => {
    test('@screenshot Dashboard overview', async ({ page }) => {
      // Set up authenticated session
      await page.addInitScript(() => {
        localStorage.setItem('auth-token', 'test-auth-token')
      })
      
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Wait for dashboard data to load
      await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible()
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse,
          .skeleton,
          [data-testid="last-updated"] {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('dashboard-overview.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot Messaging dashboard', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('auth-token', 'test-auth-token')
      })
      
      await page.goto('/dashboard/messaging')
      await page.waitForLoadState('networkidle')
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse,
          .skeleton,
          [data-testid="last-updated"] {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('messaging-dashboard.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot Budget dashboard', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('auth-token', 'test-auth-token')
      })
      
      await page.goto('/dashboard/budget')
      await page.waitForLoadState('networkidle')
      
      // Wait for charts to render
      await page.waitForTimeout(2000)
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse,
          .skeleton,
          [data-testid="last-updated"] {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('budget-dashboard.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })
  })

  test.describe('Authentication Visual Tests', () => {
    test('@screenshot Login page', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot Signup page', async ({ page }) => {
      await page.goto('/signup')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('signup-page.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot Login form with validation errors', async ({ page }) => {
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      
      // Trigger validation errors
      await page.click('button[type="submit"]')
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      
      await expect(page).toHaveScreenshot('login-validation-errors.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })
  })

  test.describe('Error Pages Visual Tests', () => {
    test('@screenshot 404 page', async ({ page }) => {
      await page.goto('/non-existent-page')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot RSVP not found', async ({ page }) => {
      await page.goto('/rsvp/invalid-token')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('rsvp-not-found.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot Vendor not found', async ({ page }) => {
      await page.goto('/vendors/non-existent-vendor')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('vendor-not-found.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })
  })

  test.describe('Cross-Browser Visual Tests', () => {
    test('@screenshot RSVP form - Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test')
      
      await page.goto('/rsvp/test-invite-token')
      await page.waitForLoadState('networkidle')
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('rsvp-form-firefox.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot Vendor page - Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit', 'Safari-specific test')
      
      await page.goto('/vendors/test-photographer-studio')
      await page.waitForLoadState('networkidle')
      
      await page.waitForFunction(() => {
        const images = document.querySelectorAll('img')
        return Array.from(images).every(img => img.complete)
      })
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse,
          .skeleton {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('vendor-page-safari.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })
  })

  test.describe('Dark Mode Visual Tests', () => {
    test('@screenshot Dashboard dark mode', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('auth-token', 'test-auth-token')
        localStorage.setItem('theme', 'dark')
      })
      
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Wait for dark mode to apply
      await page.waitForTimeout(500)
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse,
          .skeleton,
          [data-testid="last-updated"] {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })

    test('@screenshot RSVP form dark mode', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('theme', 'dark')
      })
      
      await page.goto('/rsvp/test-invite-token')
      await page.waitForLoadState('networkidle')
      
      await page.waitForTimeout(500)
      
      await page.addStyleTag({
        content: `
          [data-testid="timestamp"], 
          .loading-spinner,
          .animate-pulse {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('rsvp-form-dark-mode.png', {
        fullPage: true,
        animations: 'disabled'
      })
    })
  })
})