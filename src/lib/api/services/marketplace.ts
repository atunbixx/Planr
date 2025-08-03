import { apiClient } from '../base/client'
import { ApiResponse, PaginatedResponse, QueryParams } from '../types'

export interface MarketplaceVendorFilters extends QueryParams {
  category?: string
  location?: string
  minRating?: number
  maxPrice?: number
  verified?: boolean
  featured?: boolean
  search?: string
  sortBy?: 'rating' | 'price' | 'distance' | 'newest'
  sortOrder?: 'asc' | 'desc'
}

export interface MarketplaceVendor {
  id: string
  business_name: string
  vendor_name: string
  email: string
  phone: string
  website?: string
  category: string
  subcategories: string[]
  description: string
  services: string[]
  min_price: number
  max_price: number
  currency: string
  pricing_model: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  latitude: number
  longitude: number
  service_radius: number
  is_verified: boolean
  verification_date?: string
  badges: string[]
  email_enabled: boolean
  phone_enabled: boolean
  sms_enabled: boolean
  whatsapp_enabled: boolean
  instant_booking: boolean
  requires_consultation: boolean
  consultation_fee: number
  cancellation_policy: string
  portfolio_images: string[]
  portfolio_videos: string[]
  portfolio_documents: string[]
  average_rating: number
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface VendorPackage {
  id: string
  vendor_id: string
  name: string
  description: string
  price: number
  duration: string
  includes: string[]
  image_url?: string
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface VendorReview {
  id: string
  vendor_id: string
  couple_id: string
  rating: number
  title: string
  comment: string
  images?: string[]
  helpful_count: number
  created_at: string
  updated_at: string
  couple_name: string
  is_verified: boolean
}

export interface QuoteRequest {
  id: string
  vendor_id: string
  couple_id: string
  service_type: string
  description: string
  event_date: string
  guest_count: number
  budget_min: number
  budget_max: number
  preferred_contact: string
  urgency: string
  status: 'pending' | 'reviewed' | 'quoted' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  updated_at: string
}

export interface VendorQuote {
  id: string
  request_id: string
  vendor_id: string
  package_name: string
  price: number
  valid_until: string
  terms: string
  includes: string[]
  created_at: string
}

export interface VendorAvailability {
  vendor_id: string
  available: boolean
  next_available?: string
  availability: Array<{
    date: string
    available: boolean
    slots: Array<{
      start_time: string
      end_time: string
      available: boolean
    }>
  }>
}

export interface VendorAnalytics {
  vendor_id: string
  total_views: number
  total_inquiries: number
  total_bookings: number
  average_response_time: number
  conversion_rate: number
  monthly_stats: Array<{
    month: string
    views: number
    inquiries: number
    bookings: number
  }>
}

export const marketplaceApi = {
  // Vendor discovery
  async getVendors(filters?: MarketplaceVendorFilters): Promise<PaginatedResponse<MarketplaceVendor>> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const response = await apiClient.get(`/api/marketplace/vendors?${params}`)
    return response.data
  },

  async getVendorById(id: string): Promise<MarketplaceVendor> {
    const response = await apiClient.get(`/api/marketplace/vendors/${id}`)
    return response.data
  },

  async getFeaturedVendors(): Promise<MarketplaceVendor[]> {
    const response = await apiClient.get('/api/marketplace/vendors/featured')
    return response.data
  },

  // Reviews
  async getVendorReviews(vendorId: string, page = 1, limit = 10): Promise<PaginatedResponse<VendorReview>> {
    const response = await apiClient.get(
      `/api/marketplace/vendors/${vendorId}/reviews?page=${page}&limit=${limit}`
    )
    return response.data
  },

  async createReview(vendorId: string, review: Omit<VendorReview, 'id' | 'created_at' | 'updated_at'>): Promise<VendorReview> {
    const response = await apiClient.post(`/api/marketplace/vendors/${vendorId}/reviews`, review)
    return response.data
  },

  // Quote requests
  async requestQuote(quoteRequest: Omit<QuoteRequest, 'id' | 'created_at' | 'updated_at'>): Promise<QuoteRequest> {
    const response = await apiClient.post('/api/marketplace/quotes/request', quoteRequest)
    return response.data
  },

  async getQuoteRequests(vendorId?: string): Promise<QuoteRequest[]> {
    const params = vendorId ? `?vendor_id=${vendorId}` : ''
    const response = await apiClient.get(`/api/marketplace/quotes${params}`)
    return response.data
  },

  async getQuoteById(id: string): Promise<VendorQuote> {
    const response = await apiClient.get(`/api/marketplace/quotes/${id}`)
    return response.data
  },

  // Availability
  async getVendorAvailability(vendorId: string, date?: string): Promise<VendorAvailability> {
    const params = date ? `?date=${date}` : ''
    const response = await apiClient.get(`/api/marketplace/vendors/${vendorId}/availability${params}`)
    return response.data
  },

  // Analytics
  async getVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
    const response = await apiClient.get(`/api/marketplace/vendors/${vendorId}/analytics`)
    return response.data
  },

  async getMarketplaceAnalytics(period?: string): Promise<any> {
    const params = period ? `?period=${period}` : ''
    const response = await apiClient.get(`/api/marketplace/analytics${params}`)
    return response.data
  },

  // Vendor packages
  async getVendorPackages(vendorId: string, featuredOnly?: boolean): Promise<VendorPackage[]> {
    const params = featuredOnly ? '?featured=true' : ''
    const response = await apiClient.get(`/api/marketplace/vendors/${vendorId}/packages${params}`)
    return response.data
  },

  // Contact vendor
  async contactVendor(vendorId: string, message: {
    subject: string
    message: string
    event_date?: string
    budget?: number
    preferred_contact?: string
    urgency?: string
  }): Promise<any> {
    const response = await apiClient.post(`/api/marketplace/vendors/${vendorId}/contact`, message)
    return response.data
  },

  // Search vendors
  async searchVendors(searchTerm: string, filters?: MarketplaceVendorFilters): Promise<PaginatedResponse<MarketplaceVendor>> {
    const params = new URLSearchParams()
    
    if (searchTerm) {
      params.append('search', searchTerm)
    }
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const response = await apiClient.get(`/api/marketplace/vendors/search?${params}`)
    return response.data
  }
}