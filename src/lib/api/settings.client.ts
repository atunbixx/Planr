"use client"

import AuthClient from '@/lib/auth/client'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message: string } }

export type WeddingDetails = {
  venue?: string
  weddingDate?: string
  budget?: number
  guestCount?: number
}

export type Preferences = {
  currency?: string
  language?: string
  region?: string
  timeZone?: string
  dateFormat?: string
  timeFormat?: string
}

function authHeaders(): HeadersInit {
  const token = AuthClient.getToken()
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({ success: false })) as ApiEnvelope<T>
  if (!res.ok || !json.success) throw new Error(json?.error?.message || `Request failed ${res.status}`)
  return json.data as T
}

export const SettingsClient = {
  async getWeddingDetails(): Promise<WeddingDetails | null> {
    const res = await fetch('/api/wedding-details', { headers: authHeaders() })
    return handle<WeddingDetails | null>(res)
  },
  async updateWeddingDetails(data: WeddingDetails): Promise<WeddingDetails> {
    const res = await fetch('/api/wedding-details', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })
    return handle<WeddingDetails>(res)
  },
  async getPreferences(): Promise<Preferences> {
    const res = await fetch('/api/preferences', { headers: authHeaders() })
    return handle<Preferences>(res)
  },
  async updatePreferences(data: Preferences): Promise<Preferences> {
    const res = await fetch('/api/preferences', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })
    return handle<Preferences>(res)
  },
}

