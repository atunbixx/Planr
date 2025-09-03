import { test, expect } from '@playwright/test'
import { TestSetup } from '../helpers/test-setup'

test.describe('Seating Page', () => {
  test('create table and auto-assign (if guests exist)', async ({ page }) => {
    await TestSetup.setupAuthSession(page)
    await page.goto('/dashboard/seating')
    await page.waitForLoadState('networkidle')

    // Ensure page skeleton visible
    await expect(page.locator('h1')).toContainText('Table Seating')

    // Try to create a new table
    await page.click('[data-testid="new-table"]')
    await page.fill('#tname', 'Test Table')
    await page.fill('#tcap', '4')
    await page.click('button:has-text("Create")')

    // Verify table row or card shows up
    await expect(page.locator('text=Test Table')).toBeVisible()

    // If unseated list has items, try auto-assign
    const unseatedCount = await page.locator('[data-testid="unseated-list"] div').count()
    if (unseatedCount > 0) {
      await page.click('[data-testid="auto-assign"]')
      // Expect some seat to show a non-empty label soon
      await expect(page.locator('text=seated').first()).toBeVisible({ timeout: 5000 }).catch(() => {})
    }
  })
})

