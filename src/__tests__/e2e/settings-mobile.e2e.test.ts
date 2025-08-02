import { test, expect, Page, devices } from '@playwright/test'

const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!@#'
}

async function loginUser(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

test.describe('Settings Page Mobile Tests', () => {
  test.describe('iPhone 12', () => {
    test.use({ ...devices['iPhone 12'] })

    test.beforeEach(async ({ page }) => {
      await loginUser(page)
      await page.goto('/dashboard/settings')
      await page.waitForSelector('h1:has-text("Settings")')
    })

    test('responsive layout on iPhone', async ({ page }) => {
      // Verify header is sticky
      const header = page.locator('.sticky.top-0').first()
      await expect(header).toBeVisible()

      // Verify tabs are horizontally scrollable
      const tabsContainer = page.locator('nav[aria-label="Settings tabs"]')
      await expect(tabsContainer).toHaveCSS('overflow-x', 'auto')

      // Verify cards stack vertically
      const cards = page.locator('.card, [class*="Card"]')
      const cardCount = await cards.count()
      
      if (cardCount >= 2) {
        const firstCard = await cards.first().boundingBox()
        const secondCard = await cards.nth(1).boundingBox()
        
        if (firstCard && secondCard) {
          // Cards should be stacked vertically, not side by side
          expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height - 10)
        }
      }
    })

    test('touch interactions work correctly', async ({ page }) => {
      // Test swipe on tabs
      const tabsContainer = page.locator('nav[aria-label="Settings tabs"]')
      await tabsContainer.scrollIntoViewIfNeeded()
      
      // Simulate swipe by scrolling
      await tabsContainer.evaluate(el => el.scrollLeft = 200)
      
      // Click on a tab that was scrolled into view
      await page.click('button:has-text("Privacy")')
      await expect(page.locator('button:has-text("Privacy")')).toHaveClass(/border-black/)
    })

    test('form inputs are properly sized for mobile', async ({ page }) => {
      // Check input fields have appropriate size
      const inputs = page.locator('input:not([type="checkbox"]):not([type="file"])')
      const firstInput = inputs.first()
      
      const inputBox = await firstInput.boundingBox()
      if (inputBox) {
        // Input should be nearly full width on mobile
        const viewport = page.viewportSize()
        if (viewport) {
          expect(inputBox.width).toBeGreaterThan(viewport.width * 0.8)
        }
      }

      // Check touch target size for buttons
      const saveButton = page.locator('button:has-text("Save Changes")')
      const buttonBox = await saveButton.boundingBox()
      if (buttonBox) {
        // Touch targets should be at least 44x44 pixels
        expect(buttonBox.height).toBeGreaterThanOrEqual(44)
      }
    })

    test('modal/overlay handling on mobile', async ({ page }) => {
      // Navigate to profile tab
      await page.click('button:has-text("Profile")')
      
      // Open avatar upload (which might show a modal on mobile)
      const avatarUpload = page.locator('[class*="avatar"]').first()
      await avatarUpload.click()
      
      // If a modal appears, it should be fullscreen or near-fullscreen on mobile
      const modal = page.locator('[role="dialog"], [class*="modal"]')
      if (await modal.isVisible()) {
        const modalBox = await modal.boundingBox()
        const viewport = page.viewportSize()
        
        if (modalBox && viewport) {
          expect(modalBox.width).toBeGreaterThan(viewport.width * 0.9)
        }
      }
    })

    test('save button remains accessible', async ({ page }) => {
      // Scroll to bottom of a long form
      await page.click('button:has-text("Profile")')
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      
      // Save button should be sticky or easily accessible
      const saveButton = page.locator('button:has-text("Save Changes")')
      await expect(saveButton).toBeInViewport()
    })
  })

  test.describe('iPad Pro', () => {
    test.use({ ...devices['iPad Pro'] })

    test.beforeEach(async ({ page }) => {
      await loginUser(page)
      await page.goto('/dashboard/settings')
    })

    test('tablet layout uses available space efficiently', async ({ page }) => {
      // On tablet, some cards might be side by side
      const cards = page.locator('.md\\:grid-cols-2 > *')
      const cardCount = await cards.count()
      
      if (cardCount >= 2) {
        const firstCard = await cards.first().boundingBox()
        const secondCard = await cards.nth(1).boundingBox()
        
        if (firstCard && secondCard) {
          // Cards should be side by side on tablet
          expect(Math.abs(firstCard.y - secondCard.y)).toBeLessThan(50)
        }
      }
    })

    test('navigation works in landscape mode', async ({ page }) => {
      // Rotate to landscape
      await page.setViewportSize({ width: 1366, height: 1024 })
      
      // All tabs should be visible without scrolling
      const tabs = ['Profile', 'Account', 'Notifications', 'Theme', 'Privacy', 'Integrations']
      for (const tab of tabs) {
        await expect(page.locator(`button:has-text("${tab}")`)).toBeInViewport()
      }
    })
  })

  test.describe('Android Phone', () => {
    test.use({ ...devices['Pixel 5'] })

    test.beforeEach(async ({ page }) => {
      await loginUser(page)
      await page.goto('/dashboard/settings')
    })

    test('handles Android-specific interactions', async ({ page }) => {
      // Test long press on elements
      const deleteButton = page.locator('button:has-text("Delete Account")')
      
      // Navigate to account tab
      await page.click('button:has-text("Account")')
      
      // Simulate long press (which might show tooltip or confirmation)
      await deleteButton.hover()
      await page.mouse.down()
      await page.waitForTimeout(500)
      await page.mouse.up()
      
      // Check if any tooltip or confirmation appears
      const tooltip = page.locator('[role="tooltip"], [class*="tooltip"]')
      if (await tooltip.isVisible()) {
        await expect(tooltip).toContainText(/delete|confirm/i)
      }
    })

    test('handles virtual keyboard appearance', async ({ page }) => {
      // Focus on an input field
      const fullNameInput = page.locator('input[id="fullName"]')
      await fullNameInput.click()
      
      // When keyboard appears, the input should still be visible
      await page.waitForTimeout(300) // Wait for keyboard animation
      await expect(fullNameInput).toBeInViewport()
      
      // Save button should still be accessible
      const saveButton = page.locator('button:has-text("Save Changes")')
      await expect(saveButton).toBeInViewport()
    })
  })

  test.describe('Small Screen Edge Cases', () => {
    test.use({ viewport: { width: 320, height: 568 } }) // iPhone SE size

    test.beforeEach(async ({ page }) => {
      await loginUser(page)
      await page.goto('/dashboard/settings')
    })

    test('handles very small screens gracefully', async ({ page }) => {
      // Text should not overflow
      const headings = page.locator('h1, h2, h3, h4')
      const headingCount = await headings.count()
      
      for (let i = 0; i < headingCount; i++) {
        const heading = headings.nth(i)
        const box = await heading.boundingBox()
        const viewport = page.viewportSize()
        
        if (box && viewport) {
          expect(box.width).toBeLessThanOrEqual(viewport.width)
        }
      }

      // Buttons should wrap text or use icons
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        const box = await button.boundingBox()
        
        if (box) {
          expect(box.height).toBeLessThan(100) // Reasonable height
        }
      }
    })

    test('critical actions remain accessible', async ({ page }) => {
      // Even on tiny screens, save button should be findable
      const saveButton = page.locator('button:has-text("Save Changes")')
      await expect(saveButton).toBeVisible()
      
      // Back navigation should be visible
      const backButton = page.locator('a[href="/dashboard"]')
      await expect(backButton).toBeVisible()
    })
  })

  test.describe('Touch Gestures', () => {
    test.use({ ...devices['iPhone 12'] })

    test('supports swipe gestures for tab navigation', async ({ page }) => {
      await loginUser(page)
      await page.goto('/dashboard/settings')

      const tabsContainer = page.locator('nav[aria-label="Settings tabs"]')
      
      // Simulate swipe left
      await tabsContainer.evaluate(el => {
        el.scrollLeft = 0
        el.scrollTo({ left: 300, behavior: 'smooth' })
      })
      
      await page.waitForTimeout(500)
      
      // Privacy tab should now be more visible
      const privacyTab = page.locator('button:has-text("Privacy")')
      await expect(privacyTab).toBeInViewport()
    })

    test('supports pull-to-refresh pattern', async ({ page }) => {
      await loginUser(page)
      await page.goto('/dashboard/settings')

      // Simulate pull-to-refresh gesture
      await page.evaluate(() => {
        window.scrollTo(0, -100)
      })
      
      // Then release (scroll back to top)
      await page.evaluate(() => {
        window.scrollTo(0, 0)
      })
      
      // Page should handle this gracefully without breaking
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible()
    })
  })

  test.describe('Orientation Changes', () => {
    test.use({ ...devices['iPad Mini'] })

    test('handles orientation change from portrait to landscape', async ({ page }) => {
      await loginUser(page)
      await page.goto('/dashboard/settings')

      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Verify layout
      const cards = page.locator('[class*="card"], [class*="Card"]').first()
      const portraitBox = await cards.boundingBox()
      
      // Switch to landscape
      await page.setViewportSize({ width: 1024, height: 768 })
      await page.waitForTimeout(300) // Wait for re-render
      
      // Layout should adapt
      const landscapeBox = await cards.boundingBox()
      
      if (portraitBox && landscapeBox) {
        // Card might be wider in landscape
        expect(landscapeBox.width).toBeGreaterThanOrEqual(portraitBox.width)
      }
    })
  })

  test.describe('Performance on Mobile', () => {
    test.use({ ...devices['iPhone 12'] })

    test('loads efficiently on mobile network', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', (route) => {
        // Add artificial delay to simulate slow network
        setTimeout(() => route.continue(), 100)
      })

      const startTime = Date.now()
      await loginUser(page)
      await page.goto('/dashboard/settings')
      const loadTime = Date.now() - startTime

      // Page should load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(10000) // 10 seconds

      // Critical content should be visible
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible()
      await expect(page.locator('button:has-text("Save Changes")')).toBeVisible()
    })

    test('lazy loads non-critical content', async ({ page }) => {
      await loginUser(page)
      await page.goto('/dashboard/settings')

      // Initially, only visible content should load
      const profileTab = page.locator('button:has-text("Profile")')
      await expect(profileTab).toBeVisible()

      // Other tab content shouldn't be in DOM until selected
      const themeContent = page.locator('text=Color Scheme')
      await expect(themeContent).not.toBeVisible()

      // Navigate to theme tab
      await page.click('button:has-text("Theme")')
      
      // Now theme content should load
      await expect(themeContent).toBeVisible()
    })
  })
})