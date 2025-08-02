import { test, expect, Page } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

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

test.describe('Settings Page Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    await page.goto('/dashboard/settings')
    await page.waitForSelector('h1:has-text("Settings")')
    await injectAxe(page)
  })

  test('passes automated accessibility checks', async ({ page }) => {
    // Run axe accessibility checks
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('can navigate entire page using keyboard only', async ({ page }) => {
      // Start from the top
      await page.keyboard.press('Tab')
      
      // Should focus on back button first
      const backButton = page.locator('a[href="/dashboard"]')
      await expect(backButton).toBeFocused()

      // Tab to save button
      await page.keyboard.press('Tab')
      const saveButton = page.locator('button:has-text("Save Changes")')
      await expect(saveButton).toBeFocused()

      // Tab through navigation tabs
      await page.keyboard.press('Tab')
      const profileTab = page.locator('button:has-text("Profile")')
      await expect(profileTab).toBeFocused()

      // Navigate tabs with arrow keys
      await page.keyboard.press('ArrowRight')
      const accountTab = page.locator('button:has-text("Account")')
      await expect(accountTab).toBeFocused()

      // Activate tab with Enter
      await page.keyboard.press('Enter')
      await expect(accountTab).toHaveClass(/border-black/)

      // Tab into form fields
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      const currentPasswordInput = page.locator('input[id="currentPassword"]')
      await expect(currentPasswordInput).toBeFocused()
    })

    test('supports Escape key for dismissing elements', async ({ page }) => {
      // If there are any dismissible elements like tooltips or modals
      const tooltipTrigger = page.locator('[aria-describedby]').first()
      if (await tooltipTrigger.isVisible()) {
        await tooltipTrigger.hover()
        await page.waitForTimeout(100)
        
        // Press Escape
        await page.keyboard.press('Escape')
        
        // Tooltip should be hidden
        const tooltip = page.locator('[role="tooltip"]')
        await expect(tooltip).not.toBeVisible()
      }
    })

    test('form submission works with Enter key', async ({ page }) => {
      // Fill a form field
      const fullNameInput = page.locator('input[id="fullName"]')
      await fullNameInput.click()
      await fullNameInput.clear()
      await fullNameInput.type('Keyboard Test')

      // Submit with Enter
      await fullNameInput.press('Enter')

      // Should trigger save
      await expect(page.locator('text=Saving...')).toBeVisible()
    })

    test('toggle switches work with Space key', async ({ page }) => {
      // Navigate to notifications tab
      await page.click('button:has-text("Notifications")')

      // Tab to first toggle
      const firstToggle = page.locator('input[type="checkbox"]').first()
      await firstToggle.focus()

      // Get initial state
      const initialChecked = await firstToggle.isChecked()

      // Toggle with Space
      await page.keyboard.press(' ')

      // State should change
      expect(await firstToggle.isChecked()).toBe(!initialChecked)
    })
  })

  test.describe('Screen Reader Support', () => {
    test('has proper ARIA labels and descriptions', async ({ page }) => {
      // Check all form inputs have associated labels
      const inputs = page.locator('input, select, textarea')
      const inputCount = await inputs.count()

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)
        const inputId = await input.getAttribute('id')
        
        if (inputId) {
          // Should have either aria-label or associated label
          const ariaLabel = await input.getAttribute('aria-label')
          const label = page.locator(`label[for="${inputId}"]`)
          
          if (!ariaLabel) {
            await expect(label).toBeVisible()
          }
        }
      }
    })

    test('provides context for icon-only buttons', async ({ page }) => {
      // Find all icon-only buttons
      const iconButtons = page.locator('button:has(i[class*="fa"])')
      const buttonCount = await iconButtons.count()

      for (let i = 0; i < buttonCount; i++) {
        const button = iconButtons.nth(i)
        const buttonText = await button.textContent()
        
        // If button has no visible text (only icon)
        if (!buttonText?.trim() || buttonText.trim().startsWith('fa')) {
          // Should have aria-label
          const ariaLabel = await button.getAttribute('aria-label')
          expect(ariaLabel).toBeTruthy()
        }
      }
    })

    test('announces dynamic content changes', async ({ page }) => {
      // Check for ARIA live regions
      const liveRegions = page.locator('[aria-live]')
      const liveRegionCount = await liveRegions.count()
      
      // Should have at least one live region for notifications
      expect(liveRegionCount).toBeGreaterThan(0)

      // Trigger a change
      const fullNameInput = page.locator('input[id="fullName"]')
      await fullNameInput.clear()
      await page.click('button:has-text("Save Changes")')

      // Error should be announced
      const errorMessage = page.locator('[role="alert"], [aria-live="assertive"]')
      await expect(errorMessage).toBeVisible()
    })

    test('provides clear form validation messages', async ({ page }) => {
      // Navigate to account tab
      await page.click('button:has-text("Account")')

      // Try to submit invalid password
      const newPasswordInput = page.locator('input[id="newPassword"]')
      await newPasswordInput.fill('weak')
      await page.click('button:has-text("Save Changes")')

      // Error should be associated with input
      const errorId = await newPasswordInput.getAttribute('aria-describedby')
      if (errorId) {
        const errorElement = page.locator(`#${errorId}`)
        await expect(errorElement).toBeVisible()
        await expect(errorElement).toContainText(/password must be/i)
      }
    })
  })

  test.describe('Focus Management', () => {
    test('maintains focus visibility', async ({ page }) => {
      // Check that focus indicators are visible
      await page.keyboard.press('Tab')
      
      // Get the focused element
      const focusedElement = page.locator(':focus')
      const focusedBox = await focusedElement.boundingBox()
      
      if (focusedBox) {
        // Take screenshot to verify focus ring
        const screenshot = await page.screenshot()
        expect(screenshot).toBeTruthy()
      }

      // Focus should have visible outline
      const outline = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return styles.outline || styles.boxShadow
      })
      
      expect(outline).not.toBe('none')
    })

    test('traps focus in modals', async ({ page }) => {
      // If there are any modals in settings
      const modalTrigger = page.locator('button:has-text("Delete Account")')
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click()
        
        // Wait for confirmation modal
        const modal = page.locator('[role="dialog"], [role="alertdialog"]')
        if (await modal.isVisible()) {
          // Tab should cycle within modal
          await page.keyboard.press('Tab')
          await page.keyboard.press('Tab')
          await page.keyboard.press('Tab')
          
          // Focus should still be within modal
          const focusedElement = page.locator(':focus')
          const isInModal = await focusedElement.evaluate((el, modalEl) => {
            return modalEl.contains(el)
          }, await modal.elementHandle())
          
          expect(isInModal).toBe(true)
        }
      }
    })

    test('returns focus after closing overlays', async ({ page }) => {
      // Click on avatar upload
      const avatarSection = page.locator('[class*="avatar"]').first()
      await avatarSection.click()

      // If file dialog or overlay opens and closes
      await page.keyboard.press('Escape')
      
      // Focus should return to trigger element
      await expect(avatarSection).toBeFocused()
    })
  })

  test.describe('Color Contrast', () => {
    test('text has sufficient contrast ratios', async ({ page }) => {
      // Check specific elements for contrast
      const elements = [
        { selector: 'h1', minContrast: 3 }, // Large text
        { selector: 'p', minContrast: 4.5 }, // Normal text
        { selector: 'button', minContrast: 4.5 }, // Interactive elements
        { selector: 'label', minContrast: 4.5 } // Form labels
      ]

      for (const { selector, minContrast } of elements) {
        const element = page.locator(selector).first()
        if (await element.isVisible()) {
          // Run contrast check with axe
          await checkA11y(page, selector, {
            rules: {
              'color-contrast': { enabled: true }
            }
          })
        }
      }
    })

    test('works in high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              border-color: ButtonText !important;
            }
          }
        `
      })

      // Elements should still be distinguishable
      const buttons = page.locator('button')
      const firstButton = buttons.first()
      const buttonStyles = await firstButton.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return {
          color: styles.color,
          background: styles.backgroundColor,
          border: styles.border
        }
      })

      // Should have visible borders or backgrounds
      expect(buttonStyles.border).not.toBe('none')
    })
  })

  test.describe('Semantic HTML', () => {
    test('uses appropriate heading hierarchy', async ({ page }) => {
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({
          level: parseInt(el.tagName[1]),
          text: el.textContent
        }))
      )

      // Should start with h1
      expect(headings[0]?.level).toBe(1)

      // Check hierarchy is not skipped
      for (let i = 1; i < headings.length; i++) {
        const prevLevel = headings[i - 1].level
        const currentLevel = headings[i].level
        
        // Level should not skip (e.g., h1 -> h3)
        expect(currentLevel - prevLevel).toBeLessThanOrEqual(1)
      }
    })

    test('uses semantic form elements', async ({ page }) => {
      // Forms should use fieldsets for groups
      const fieldsets = page.locator('fieldset')
      const fieldsetCount = await fieldsets.count()
      
      // At least some form groups should use fieldsets
      expect(fieldsetCount).toBeGreaterThan(0)

      // Check fieldsets have legends
      for (let i = 0; i < fieldsetCount; i++) {
        const fieldset = fieldsets.nth(i)
        const legend = fieldset.locator('legend')
        await expect(legend).toBeVisible()
      }
    })

    test('uses appropriate ARIA roles', async ({ page }) => {
      // Navigation should have nav role
      const nav = page.locator('nav, [role="navigation"]')
      await expect(nav.first()).toBeVisible()

      // Main content should have main role
      const main = page.locator('main, [role="main"]')
      await expect(main.first()).toBeVisible()

      // Tabs should use appropriate roles
      const tablist = page.locator('[role="tablist"]')
      if (await tablist.isVisible()) {
        const tabs = tablist.locator('[role="tab"]')
        expect(await tabs.count()).toBeGreaterThan(0)
      }
    })
  })

  test.describe('Error Handling Accessibility', () => {
    test('error messages are accessible', async ({ page }) => {
      // Trigger validation error
      const fullNameInput = page.locator('input[id="fullName"]')
      await fullNameInput.clear()
      await page.click('button:has-text("Save Changes")')

      // Error should be in an alert role
      const errorAlert = page.locator('[role="alert"]')
      await expect(errorAlert.first()).toBeVisible()

      // Error should be associated with input
      const describedBy = await fullNameInput.getAttribute('aria-describedby')
      if (describedBy) {
        const errorElement = page.locator(`#${describedBy}`)
        await expect(errorElement).toBeVisible()
      }

      // Input should have aria-invalid
      await expect(fullNameInput).toHaveAttribute('aria-invalid', 'true')
    })

    test('success messages are announced', async ({ page }) => {
      // Make a successful change
      const fullNameInput = page.locator('input[id="fullName"]')
      await fullNameInput.fill('Updated Name')
      await page.click('button:has-text("Save Changes")')

      // Success message should be in a live region
      const successMessage = page.locator('[aria-live="polite"]:has-text("updated"), [role="status"]:has-text("updated")')
      await expect(successMessage.first()).toBeVisible()
    })
  })

  test.describe('Responsive Accessibility', () => {
    test('remains accessible on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Run accessibility check on mobile
      await checkA11y(page, null, {
        rules: {
          // Some rules might be different on mobile
          'tap-target-size': { enabled: true }
        }
      })

      // Touch targets should be large enough
      const buttons = page.locator('button, a')
      const buttonCount = await buttons.count()

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i)
        const box = await button.boundingBox()
        
        if (box) {
          // Touch targets should be at least 44x44
          expect(box.width).toBeGreaterThanOrEqual(44)
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    })
  })

  test.describe('Motion and Animation Accessibility', () => {
    test('respects prefers-reduced-motion', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })

      // Navigate between tabs
      await page.click('button:has-text("Theme")')
      
      // Transitions should be instant or very fast
      const themeContent = page.locator('text=Color Scheme')
      await expect(themeContent).toBeVisible()

      // Check animation duration
      const animationDuration = await themeContent.evaluate(el => {
        const styles = window.getComputedStyle(el)
        return styles.animationDuration || styles.transitionDuration
      })

      // Should be 0s or very short
      expect(parseFloat(animationDuration)).toBeLessThan(0.1)
    })
  })
})