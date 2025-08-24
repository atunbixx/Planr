"use client"

import AuthClient from '@/lib/auth/client'

// Raw API model from /api/budget
export type RawBudgetItem = {
  id: string
  userId: string
  category: string
  amount: string | number
  allocated: string | number
  actual: string | number
  status: 'planned'|'quoted'|'booked'|'paid'
  createdAt: string
  updatedAt: string
}

export type BudgetSummary = {
  totalAmount: number
  totalAllocated: number
  totalActual: number
  remainingBudget: number
  percentSpent: number
}

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { message: string }
}

function authHeaders(): HeadersInit {
  const token = AuthClient.getToken()
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function handle<T>(res: Response): Promise<ApiEnvelope<T>> {
  const json = await res.json().catch(() => ({ success: false, error: { message: 'Invalid JSON response' } })) as ApiEnvelope<T>
  if (!res.ok || !json.success) throw new Error(json?.error?.message || `Request failed ${res.status}`)
  return json
}

export const BudgetClient = {
  async list(): Promise<{ items: RawBudgetItem[]; summary: BudgetSummary }>{
    const res = await fetch('/api/budget', { headers: authHeaders() })
    const env = await handle<{ items: RawBudgetItem[]; summary: BudgetSummary }>(res)
    return env.data as any
  },
  async create(data: Partial<RawBudgetItem>): Promise<RawBudgetItem> {
    const res = await fetch('/api/budget', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) })
    const env = await handle<RawBudgetItem>(res)
    return env.data as any
  },
  async update(id: string, data: Partial<RawBudgetItem>): Promise<RawBudgetItem> {
    const res = await fetch(`/api/budget/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) })
    const env = await handle<RawBudgetItem>(res)
    return env.data as any
  },
  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/budget/${id}`, { method: 'DELETE', headers: authHeaders() })
    await handle(res)
  }
}

