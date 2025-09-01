import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test('update wedding details and preferences', async ({ page, request }) => {
    const email = `settings-${Date.now()}@example.com`
    const password = 'Passw0rd!'

    // Sign up and get token
    const signup = await request.post('/api/auth/signup', { data: { email, password, role: 'couple' } })
    expect(signup.ok()).toBeTruthy()
    const token = (await signup.json())?.data?.token
    expect(token).toBeTruthy()
    const headers = { Authorization: `Bearer ${token}` }

    // Complete onboarding (required)
    const onboarding = await request.post('/api/onboarding', {
      headers,
      data: { brideName: 'Jane', groomName: 'John', weddingDate: '2025-08-01', venue: 'Init', guestCount: 10, budget: 10000 }
    })
    expect(onboarding.ok()).toBeTruthy()

    // Prepare auth for UI
    await page.addInitScript((t) => localStorage.setItem('auth-token', t as string), token)
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')

    // Update wedding details
    await page.fill('#venue', 'Grand Ballroom')
    await page.fill('#weddingDate', '2025-12-31')
    await page.fill('#budget', '25000')
    await page.fill('#guestCount', '150')
    await page.click('[data-testid="save-wedding-details"]')
    await expect(page.locator('text=Wedding details updated')).toBeVisible()

    // Update preferences
    await page.fill('#currency', 'USD')
    await page.fill('#language', 'en')
    await page.fill('#region', 'US')
    await page.fill('#timeZone', 'America/Los_Angeles')
    await page.fill('#dateFormat', 'YYYY-MM-DD')
    await page.fill('#timeFormat', 'HH:mm')
    await page.click('[data-testid="save-preferences"]')
    await expect(page.locator('text=Preferences updated')).toBeVisible()
  })
})

