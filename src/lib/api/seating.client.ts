"use client"

import AuthClient from '@/lib/auth/client'

export type SeatingTable = {
  id: string
  name: string
  capacity: number
  guestIds: string[]
}

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { message: string; code?: string; statusCode?: number }
}

function authHeaders(): HeadersInit {
  const token = AuthClient.getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handle<T>(res: Response): Promise<T> {
  const json: ApiEnvelope<any> = await res.json().catch(() => ({ success: false, error: { message: 'Invalid JSON response' } }))
  if (!res.ok || !json.success) {
    const msg = json?.error?.message || `Request failed with ${res.status}`
    throw new Error(msg)
  }
  return json.data as T
}

export const SeatingClient = {
  async listTables(): Promise<SeatingTable[]> {
    const res = await fetch('/api/seating', { headers: authHeaders(), method: 'GET' })
    const data = await handle<{ tables: SeatingTable[] }>(res)
    return data.tables || []
  },

  async createTable(name: string, capacity: number): Promise<SeatingTable> {
    const res = await fetch('/api/seating', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name, capacity }) })
    return handle<SeatingTable>(res)
  },

  async updateTable(id: string, data: Partial<{ name: string; capacity: number }>): Promise<SeatingTable> {
    const res = await fetch(`/api/seating/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })
    return handle<SeatingTable>(res)
  },

  async deleteTable(id: string): Promise<boolean> {
    const res = await fetch(`/api/seating/${id}`, { method: 'DELETE', headers: authHeaders() })
    const data = await handle<unknown>(res)
    return true
  },

  async assignGuests(tableId: string, guestIds: string[]): Promise<SeatingTable> {
    const res = await fetch('/api/seating/assign', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'assign', tableId, guestIds }) })
    return handle<SeatingTable>(res)
  },

  async unassignGuest(guestId: string): Promise<boolean> {
    const res = await fetch('/api/seating/assign', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ action: 'unassign', guestId }) })
    const data = await handle<{ unassigned: boolean } | { unassigned?: boolean }>(res)
    return (data as any).unassigned ?? true
  },

  async autoAssign(groupByRelationship?: boolean): Promise<SeatingTable[]> {
    const res = await fetch('/api/seating/auto-assign', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ groupByRelationship: !!groupByRelationship }) })
    const data = await handle<{ tables: SeatingTable[] }>(res)
    return data.tables || []
  },
}

