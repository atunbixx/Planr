import { test, expect } from '@playwright/test'

test.describe('Seating API', () => {
  test('create table, create guest, assign seat', async ({ request }) => {
    const email = `api-${Date.now()}@example.com`
    const password = 'Passw0rd!'

    // 1) Sign up to get token
    const signupRes = await request.post('/api/auth/signup', {
      data: { email, password, role: 'couple' }
    })
    expect(signupRes.ok()).toBeTruthy()
    const signupJson = await signupRes.json()
    const token = signupJson?.data?.token as string
    expect(token).toBeTruthy()

    const authHeaders = { Authorization: `Bearer ${token}` }

    // 2) Complete onboarding (required for protected routes)
    const onboardingRes = await request.post('/api/onboarding', {
      headers: authHeaders,
      data: {
        brideName: 'Jane Doe',
        groomName: 'John Doe',
        weddingDate: '2025-08-01',
        venue: 'Test Venue',
        guestCount: 10,
        budget: 10000
      }
    })
    expect(onboardingRes.ok()).toBeTruthy()

    // 3) Create a guest
    const guestRes = await request.post('/api/guests', {
      headers: authHeaders,
      data: { firstName: 'Alice', lastName: 'Johnson', side: 'bride' }
    })
    expect(guestRes.ok()).toBeTruthy()
    const guestJson = await guestRes.json()
    const guestId = guestJson?.data?.id as string
    expect(guestId).toBeTruthy()

    // 4) Create a table
    const tableRes = await request.post('/api/seating', {
      headers: authHeaders,
      data: { name: 'API Table', capacity: 4 }
    })
    expect(tableRes.ok()).toBeTruthy()
    const tableJson = await tableRes.json()
    const tableId = tableJson?.data?.id as string
    expect(tableId).toBeTruthy()

    // 5) Get seating chart (tables + seats)
    const listRes = await request.get('/api/seating', { headers: authHeaders })
    expect(listRes.ok()).toBeTruthy()
    const listJson = await listRes.json()
    const tables = listJson?.data?.tables as any[]
    expect(Array.isArray(tables)).toBeTruthy()
    const created = tables.find((t) => t.id === tableId)
    expect(created).toBeTruthy()
    expect(created.seats?.length).toBe(4)

    // 6) Assign guest to first seat
    const seatId = created.seats[0].id as string
    const assignRes = await request.post(`/api/seating/seats/${seatId}/assign`, {
      headers: authHeaders,
      data: { guestId }
    })
    expect(assignRes.ok()).toBeTruthy()

    // 7) Read table again and verify assignment
    const getTableRes = await request.get(`/api/seating/${tableId}`, { headers: authHeaders })
    expect(getTableRes.ok()).toBeTruthy()
    const getTableJson = await getTableRes.json()
    const seats = getTableJson?.data?.seats as any[]
    expect(seats?.some((s) => s.id === seatId && s.guestId === guestId)).toBeTruthy()
  })
})

