// Database-matched interfaces
export interface CoupleVendor {
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
  created_at: string
  updated_at: string
}

// Frontend-compatible interface
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
  pricing: {
    min_price: number
    max_price: number
    currency: string
    pricing_model: string
  }
  location: {
    address: string
    city: string
    state: string
    zip_code: string
    country: string
    latitude: number
    longitude: number
    service_radius: number
  }
  portfolio: {
    images: string[]
    videos: string[]
    documents: string[]
  }
  reviews: {
    average_rating: number
    total_reviews: number
    recent_reviews: VendorReview[]
  }
  verification: {
    is_verified: boolean
    verification_date?: string
    badges: string[]
  }
  contact_preferences: {
    email_enabled: boolean
    phone_enabled: boolean
    sms_enabled: boolean
    whatsapp_enabled: boolean
  }
  booking_settings: {
    instant_booking: boolean
    requires_consultation: boolean
    consultation_fee: number
    cancellation_policy: string
  }
  created_at: string
  updated_at: string
}

export interface VendorReview {
  id: string
  vendor_id: string
  couple_id: string
  couple_name: string
  rating: number
  title: string
  content: string
  images: string[]
  wedding_date: string
  venue: string
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface QuoteRequest {
  id: string
  vendor_id: string
  couple_id: string
  wedding_date: string
  venue_name: string
  guest_count: number
  services_requested: string[]
  budget_range: {
    min: number
    max: number
  }
  special_requirements: string
  preferred_contact_method: 'email' | 'phone' | 'in_person'
  timeline: {
    decision_date: string
    event_date: string
  }
  status: 'pending' | 'reviewed' | 'quoted' | 'accepted' | 'rejected' | 'expired'
  quote?: VendorQuote
  created_at: string
  updated_at: string
}

export interface VendorQuote {
  id: string
  quote_request_id: string
  vendor_id: string
  base_price: number
  additional_services: {
    service: string
    price: number
    description: string
  }[]
  total_price: number
  validity_period: number
  terms: string
  payment_schedule: {
    deposit_amount: number
    deposit_percentage: number
    final_payment_date: string
  }
  includes: string[]
  excludes: string[]
  notes: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  updated_at: string
}

export interface VendorFilters {
  category?: string
  subcategory?: string
  location?: {
    city?: string
    state?: string
    radius?: number
  }
  price_range?: {
    min?: number
    max?: number
  }
  availability?: {
    date?: string
    flexible?: boolean
  }
  rating?: number
  verification_status?: 'all' | 'verified' | 'unverified'
  services?: string[]
  sort_by?: 'relevance' | 'rating' | 'price_low' | 'price_high' | 'distance' | 'newest'
}

// API Response Types
export interface MarketplaceVendorFilters {
  category?: string
  location?: string
  minRating?: number
  maxPrice?: number
  verified?: boolean
  featured?: boolean
  search?: string
  sortBy?: 'rating' | 'price' | 'newest' | 'popular'
  sortOrder?: 'asc' | 'desc'
}

export interface MarketplaceSearchResult {
  data: MarketplaceVendor[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  filters: MarketplaceVendorFilters
}

export interface MarketplaceAnalytics {
  summary: {
    total_vendors: number
    average_rating: number
    new_vendors_last_30_days: number
    total_reviews: number
  }
  categories: Array<{
    category: string
    count: number
    average_rating: number
  }>
  top_vendors: Array<{
    id: string
    business_name: string
    category: string
    rating: number
    review_count: number
    location: string
    price_range: string
    featured: boolean
  }>
  price_ranges: Array<{
    range: string
    count: number
  }>
  recent_activity: Array<{
    vendor_name?: string
    category?: string
    rating: number
    comment: string
    created_at: string
  }>
  trending_searches: string[]
  location_insights: {
    top_cities: Array<{
      city: string
      count: number
    }>
    top_states: Array<{
      state: string
      count: number
    }>
  }
}

export interface MarketplaceApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// Simplified vendor interface for marketplace display
export interface MarketplaceVendorDisplay {
  id: string
  business_name: string
  category: string
  description: string
  long_description?: string
  contact_email: string
  contact_phone: string
  website?: string
  address?: string
  city: string
  state: string
  zip_code?: string
  country: string
  average_rating: number
  total_reviews: number
  verified: boolean
  featured: boolean
  price_range: string
  specialties: string[]
  portfolio_images: string[]
  social_media?: Record<string, string>
  reviews?: VendorReview[]
  packages?: VendorPackage[]
  availability?: VendorAvailability
  stats?: {
    total_reviews: number
    total_packages: number
    average_rating: number
  }
  badges: string[]
  created_at: string
  updated_at: string
}

// Contact and booking types
export interface ContactRequest {
  vendor_id: string
  subject: string
  message: string
  preferred_contact?: 'email' | 'phone' | 'text'
  urgency?: 'low' | 'medium' | 'high'
  event_date?: string
  budget?: number
}

export interface BookingRequest {
  vendor_id: string
  service_date: string
  start_time: string
  end_time: string
  service_type: string
  notes?: string
  guest_count?: number
  budget?: number
}

export interface BookmarkedVendor {
  id: string
  vendor_id: string
  couple_id: string
  created_at: string
  vendor: MarketplaceVendorDisplay
}

export interface SearchSuggestion {
  id: string
  business_name: string
  category: string
  city: string
  state: string
  thumbnail?: string
}

export interface VendorAvailability {
  vendor_id: string
  date: string
  available: boolean
  time_slots: {
    start: string
    end: string
    available: boolean
  }[]
  booking_count: number
  max_bookings: number
}

export interface VendorAnalytics {
  vendor_id: string
  period: {
    start: string
    end: string
  }
  metrics: {
    profile_views: number
    quote_requests: number
    bookings: number
    revenue: number
    average_rating: number
    response_time: number
    conversion_rate: number
  }
  top_services: {
    service: string
    bookings: number
    revenue: number
  }[]
  popular_dates: {
    date: string
    bookings: number
  }[]
}

export type VendorCategory = 
  | 'venue'
  | 'photography'
  | 'videography'
  | 'catering'
  | 'music'
  | 'florist'
  | 'beauty'
  | 'transportation'
  | 'attire'
  | 'decoration'
  | 'lighting'
  | 'entertainment'
  | 'cake'
  | 'officiant'
  | 'planner'
  | 'stationery'
  | 'jewelry'
  | 'other'