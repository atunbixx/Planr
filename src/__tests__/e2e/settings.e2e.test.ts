import { test, expect, Page } from '@playwright/test'

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!@#',
  fullName: 'Test User'
}

// Helper function to login
async function loginUser(page: Page) {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

// Helper function to navigate to settings
async function navigateToSettings(page: Page) {
  await page.goto('/dashboard/settings')
  await page.waitForSelector('h1:has-text("Settings")')
}

test.describe('Settings Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page)
    await navigateToSettings(page)
  })

  test.describe('Profile Tab', () => {
    test('updates profile information', async ({ page }) => {
      // Verify we're on the profile tab
      await expect(page.locator('button:has-text("Profile")')).toHaveClass(/border-black/)

      // Update full name
      const fullNameInput = page.locator('input[id="fullName"]')
      await fullNameInput.clear()
      await fullNameInput.fill('John Updated')

      // Update wedding date
      const weddingDateInput = page.locator('input[id="weddingDate"]')
      await weddingDateInput.fill('2024-12-25')

      // Update partner name
      const partnerNameInput = page.locator('input[id="partnerName"]')
      await partnerNameInput.clear()
      await partnerNameInput.fill('Jane Updated')

      // Update venue
      const venueInput = page.locator('input[id="venue"]')
      await venueInput.clear()
      await venueInput.fill('Beach Resort')

      // Update guest count
      const guestCountInput = page.locator('input[id="guestCount"]')
      await guestCountInput.clear()
      await guestCountInput.fill('200')

      // Save changes
      await page.click('button:has-text("Save Changes")')

      // Verify success toast
      await expect(page.locator('text=Profile updated')).toBeVisible()
      await expect(page.locator('text=Your profile has been successfully updated.')).toBeVisible()

      // Reload page and verify data persists
      await page.reload()
      await expect(fullNameInput).toHaveValue('John Updated')
      await expect(weddingDateInput).toHaveValue('2024-12-25')
      await expect(partnerNameInput).toHaveValue('Jane Updated')
      await expect(venueInput).toHaveValue('Beach Resort')
      await expect(guestCountInput).toHaveValue('200')
    })

    test('uploads and deletes avatar', async ({ page }) => {
      // Upload avatar
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles('tests/fixtures/test-avatar.jpg')

      // Wait for upload to complete
      await expect(page.locator('text=Uploading')).toBeVisible()
      await expect(page.locator('text=Avatar uploaded')).toBeVisible()

      // Verify avatar is displayed
      const avatarImage = page.locator('img[alt="Profile"]')
      await expect(avatarImage).toBeVisible()
      const avatarSrc = await avatarImage.getAttribute('src')
      expect(avatarSrc).toContain('supabase')

      // Delete avatar
      await page.click('button[aria-label="Delete avatar"]')
      await expect(page.locator('text=Avatar removed')).toBeVisible()

      // Verify avatar is removed
      await expect(page.locator('.fa-camera')).toBeVisible()
    })

    test('validates required fields', async ({ page }) => {
      // Clear full name
      const fullNameInput = page.locator('input[id="fullName"]')
      await fullNameInput.clear()

      // Try to save
      await page.click('button:has-text("Save Changes")')

      // Verify validation error
      await expect(page.locator('text=Full name is required')).toBeVisible()
    })
  })

  test.describe('Account Tab', () => {
    test('changes password successfully', async ({ page }) => {
      // Navigate to Account tab
      await page.click('button:has-text("Account")')
      await expect(page.locator('button:has-text("Account")')).toHaveClass(/border-black/)

      // Fill password fields
      await page.fill('input[id="currentPassword"]', TEST_USER.password)
      await page.fill('input[id="newPassword"]', 'NewPass123!@#')
      await page.fill('input[id="confirmPassword"]', 'NewPass123!@#')

      // Save changes
      await page.click('button:has-text("Save Changes")')

      // Verify success
      await expect(page.locator('text=Password updated')).toBeVisible()

      // Verify form is reset
      await expect(page.locator('input[id="currentPassword"]')).toHaveValue('')
      await expect(page.locator('input[id="newPassword"]')).toHaveValue('')
      await expect(page.locator('input[id="confirmPassword"]')).toHaveValue('')
    })

    test('validates password requirements', async ({ page }) => {
      await page.click('button:has-text("Account")')

      // Try weak password
      await page.fill('input[id="currentPassword"]', TEST_USER.password)
      await page.fill('input[id="newPassword"]', 'weak')
      await page.fill('input[id="confirmPassword"]', 'weak')

      await page.click('button:has-text("Save Changes")')

      // Verify validation error
      await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
    })

    test('validates password confirmation match', async ({ page }) => {
      await page.click('button:has-text("Account")')

      // Fill mismatched passwords
      await page.fill('input[id="currentPassword"]', TEST_USER.password)
      await page.fill('input[id="newPassword"]', 'NewPass123!@#')
      await page.fill('input[id="confirmPassword"]', 'DifferentPass123!@#')

      await page.click('button:has-text("Save Changes")')

      // Verify validation error
      await expect(page.locator('text=Passwords do not match')).toBeVisible()
    })

    test('shows two-factor authentication option', async ({ page }) => {
      await page.click('button:has-text("Account")')

      // Verify 2FA section
      await expect(page.locator('text=Two-Factor Authentication')).toBeVisible()
      await expect(page.locator('text=SMS Authentication')).toBeVisible()
      await expect(page.locator('text=Not enabled')).toBeVisible()
      await expect(page.locator('button:has-text("Enable")')).toBeVisible()
    })

    test('shows danger zone', async ({ page }) => {
      await page.click('button:has-text("Account")')

      // Verify danger zone
      await expect(page.locator('text=Danger Zone')).toBeVisible()
      await expect(page.locator('text=Delete Account')).toBeVisible()
      await expect(page.locator('text=Permanently delete your account and all data')).toBeVisible()
    })
  })

  test.describe('Notifications Tab', () => {
    test('updates notification preferences', async ({ page }) => {
      // Navigate to Notifications tab
      await page.click('button:has-text("Notifications")')
      await expect(page.locator('button:has-text("Notifications")')).toHaveClass(/border-black/)

      // Toggle task reminders off
      const taskRemindersToggle = page.locator('text=Task reminders').locator('..').locator('input[type="checkbox"]')
      await taskRemindersToggle.uncheck()

      // Toggle vendor messages off
      const vendorMessagesToggle = page.locator('text=Vendor messages').locator('..').locator('input[type="checkbox"]')
      await vendorMessagesToggle.uncheck()

      // Enable daily digest
      const dailyDigestToggle = page.locator('text=Daily Digest').locator('..').locator('input[type="checkbox"]')
      await dailyDigestToggle.check()

      // Save changes
      await page.click('button:has-text("Save Changes")')

      // Verify success
      await expect(page.locator('text=Notifications updated')).toBeVisible()

      // Reload and verify persistence
      await page.reload()
      await page.click('button:has-text("Notifications")')

      await expect(taskRemindersToggle).not.toBeChecked()
      await expect(vendorMessagesToggle).not.toBeChecked()
      await expect(dailyDigestToggle).toBeChecked()
    })

    test('toggles all notifications', async ({ page }) => {
      await page.click('button:has-text("Notifications")')

      // Find toggle all switch
      const toggleAllSwitch = page.locator('text=Enable all notifications').locator('..').locator('input[type="checkbox"]')
      
      // Toggle all off
      await toggleAllSwitch.uncheck()

      // Verify all toggles are off
      const allToggles = page.locator('input[type="checkbox"]')
      const count = await allToggles.count()
      for (let i = 0; i < count; i++) {
        await expect(allToggles.nth(i)).not.toBeChecked()
      }

      // Toggle all on
      await toggleAllSwitch.check()

      // Verify all toggles are on
      for (let i = 0; i < count; i++) {
        await expect(allToggles.nth(i)).toBeChecked()
      }
    })
  })

  test.describe('Theme Tab', () => {
    test('changes color scheme', async ({ page }) => {
      // Navigate to Theme tab
      await page.click('button:has-text("Theme")')
      await expect(page.locator('button:has-text("Theme")')).toHaveClass(/border-black/)

      // Select Ocean Breeze theme
      await page.click('text=Ocean Breeze')

      // Save changes
      await page.click('button:has-text("Save Changes")')

      // Verify success
      await expect(page.locator('text=Theme updated')).toBeVisible()

      // Verify theme is applied to document
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean-breeze')

      // Verify theme preview updates
      const themePreview = page.locator('[data-theme="ocean-breeze"]')
      await expect(themePreview).toBeVisible()
    })

    test('changes font size', async ({ page }) => {
      await page.click('button:has-text("Theme")')

      // Change font size to large
      await page.selectOption('select[id="fontSize"]', 'large')

      // Save changes
      await page.click('button:has-text("Save Changes")')

      // Verify font size is applied
      await expect(page.locator('html')).toHaveAttribute('data-font-size', 'large')
    })

    test('toggles compact mode', async ({ page }) => {
      await page.click('button:has-text("Theme")')

      // Enable compact mode
      const compactModeToggle = page.locator('text=Compact Mode').locator('..').locator('input[type="checkbox"]')
      await compactModeToggle.check()

      // Save changes
      await page.click('button:has-text("Save Changes")')

      // Verify compact mode is applied
      await expect(page.locator('html')).toHaveClass(/compact/)
    })
  })

  test.describe('Privacy Tab', () => {
    test('updates privacy settings', async ({ page }) => {
      // Navigate to Privacy tab
      await page.click('button:has-text("Privacy")')
      await expect(page.locator('button:has-text("Privacy")')).toHaveClass(/border-black/)

      // Change profile visibility
      await page.selectOption('select[id="profileVisibility"]', 'vendors')

      // Enable share with vendors
      const shareWithVendorsToggle = page.locator('text=Share with Vendors').locator('..').locator('input[type="checkbox"]')
      await shareWithVendorsToggle.check()

      // Disable guest uploads
      const guestUploadsToggle = page.locator('text=Guest Photo Uploads').locator('..').locator('input[type="checkbox"]')
      await guestUploadsToggle.uncheck()

      // Save changes
      await page.click('button:has-text("Save Changes")')

      // Verify success
      await expect(page.locator('text=Privacy settings updated')).toBeVisible()

      // Reload and verify persistence
      await page.reload()
      await page.click('button:has-text("Privacy")')

      await expect(page.locator('select[id="profileVisibility"]')).toHaveValue('vendors')
      await expect(shareWithVendorsToggle).toBeChecked()
      await expect(guestUploadsToggle).not.toBeChecked()
    })

    test('shows data export option', async ({ page }) => {
      await page.click('button:has-text("Privacy")')

      // Verify export section
      await expect(page.locator('text=Export Your Data')).toBeVisible()
      await expect(page.locator('button:has-text("Export")')).toBeVisible()

      // Click export button
      await page.click('button:has-text("Export")')
      
      // In a real test, we would verify the download started
    })
  })

  test.describe('Integrations Tab', () => {
    test('displays available integrations', async ({ page }) => {
      // Navigate to Integrations tab
      await page.click('button:has-text("Integrations")')
      await expect(page.locator('button:has-text("Integrations")')).toHaveClass(/border-black/)

      // Verify integrations are displayed
      await expect(page.locator('text=Google Calendar')).toBeVisible()
      await expect(page.locator('text=Instagram')).toBeVisible()
      await expect(page.locator('text=Pinterest')).toBeVisible()
      await expect(page.locator('text=Dropbox')).toBeVisible()

      // Verify connect buttons
      const connectButtons = page.locator('button:has-text("Connect")')
      expect(await connectButtons.count()).toBe(4)
    })

    test('shows API key section', async ({ page }) => {
      await page.click('button:has-text("Integrations")')

      // Verify API section
      await expect(page.locator('text=API Access')).toBeVisible()
      await expect(page.locator('text=API Key')).toBeVisible()
      await expect(page.locator('code')).toBeVisible()

      // Verify action buttons
      await expect(page.locator('button[aria-label="Show API key"]')).toBeVisible()
      await expect(page.locator('button[aria-label="Copy API key"]')).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('works on mobile viewport', async ({ page }) => {
      // Verify header is visible
      await expect(page.locator('h1:has-text("Settings")')).toBeVisible()

      // Verify tabs are horizontally scrollable
      const tabNav = page.locator('nav[aria-label="Settings tabs"]')
      await expect(tabNav).toHaveCSS('overflow-x', 'auto')

      // Navigate through tabs
      await page.click('button:has-text("Theme")')
      await expect(page.locator('text=Color Scheme')).toBeVisible()

      // Verify cards stack vertically
      const cards = page.locator('.card')
      const firstCard = cards.first()
      const secondCard = cards.nth(1)
      
      const firstBox = await firstCard.boundingBox()
      const secondBox = await secondCard.boundingBox()
      
      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height)
      }
    })
  })

  test.describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async ({ page }) => {
      // Check form inputs have labels
      const inputs = page.locator('input:not([type="checkbox"]):not([type="file"])')
      const count = await inputs.count()
      
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i)
        const id = await input.getAttribute('id')
        if (id) {
          const label = page.locator(`label[for="${id}"]`)
          await expect(label).toBeVisible()
        }
      }

      // Check switches have proper roles
      const switches = page.locator('input[type="checkbox"]')
      const switchCount = await switches.count()
      
      for (let i = 0; i < switchCount; i++) {
        await expect(switches.nth(i)).toHaveAttribute('role', 'switch')
      }

      // Check navigation has proper ARIA label
      await expect(page.locator('nav[aria-label="Settings tabs"]')).toBeVisible()
    })

    test('supports keyboard navigation', async ({ page }) => {
      // Tab through form fields
      await page.keyboard.press('Tab')
      await expect(page.locator('input[id="fullName"]')).toBeFocused()

      // Navigate to next field
      await page.keyboard.press('Tab')
      await expect(page.locator('input[id="email"]')).toBeFocused()

      // Navigate to tabs
      const profileTab = page.locator('button:has-text("Profile")')
      await profileTab.focus()
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('button:has-text("Account")')).toBeFocused()
    })
  })

  test.describe('Error Handling', () => {
    test('handles network errors gracefully', async ({ page }) => {
      // Intercept and fail the API request
      await page.route('**/api/settings/profile', (route) => {
        route.abort('failed')
      })

      // Try to save profile
      const fullNameInput = page.locator('input[id="fullName"]')
      await fullNameInput.clear()
      await fullNameInput.fill('Network Test')
      
      await page.click('button:has-text("Save Changes")')

      // Verify error toast
      await expect(page.locator('text=Error')).toBeVisible()
      await expect(page.locator('text=Failed to update profile')).toBeVisible()
    })

    test('handles session expiry', async ({ page }) => {
      // Simulate session expiry by intercepting auth check
      await page.route('**/auth/v1/user', (route) => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ error: 'Session expired' })
        })
      })

      // Try to perform an action
      await page.click('button:has-text("Account")')
      await page.fill('input[id="newPassword"]', 'Test123!@#')
      await page.click('button:has-text("Save Changes")')

      // Should redirect to login
      await page.waitForURL('/login')
    })
  })
})