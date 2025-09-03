"use client"

import { api } from '@/lib/api/fetcher'
import type { CreateAlbumInput, CreatePhotoInput } from '@/features/photos/dto/photo.dto'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message: string } }

export const PhotosClient = {
  async list(params?: { albumId?: string; q?: string; limit?: number; offset?: number }) {
    const qs = new URLSearchParams()
    if (params?.albumId) qs.set('albumId', params.albumId)
    if (params?.q) qs.set('q', params.q)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    const url = `/api/photos${qs.toString() ? `?${qs}` : ''}`
    const res = await api.get<ApiEnvelope<{ photos: any[]; total: number; limit: number; offset: number }>>(url)
    if (!res.success) throw new Error(res.error?.message || 'Failed to load photos')
    return res.data!
  },
  async create(data: CreatePhotoInput) {
    const res = await api.post<ApiEnvelope<any>>('/api/photos', data)
    if (!res.success) throw new Error(res.error?.message || 'Failed to create photo')
    return res.data!
  },
  async reorder(albumId: string | null, orderedIds: string[]) {
    const res = await api.post<ApiEnvelope<{ reordered: true }>>('/api/photos/reorder', { albumId, orderedIds })
    if (!res.success) throw new Error(res.error?.message || 'Failed to reorder')
    return res.data!
  },
}

export const AlbumsClient = {
  async list(params?: { limit?: number; offset?: number }) {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    const url = `/api/albums${qs.toString() ? `?${qs}` : ''}`
    const res = await api.get<ApiEnvelope<{ albums: any[]; total: number; limit: number; offset: number }>>(url)
    if (!res.success) throw new Error(res.error?.message || 'Failed to load albums')
    return res.data!
  },
  async create(data: CreateAlbumInput) {
    const res = await api.post<ApiEnvelope<any>>('/api/albums', data)
    if (!res.success) throw new Error(res.error?.message || 'Failed to create album')
    return res.data!
  },
}

