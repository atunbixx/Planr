import { ApiResponse } from '@/lib/api/base-handler'
import { ApiError, handleApiError, retryOperation } from '@/lib/api/error-handler'
import { apiCache, cacheConfig, invalidateRelatedCache } from '@/lib/api/cache'
import { createClient } from '@/lib/supabase/client'

export interface Guest {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  rsvpStatus: string
  dietaryRestrictions?: string
  plusOneAllowed: boolean
  plusOneName?: string
  tableNumber?: number
  createdAt: string
  updatedAt: string
}

export interface Vendor {
  id: string
  businessName: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  category: string
  status: string
  estimatedCost?: number
  actualCost?: number
  contractSigned: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface VendorStats {
  total: number
  potential: number
  contacted: number
  quoted: number
  booked: number
  completed: number
}

export interface VendorCosts {
  estimated: number
  actual: number
}

export interface VendorsResponse {
  vendors: Vendor[]
  categories: any[]
  stats: VendorStats
  costs: VendorCosts
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface BudgetCategory {
  id: string
  name: string
  icon?: string
  color?: string
  allocatedAmount: number
  spentAmount: number
  createdAt: string
  updatedAt: string
}

export interface BudgetExpense {
  id: string
  categoryId: string
  vendorId?: string
  description: string
  amount: number
  expenseType: string
  paymentStatus: string
  dueDate?: string
  paidDate?: string
  createdAt: string
  updatedAt: string
}

export interface BudgetSummary {
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  categories: (BudgetCategory & { spent: number })[]
}

export interface TimelineEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime?: string
  duration?: number
  location?: string
  category: string
  vendorIds: string[]
  status: string
  priority: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ChecklistItem {
  id: string
  title: string
  description?: string
  category: string
  priority: string
  dueDate?: string
  assignedTo?: string
  notes?: string
  completed: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ChecklistResponse {
  items: ChecklistItem[]
  stats: {
    total: number
    completed: number
    pending: number
    completionPercentage: number
    byCategory: Record<string, { total: number; completed: number }>
  }
}

export interface Photo {
  id: string
  albumId: string
  url: string
  thumbnailUrl?: string
  caption?: string
  tags: string[]
  metadata?: {
    width?: number
    height?: number
    size?: number
    mimeType?: string
  }
  takenAt?: string
  uploadedBy?: string
  isFavorite: boolean
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

export interface Album {
  id: string
  name: string
  description?: string
  coverPhotoId?: string
  isPrivate: boolean
  shareToken?: string
  tags: string[]
  photoCount: number
  createdAt: string
  updatedAt: string
}

export interface PhotosResponse {
  photos: (Photo & { album?: { id: string; name: string } })[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AlbumWithPhotos extends Album {
  photos: Photo[]
  coverPhoto?: {
    id: string
    url: string
    thumbnailUrl?: string
  }
}

export interface Message {
  id: string
  recipientId: string
  subject: string
  content: string
  type: string
  status: string
  scheduledFor?: string
  sentAt?: string
  templateId?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface MessageTemplate {
  id: string
  name: string
  subject: string
  content: string
  type: string
  category: string
  variables: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MessageLog {
  id: string
  messageId: string
  status: string
  error?: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface MessagesResponse {
  messages: (Message & {
    recipient?: {
      id: string
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
    }
    template?: {
      id: string
      name: string
    }
  })[]
  stats: {
    total: number
    byStatus: Record<string, number>
    byType: Record<string, number>
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UserPreferences {
  language: string
  timezone: string
  currency: string
  dateFormat: string
  timeFormat: string
  firstDayOfWeek: number
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  reminderSettings?: {
    enabled: boolean
    daysBefore: number
    timeOfDay: string
  }
  privacy?: {
    showRsvpPublicly: boolean
    allowGuestUploads: boolean
    requirePhotoApproval: boolean
  }
}

export interface WeddingDetails {
  partnerOneName?: string
  partnerTwoName?: string
  weddingDate?: string
  venue?: {
    name: string
    address: string
    city: string
    state: string
    country: string
    postalCode?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  ceremonyTime?: string
  receptionTime?: string
  guestCount?: number
  budget?: number
  theme?: string
  primaryColor?: string
  secondaryColor?: string
  website?: string
  hashtag?: string
  story?: string
}

export interface Collaborator {
  id: string
  userId: string
  email?: string
  name?: string
  imageUrl?: string
  role: string
  permissions: string[]
  invitedAt: string
  acceptedAt?: string
}

export interface DashboardStats {
  wedding: {
    date?: string
    daysUntil?: number | null
    venue?: any
    guestCount: number
  }
  guests: {
    total: number
    confirmed: number
    declined: number
    pending: number
    notInvited: number
  }
  budget: {
    totalBudget: number
    totalAllocated: number
    totalSpent: number
    remaining: number
    percentageSpent: number
    categoryCount: number
    expenseCount: number
  }
  vendors: {
    total: number
    booked: number
    contacted: number
    pending: number
    totalEstimatedCost: number
    totalActualCost: number
  }
  checklist: {
    total: number
    completed: number
    pending: number
    completionPercentage: number
    dueSoon: number
  }
  photos: {
    totalPhotos: number
    totalAlbums: number
    favoriteCount: number
  }
  messages: {
    total: number
    sent: number
    scheduled: number
    draft: number
    failed: number
  }
}

export interface ActivityItem {
  id: string
  type: 'guest' | 'expense' | 'message' | 'photo'
  title: string
  description: string
  timestamp: Date
  icon: string
  data: any
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}


class ApiClient {
  private baseUrl = '/api'
  
  private async request<T>(
    url: string,
    options?: RequestInit,
    context?: { operation?: string; resource?: string; useCache?: boolean }
  ): Promise<ApiResponse<T>> {
    try {
      const method = options?.method || 'GET'
      const isReadOperation = method === 'GET'
      const shouldUseCache = context?.useCache !== false && isReadOperation
      
      // Check cache for GET requests
      if (shouldUseCache) {
        const cachedData = apiCache.get<ApiResponse<T>>(url, options?.body)
        if (cachedData) {
          console.log('[Cache Hit]', url)
          return cachedData
        }
      }
      
      // Add timeout to requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      // Get Supabase session for authentication
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
          ...options?.headers
        }
      })
      
      clearTimeout(timeoutId)
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new ApiError(
          response.status,
          data.error || 'Request failed',
          data.code,
          data.errors
        )
      }
      
      // Cache successful GET requests
      if (shouldUseCache && data.success) {
        // Extract base URL for cache config lookup
        const baseUrl = url.split('?')[0]
        const config = cacheConfig[baseUrl]
        if (config) {
          apiCache.set(url, data, options?.body, config.ttl)
          console.log('[Cache Set]', url, `TTL: ${config.ttl}ms`)
        }
      }
      
      // Invalidate related cache on mutations
      if (!isReadOperation) {
        invalidateRelatedCache(url)
      }
      
      return data
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(0, 'Network error', 'network_error')
      }
      
      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(0, 'Request timeout', 'timeout')
      }
      
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error
      }
      
      // Wrap unknown errors
      throw new ApiError(0, 'Unknown error', 'unknown_error', error)
    }
  }
  
  guests = {
    list: async (params?: { page?: number; limit?: number; rsvpStatus?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.rsvpStatus) queryParams.append('rsvpStatus', params.rsvpStatus)
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<PaginatedResponse<Guest>>(`/guests${query}`, undefined, {
        operation: 'list',
        resource: 'guests',
        useCache: true
      })
    },
    
    create: (data: Partial<Guest>) =>
      this.request<Guest>('/guests', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<Guest>) =>
      this.request<Guest>(`/guests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/guests/${id}`, {
        method: 'DELETE'
      }),
    
    updateRsvp: (id: string, data: {
      status: string
      dietaryRestrictions?: string
      plusOneName?: string
    }) =>
      this.request<Guest>(`/guests/${id}/rsvp`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  }
  
  vendors = {
    list: async (params?: { page?: number; limit?: number; category?: string; status?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.category) queryParams.append('category', params.category)
      if (params?.status) queryParams.append('status', params.status)
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<VendorsResponse>(`/vendors${query}`, undefined, {
        operation: 'list',
        resource: 'vendors',
        useCache: true
      })
    },
    
    create: (data: Partial<Vendor>) =>
      this.request<Vendor>('/vendors', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<Vendor>) =>
      this.request<Vendor>(`/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/vendors/${id}`, {
        method: 'DELETE'
      })
  }
  
  budget = {
    summary: () => this.request<BudgetSummary>('/budget/summary', undefined, {
      operation: 'summary',
      resource: 'budget',
      useCache: true
    }),
    
    categories: {
      list: () => this.request<BudgetCategory[]>('/budget/categories', undefined, {
        operation: 'list',
        resource: 'budget-categories',
        useCache: true
      }),
      
      create: (data: Partial<BudgetCategory>) =>
        this.request<BudgetCategory>('/budget/categories', {
          method: 'POST',
          body: JSON.stringify(data)
        }),
      
      update: (id: string, data: Partial<BudgetCategory>) =>
        this.request<BudgetCategory>(`/budget/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        }),
      
      delete: (id: string) =>
        this.request<{ success: boolean }>(`/budget/categories/${id}`, {
          method: 'DELETE'
        })
    },
    
    expenses: {
      list: (params?: { categoryId?: string }) => {
        const queryParams = new URLSearchParams()
        if (params?.categoryId) queryParams.append('categoryId', params.categoryId)
        
        const query = queryParams.toString() ? `?${queryParams}` : ''
        return this.request<BudgetExpense[]>(`/budget/expenses${query}`)
      },
      
      create: (data: Partial<BudgetExpense>) =>
        this.request<BudgetExpense>('/budget/expenses', {
          method: 'POST',
          body: JSON.stringify(data)
        }),
      
      update: (id: string, data: Partial<BudgetExpense>) =>
        this.request<BudgetExpense>(`/budget/expenses/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        }),
      
      delete: (id: string) =>
        this.request<{ success: boolean }>(`/budget/expenses/${id}`, {
          method: 'DELETE'
        })
    }
  }
  
  timeline = {
    list: async (params?: { date?: string; vendorId?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.date) queryParams.append('date', params.date)
      if (params?.vendorId) queryParams.append('vendorId', params.vendorId)
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<TimelineEvent[]>(`/timeline${query}`)
    },
    
    create: (data: Partial<TimelineEvent>) =>
      this.request<TimelineEvent>('/timeline', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<TimelineEvent>) =>
      this.request<TimelineEvent>(`/timeline/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/timeline/${id}`, {
        method: 'DELETE'
      }),
    
    share: (date: string) =>
      this.request<{ shareUrl: string; shareToken: string; expiresAt: string }>('/timeline/share', {
        method: 'POST',
        body: JSON.stringify({ date })
      })
  }
  
  checklist = {
    list: async (params?: { category?: string; completed?: boolean; priority?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.category) queryParams.append('category', params.category)
      if (params?.completed !== undefined) queryParams.append('completed', params.completed.toString())
      if (params?.priority) queryParams.append('priority', params.priority)
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<ChecklistResponse>(`/checklist${query}`)
    },
    
    create: (data: Partial<ChecklistItem>) =>
      this.request<ChecklistItem>('/checklist', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<ChecklistItem>) =>
      this.request<ChecklistItem>(`/checklist/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    toggleComplete: (id: string) =>
      this.request<ChecklistItem>(`/checklist/${id}`, {
        method: 'PATCH'
      }),
    
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/checklist/${id}`, {
        method: 'DELETE'
      }),
    
    bulkComplete: (itemIds: string[]) =>
      this.request<{ success: boolean; count: number }>('/checklist/bulk-complete', {
        method: 'POST',
        body: JSON.stringify({ itemIds })
      })
  }
  
  photos = {
    list: async (params?: { albumId?: string; tags?: string[]; isFavorite?: boolean; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams()
      if (params?.albumId) queryParams.append('albumId', params.albumId)
      if (params?.tags?.length) queryParams.append('tags', params.tags.join(','))
      if (params?.isFavorite !== undefined) queryParams.append('isFavorite', params.isFavorite.toString())
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<PhotosResponse>(`/photos${query}`, undefined, {
        operation: 'list',
        resource: 'photos',
        useCache: true
      })
    },
    
    create: (data: Partial<Photo>) =>
      this.request<Photo>('/photos', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<Photo>) =>
      this.request<Photo>(`/photos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/photos/${id}`, {
        method: 'DELETE'
      }),
    
    bulkToggleFavorite: (photoIds: string[], isFavorite: boolean) =>
      this.request<{ success: boolean; count: number }>('/photos/bulk', {
        method: 'POST',
        body: JSON.stringify({ photoIds, isFavorite })
      })
  }
  
  albums = {
    list: () => this.request<(Album & { coverPhoto?: { id: string; url: string; thumbnailUrl?: string } })[]>('/albums', undefined, {
      operation: 'list',
      resource: 'albums',
      useCache: true
    }),
    
    get: (id: string) => this.request<AlbumWithPhotos>(`/albums/${id}`),
    
    create: (data: Partial<Album>) =>
      this.request<Album>('/albums', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<Album>) =>
      this.request<Album>(`/albums/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/albums/${id}`, {
        method: 'DELETE'
      })
  }
  
  messages = {
    list: async (params?: { status?: string; type?: string; recipientId?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams()
      if (params?.status) queryParams.append('status', params.status)
      if (params?.type) queryParams.append('type', params.type)
      if (params?.recipientId) queryParams.append('recipientId', params.recipientId)
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<MessagesResponse>(`/messages${query}`)
    },
    
    create: (data: Partial<Message>) =>
      this.request<Message>('/messages', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    update: (id: string, data: Partial<Message>) =>
      this.request<Message>(`/messages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<{ success: boolean }>(`/messages/${id}`, {
        method: 'DELETE'
      }),
    
    send: (data: {
      recipientIds: string[]
      subject: string
      content: string
      type?: string
      templateId?: string
      variables?: Record<string, string>
      scheduledFor?: string
    }) =>
      this.request<{ success: boolean; count: number; messages: Message[] }>('/messages/send', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    templates: {
      list: () => this.request<MessageTemplate[]>('/messages/templates', undefined, {
        operation: 'list',
        resource: 'message-templates',
        useCache: true
      }),
      
      create: (data: Partial<MessageTemplate>) =>
        this.request<MessageTemplate>('/messages/templates', {
          method: 'POST',
          body: JSON.stringify(data)
        }),
      
      update: (id: string, data: Partial<MessageTemplate>) =>
        this.request<MessageTemplate>(`/messages/templates/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        }),
      
      delete: (id: string) =>
        this.request<{ success: boolean }>(`/messages/templates/${id}`, {
          method: 'DELETE'
        })
    },
    
    logs: async (params?: { messageId?: string; startDate?: string; endDate?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.messageId) queryParams.append('messageId', params.messageId)
      if (params?.startDate) queryParams.append('startDate', params.startDate)
      if (params?.endDate) queryParams.append('endDate', params.endDate)
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<(MessageLog & { message?: { id: string; subject: string; type: string } })[]>(`/messages/logs${query}`)
    }
  }
  
  settings = {
    preferences: {
      get: () => this.request<UserPreferences>('/settings/preferences', undefined, {
        operation: 'get',
        resource: 'preferences',
        useCache: true
      }),
      
      update: (data: Partial<UserPreferences>) =>
        this.request<UserPreferences>('/settings/preferences', {
          method: 'PUT',
          body: JSON.stringify(data)
        })
    },
    
    wedding: {
      get: () => this.request<WeddingDetails>('/settings/wedding', undefined, {
        operation: 'get',
        resource: 'wedding-details',
        useCache: true
      }),
      
      update: (data: Partial<WeddingDetails>) =>
        this.request<WeddingDetails>('/settings/wedding', {
          method: 'PUT',
          body: JSON.stringify(data)
        })
    },
    
    collaborators: {
      list: () => this.request<Collaborator[]>('/settings/collaborators'),
      
      invite: (data: { email: string; role?: string; permissions?: string[] }) =>
        this.request<{ success: boolean; invitation?: any; collaborator?: any }>('/settings/collaborators', {
          method: 'POST',
          body: JSON.stringify(data)
        }),
      
      update: (id: string, data: { role?: string; permissions?: string[] }) =>
        this.request<Collaborator>(`/settings/collaborators/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        }),
      
      remove: (id: string) =>
        this.request<{ success: boolean }>(`/settings/collaborators/${id}`, {
          method: 'DELETE'
        })
    }
  }
  
  dashboard = {
    stats: () => this.request<DashboardStats>('/dashboard/stats', undefined, {
      operation: 'stats',
      resource: 'dashboard',
      useCache: true
    }),
    
    activity: (limit?: number) => {
      const queryParams = new URLSearchParams()
      if (limit) queryParams.append('limit', limit.toString())
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<ActivityItem[]>(`/dashboard/activity${query}`)
    }
  }
}

export const api = new ApiClient()