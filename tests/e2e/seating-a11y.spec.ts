import { test, expect } from '@playwright/test'

test.describe('Seating Accessibility and Safety', () => {
  test('keyboard DnD announces and capacity shrink prompts confirm', async ({ page, request }) => {
    // Sign up and onboard to access dashboard
    const email = `a11y-${Date.now()}@example.com`
    const password = 'Passw0rd!'
    const signup = await request.post('/api/auth/signup', { data: { email, password, role: 'couple' } })
    expect(signup.ok()).toBeTruthy()
    const token = (await signup.json())?.data?.token
    expect(token).toBeTruthy()
    const headers = { Authorization: `Bearer ${token}` }

    const onboarding = await request.post('/api/onboarding', {
      headers,
      data: { brideName: 'Jane', groomName: 'John', weddingDate: '2025-08-01', venue: 'Test Venue', guestCount: 5, budget: 1000 }
    })
    expect(onboarding.ok()).toBeTruthy()

    // Create one guest
    const guestRes = await request.post('/api/guests', { headers, data: { firstName: 'Kay', lastName: 'Bee', side: 'bride' } })
    expect(guestRes.ok()).toBeTruthy()
    const guest = (await guestRes.json())?.data
    expect(guest?.id).toBeTruthy()

    // Auth session for UI
    await page.addInitScript((t) => localStorage.setItem('auth-token', t as string), token)

    await page.goto('/dashboard/seating')
    await page.waitForLoadState('networkidle')

    // Create a table via UI
    await page.click('[data-testid="new-table"]')
    await page.fill('#tname', 'A11Y Table')
    await page.fill('#tcap', '2')
    await page.click('button:has-text("Create")')
    await expect(page.locator('text=A11Y Table')).toBeVisible()

    // Keyboard DnD announce
    const firstGuest = page.locator('[data-testid="unseated-list"] > div').first()
    await firstGuest.focus()
    await page.keyboard.press('Space')
    await expect(page.locator('[aria-live="polite"]')).toContainText(/Start dragging/i)

    // Assign a guest via API to ensure we have assigned seats
    const seating = await request.get('/api/seating', { headers })
    const tables = (await seating.json())?.data?.tables as any[]
    const table = tables.find(t => t.name === 'A11Y Table')
    const seatId = table?.seats?.[0]?.id
    expect(seatId).toBeTruthy()
    const assign = await request.post(`/api/seating/seats/${seatId}/assign`, { headers, data: { guestId: guest.id } })
    expect(assign.ok()).toBeTruthy()

    // Open edit and reduce capacity below assigned, expect confirm dialog
    const dialogPromise = new Promise<boolean>((resolve) => {
      page.once('dialog', async (dialog) => {
        await dialog.dismiss()
        resolve(true)
      })
    })
    await page.click('button:has-text("Edit")')
    await page.fill('#ecap', '0')
    await page.click('button:has-text("Save")')
    const shown = await dialogPromise
    expect(shown).toBeTruthy()
  })
})

