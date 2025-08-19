"use client"

import AuthClient from '@/lib/auth/client'

export type Vendor = {
  id: string
  name: string
  category: string
  status?: 'inquiry'|'shortlisted'|'quoted'|'booked'|'contracted'|'paid' | null
  priceRange?: string
  contact?: string
  website?: string
  isFavorite?: boolean
  createdAt: string
  updatedAt: string
  // optional extras
  email?: string
  phone?: string
  address?: string
  city?: string
  tags?: string[]
  notes?: string
  quoteAmount?: number
  bookedDate?: string
  instagramUrl?: string
  logoUrl?: string
}

type ApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: { message: string; code?: string; statusCode?: number }
  total?: number | null
  page?: number | null
  pageSize?: number | null
}

function authHeaders(): HeadersInit {
  const token = AuthClient.getToken()
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

function normalizeVendor(raw: any): Vendor {
  if (!raw) return raw
  const v: any = { ...raw }
  if (typeof v.isfavorite !== 'undefined' && typeof v.isFavorite === 'undefined') {
    v.isFavorite = Boolean(v.isfavorite)
  }
  if (typeof v.quoteamount !== 'undefined' && typeof v.quoteAmount === 'undefined') {
    v.quoteAmount = Number(v.quoteamount)
  }
  if (typeof v.bookeddate !== 'undefined' && typeof v.bookedDate === 'undefined') {
    v.bookedDate = v.bookeddate
  }
  if (typeof v.instagramurl !== 'undefined' && typeof v.instagramUrl === 'undefined') {
    v.instagramUrl = v.instagramurl
  }
  if (typeof v.logourl !== 'undefined' && typeof v.logoUrl === 'undefined') {
    v.logoUrl = v.logourl
  }
  return v as Vendor
}

async function handle<T>(res: Response): Promise<ApiEnvelope<T>> {
  const json = await res.json().catch(() => ({ success: false, error: { message: 'Invalid JSON response' } })) as ApiEnvelope<T>
  if (!res.ok || !json.success) {
    throw new Error(json?.error?.message || `Request failed with ${res.status}`)
  }
  return json
}

export const VendorsClient = {
  async listVendors(params?: { category?: string; status?: string; q?: string; page?: number; pageSize?: number }): Promise<{ vendors: Vendor[]; total?: number }>{
    const qs = new URLSearchParams()
    if (params?.category && params.category !== 'all') qs.set('category', params.category)
    if (params?.status && params.status !== 'all') qs.set('status', params.status)
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    const res = await fetch(`/api/vendors${qs.toString() ? `?${qs.toString()}` : ''}`, { headers: authHeaders() })
    const env = await handle<any[]>(res)
    const vendors = Array.isArray(env.data) ? env.data.map(normalizeVendor) : []
    return { vendors, total: env.total ?? undefined }
  },

  async createVendor(payload: Partial<Vendor>): Promise<Vendor> {
    const res = await fetch('/api/vendors', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) })
    const env = await handle<any>(res)
    return normalizeVendor(env.data)
  },

  async updateVendor(id: string, payload: Partial<Vendor>): Promise<Vendor> {
    const res = await fetch(`/api/vendors/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) })
    const env = await handle<any>(res)
    return normalizeVendor(env.data)
  },

  async deleteVendor(id: string): Promise<void> {
    const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE', headers: authHeaders() })
    await handle(res)
  },
}

