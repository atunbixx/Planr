"use client"

import AuthClient from '@/lib/auth/client'

export type LegacyGuest = {
  id: string
  name: string
  rsvpStatus: 'pending'|'accepted'|'declined'
  mealPreference?: string
  side?: 'bride'|'groom'
  invitationSent: boolean
  relationshipCategory?: string
}

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { message: string; code?: string; statusCode?: number }
  total?: number
  limit?: number
  offset?: number
}

function authHeaders(): HeadersInit {
  const token = AuthClient.getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handle<T>(res: Response): Promise<ApiEnvelope<T>> {
  const json: ApiEnvelope<T> = await res.json().catch(() => ({ success: false, error: { message: 'Invalid JSON response' } } as any))
  if (!res.ok || !json.success) {
    const msg = (json && json.error && json.error.message) ? json.error.message : `Request failed with ${res.status}`
    throw new Error(msg)
  }
  return json
}

export const GuestsClient = {
  async listGuests(params?: { limit?: number; offset?: number; side?: 'bride'|'groom'; status?: 'pending'|'accepted'|'declined'; category?: string; dietary?: string }): Promise<{ guests: LegacyGuest[]; total?: number; limit?: number; offset?: number }> {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    if (params?.side) qs.set('side', params.side)
    if (params?.status) qs.set('status', params.status)
    if (params?.category) qs.set('category', params.category)
    if (params?.dietary) qs.set('dietary', params.dietary)
    const url = `/api/guests${qs.toString() ? `?${qs.toString()}` : ''}`
    const res = await fetch(url, { headers: authHeaders(), method: 'GET' })
    const env = await handle<LegacyGuest[]>(res)
    return { guests: env.data || [], total: env.total, limit: env.limit, offset: env.offset }
  },
  async createGuest(payload: Partial<LegacyGuest & { plusOneAllowed?: boolean; plusOneName?: string; householdId?: string | null; tags?: string[] }>): Promise<LegacyGuest> {
    const res = await fetch('/api/guests', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
    const env = await handle<LegacyGuest>(res)
    return env.data as any
  },
  async updateGuest(id: string, payload: Partial<LegacyGuest & { plusOneAllowed?: boolean; plusOneName?: string; householdId?: string | null; tags?: string[] }>): Promise<LegacyGuest> {
    const res = await fetch(`/api/guests/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) })
    const env = await handle<LegacyGuest>(res)
    return env.data as any
  },
  async deleteGuest(id: string): Promise<boolean> {
    const res = await fetch(`/api/guests/${id}`, { method: 'DELETE', headers: authHeaders() })
    const env = await handle<{ deleted: true }>(res)
    return true
  },
  async setRsvpStatusBulk(ids: string[], status: 'pending'|'accepted'|'declined'): Promise<void> {
    await fetch('/api/guests/bulk', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'setRsvpStatus', ids, status }) })
  },
  async setInvitationSentBulk(ids: string[], invited: boolean): Promise<void> {
    await fetch('/api/guests/bulk', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'setInvitationSent', ids, invitationSent: invited }) })
  },
  async setHouseholdBulk(ids: string[], householdId: string | null): Promise<void> {
    await fetch('/api/guests/bulk', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'setHousehold', ids, householdId }) })
  },
  async getStats(): Promise<{ total: number; bridesSide: number; groomsSide: number; withEmail: number; withPhone: number; plusOnesAllowed: number; totalAttending: number }>{
    const res = await fetch('/api/guests/stats', { headers: authHeaders() })
    const env = await handle<{ total: number; bridesSide: number; groomsSide: number; withEmail: number; withPhone: number; plusOnesAllowed: number; totalAttending: number }>(res)
    return env.data as any
  },
}
