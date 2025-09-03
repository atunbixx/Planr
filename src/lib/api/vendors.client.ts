"use client"

import { api } from '@/lib/api/fetcher'
import { VendorDto, VendorListResponseDto } from '@/contracts/vendors'
import { z } from 'zod'

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

export const VendorsClient = {
  async listVendors(params?: { category?: string; status?: string; q?: string; page?: number; pageSize?: number }): Promise<{ vendors: Vendor[]; total?: number }>{
    const qs = new URLSearchParams()
    if (params?.category && params.category !== 'all') qs.set('category', params.category)
    if (params?.status && params.status !== 'all') qs.set('status', params.status)
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    const env = await api.get<ApiEnvelope<any>>(`/api/vendors${qs.toString() ? `?${qs.toString()}` : ''}`)
    if (!env.success) throw new Error(env.error?.message || 'Failed to list vendors')
    const parsed = VendorListResponseDto.safeParse(env.data)
    if (!parsed.success) throw new Error('Invalid vendors response shape')
    const vendors = parsed.data.vendors.map(normalizeVendor)
    return { vendors, total: parsed.data.total ?? undefined }
  },

  async createVendor(payload: Partial<Vendor>): Promise<Vendor> {
    const env = await api.post<ApiEnvelope<any>>('/api/vendors', payload)
    if (!env.success) throw new Error(env.error?.message || 'Failed to create vendor')
    const parsed = VendorDto.safeParse(env.data)
    if (!parsed.success) throw new Error('Invalid vendor shape')
    return normalizeVendor(parsed.data)
  },

  async updateVendor(id: string, payload: Partial<Vendor>): Promise<Vendor> {
    const env = await api.put<ApiEnvelope<any>>(`/api/vendors/${id}`, payload)
    if (!env.success) throw new Error(env.error?.message || 'Failed to update vendor')
    const parsed = VendorDto.safeParse(env.data)
    if (!parsed.success) throw new Error('Invalid vendor shape')
    return normalizeVendor(parsed.data)
  },

  async deleteVendor(id: string): Promise<void> {
    const env = await api.delete<ApiEnvelope<any>>(`/api/vendors/${id}`)
    if (!env.success) throw new Error(env.error?.message || 'Failed to delete vendor')
  },
}
