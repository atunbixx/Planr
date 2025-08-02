import { apiClient } from '../base/client'
import { ApiResponse, PaginatedResponse, QueryParams } from '../types'
import { Vendor, VendorInsert, VendorUpdate, VendorCategory, VendorStatus } from '@/types/database'

export interface VendorFilters extends QueryParams {
  category?: VendorCategory
  status?: VendorStatus
  min_price?: number
  max_price?: number
  booked?: boolean
  search?: string
}

export interface VendorWithDetails extends Vendor {
  category_info?: {
    name: string
    icon: string
    color: string
  }
  contact_history?: {
    last_contacted: string
    contact_count: number
  }
  documents?: {
    id: string
    name: string
    type: string
    url: string
    uploaded_at: string
  }[]
  payments?: {
    total_paid: number
    total_pending: number
    next_payment_date?: string
  }
}

export interface VendorComparison {
  vendors: VendorWithDetails[]
  comparison: {
    price_range: { min: number; max: number; average: number }
    features: { feature: string; vendors: Record<string, boolean> }[]
    ratings: Record<string, number>
    availability: Record<string, boolean>
  }
}

class VendorsApiService {
  private basePath = '/vendors'

  // Get all vendors with filters
  async getVendors(
    filters?: VendorFilters
  ): Promise<ApiResponse<PaginatedResponse<VendorWithDetails>>> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value))
        }
      })
    }
    
    return apiClient.get<PaginatedResponse<VendorWithDetails>>(
      `${this.basePath}?${params}`
    )
  }

  // Get single vendor
  async getVendor(id: string): Promise<ApiResponse<VendorWithDetails>> {
    return apiClient.get<VendorWithDetails>(`${this.basePath}/${id}`)
  }

  // Create vendor
  async createVendor(data: VendorInsert): Promise<ApiResponse<Vendor>> {
    return apiClient.post<Vendor>(this.basePath, data)
  }

  // Update vendor
  async updateVendor(
    id: string,
    data: VendorUpdate
  ): Promise<ApiResponse<Vendor>> {
    return apiClient.patch<Vendor>(`${this.basePath}/${id}`, data)
  }

  // Delete vendor
  async deleteVendor(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.delete<{ success: boolean }>(`${this.basePath}/${id}`)
  }

  // Update vendor status
  async updateStatus(
    id: string,
    status: VendorStatus,
    notes?: string
  ): Promise<ApiResponse<Vendor>> {
    return apiClient.patch<Vendor>(`${this.basePath}/${id}/status`, {
      status,
      notes
    })
  }

  // Book vendor
  async bookVendor(
    id: string,
    details: {
      contract_signed: boolean
      deposit_paid: boolean
      deposit_amount?: number
      booking_date: string
      notes?: string
    }
  ): Promise<ApiResponse<Vendor>> {
    return apiClient.post<Vendor>(`${this.basePath}/${id}/book`, details)
  }

  // Add vendor contact
  async addContact(
    vendorId: string,
    contact: {
      type: 'email' | 'phone' | 'meeting' | 'other'
      summary: string
      details?: string
      follow_up_date?: string
    }
  ): Promise<ApiResponse<{ id: string }>> {
    return apiClient.post<{ id: string }>(
      `${this.basePath}/${vendorId}/contacts`,
      contact
    )
  }

  // Upload vendor document
  async uploadDocument(
    vendorId: string,
    file: File,
    type: 'contract' | 'invoice' | 'quote' | 'other'
  ): Promise<ApiResponse<{ id: string; url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return apiClient.upload<{ id: string; url: string }>(
      `${this.basePath}/${vendorId}/documents`,
      formData
    )
  }

  // Compare vendors
  async compareVendors(
    vendorIds: string[]
  ): Promise<ApiResponse<VendorComparison>> {
    return apiClient.post<VendorComparison>(`${this.basePath}/compare`, {
      vendor_ids: vendorIds
    })
  }

  // Get vendor recommendations
  async getRecommendations(
    category: VendorCategory,
    preferences?: {
      budget?: number
      style?: string
      location?: string
    }
  ): Promise<ApiResponse<VendorWithDetails[]>> {
    return apiClient.post<VendorWithDetails[]>(
      `${this.basePath}/recommendations`,
      {
        category,
        ...preferences
      }
    )
  }

  // Search vendors
  async searchVendors(
    query: string,
    options?: {
      categories?: VendorCategory[]
      location?: string
      radius?: number
    }
  ): Promise<ApiResponse<VendorWithDetails[]>> {
    return apiClient.post<VendorWithDetails[]>(`${this.basePath}/search`, {
      query,
      ...options
    })
  }

  // Get vendor analytics
  async getAnalytics(): Promise<ApiResponse<{
    by_category: Record<VendorCategory, number>
    by_status: Record<VendorStatus, number>
    total_budget: number
    total_spent: number
    booked_count: number
    average_response_time: number
  }>> {
    return apiClient.get(`${this.basePath}/analytics`)
  }
}

export const vendorsApi = new VendorsApiService()