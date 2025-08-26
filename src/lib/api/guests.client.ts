"use client"

import { api } from '@/lib/api/fetcher'
import { GuestListResponseDto } from '@/contracts/guests'

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
    const env = await api.get<ApiEnvelope<unknown>>(url)
    if (!env.success) throw new Error(env.error?.message || 'Failed to load guests')
    const parsed = GuestListResponseDto.safeParse(env.data)
    if (!parsed.success) throw new Error('Invalid guests response shape')
    // Map to LegacyGuest for page compatibility
    const guests: LegacyGuest[] = parsed.data.guests.map((g:any) => ({
      id: g.id,
      name: `${g.firstName} ${g.lastName || ''}`.trim(),
      rsvpStatus: 'pending', // until RSVP feature is fully wired to this client
      mealPreference: g.dietaryRestrictions || undefined,
      side: g.side || undefined,
      invitationSent: Boolean(g.invitationSentAt),
      relationshipCategory: g.relationshipCategory || undefined,
    }))
    return { guests, total: parsed.data.total, limit: parsed.data.limit, offset: parsed.data.offset }
  },
  async createGuest(payload: Partial<LegacyGuest & { plusOneAllowed?: boolean; plusOneName?: string; householdId?: string | null; tags?: string[] }>): Promise<LegacyGuest> {
    const env = await api.post<ApiEnvelope<unknown>>('/api/guests', payload)
    if (!env.success) throw new Error(env.error?.message || 'Failed to create guest')
    return env.data as any
  },
  async updateGuest(id: string, payload: Partial<LegacyGuest & { plusOneAllowed?: boolean; plusOneName?: string; householdId?: string | null; tags?: string[] }>): Promise<LegacyGuest> {
    const env = await api.put<ApiEnvelope<unknown>>(`/api/guests/${id}`, payload)
    if (!env.success) throw new Error(env.error?.message || 'Failed to update guest')
    return env.data as any
  },
  async deleteGuest(id: string): Promise<boolean> {
    const env = await api.delete<ApiEnvelope<{ deleted: true }>>(`/api/guests/${id}`)
    if (!env.success) throw new Error(env.error?.message || 'Failed to delete guest')
    return true
  },
  async setRsvpStatusBulk(ids: string[], status: 'pending'|'accepted'|'declined'): Promise<void> {
    await api.post('/api/guests/bulk', { action: 'setRsvpStatus', ids, status })
  },
  async setInvitationSentBulk(ids: string[], invited: boolean): Promise<void> {
    await api.post('/api/guests/bulk', { action: 'setInvitationSent', ids, invitationSent: invited })
  },
  async setHouseholdBulk(ids: string[], householdId: string | null): Promise<void> {
    await api.post('/api/guests/bulk', { action: 'setHousehold', ids, householdId })
  },
  async getStats(): Promise<{ total: number; bridesSide: number; groomsSide: number; withEmail: number; withPhone: number; plusOnesAllowed: number; totalAttending: number }>{
    const env = await api.get<ApiEnvelope<any>>('/api/guests/stats')
    if (!env.success) throw new Error(env.error?.message || 'Failed to get guest stats')
    return env.data as any
  },
}
