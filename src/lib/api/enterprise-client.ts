/**
 * Enterprise API Client - Modern API client using new feature modules and DTOs
 */

import { createClient } from '@/lib/supabase/client'
import { ApiResponse } from '@/shared/validation/middleware'
import { ApiError } from '@/shared/validation/errors'
import { VendorsPaginatedResponse, VendorResponse, VendorSearchRequest } from '@/features/vendors/dto'
import { GuestsPaginatedResponse, GuestResponse, GuestSearchRequest } from '@/features/guests/dto'
import { BudgetSummaryResponse, BudgetCategoryResponse, BudgetExpenseResponse } from '@/features/budget/dto'
import { CoupleResponse, CoupleCreateRequest, CoupleUpdateRequest } from '@/features/couples/dto'

class EnterpriseApiClient {
  private baseUrl = '/api'
  
  private async request<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      // Get Supabase session for authentication
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Debug session state for API calls
      console.log('🔍 Enterprise API request:', {
        url: `${this.baseUrl}${url}`,
        method: options?.method || 'GET',
        sessionExists: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
        sessionError: sessionError?.message
      })
      
      const response = await fetch(`${this.baseUrl}${url}`, {
        ...options,
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
          ...options?.headers
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('🚨 Enterprise API Request Failed:', {
          url: `${this.baseUrl}${url}`,
          method: options?.method || 'GET',
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: Object.fromEntries(response.headers.entries())
        })

        // Handle authentication errors with user-friendly redirects
        if (response.status === 401) {
          // User needs to sign in
          const currentPath = window.location.pathname + window.location.search
          const signInUrl = `/sign-in?next=${encodeURIComponent(currentPath)}&message=${encodeURIComponent('Please sign in to access this feature')}`
          
          console.log('🔄 Redirecting to sign-in due to 401 error')
          window.location.href = signInUrl
          return
        }
        
        if (response.status === 403) {
          // User needs to complete onboarding or lacks permissions
          const redirectTo = errorData.redirectTo || '/onboarding/welcome'
          const message = errorData.error || errorData.message || 'Please complete your wedding setup to access this feature'
          const onboardingUrl = `${redirectTo}?message=${encodeURIComponent(message)}`
          
          console.log('🔄 Redirecting to onboarding due to 403 error')
          window.location.href = onboardingUrl
          return
        }

        throw new ApiError(
          errorData.message || 'Request failed',
          response.status,
          errorData.code,
          errorData.errors
        )
      }
      
      const result: ApiResponse<T> = await response.json()
      
      if (!result.success) {
        throw new ApiError(
          result.error || 'Request failed',
          response.status,
          result.code,
          result.errors
        )
      }
      
      return result.data as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError('Network error', 0, 'network_error')
      }
      
      // Wrap unknown errors
      throw new ApiError('Unknown error', 0, 'unknown_error')
    }
  }
  
  // Couples API
  couples = {
    create: (data: CoupleCreateRequest) =>
      this.request<CoupleResponse>('/couples', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    getMe: () =>
      this.request<CoupleResponse>('/couples/me'),
    
    update: (id: string, data: CoupleUpdateRequest) =>
      this.request<CoupleResponse>(`/couples/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    getStats: () =>
      this.request<any>('/couples/stats')
  }
  
  // Vendors API
  vendors = {
    list: (params?: Partial<VendorSearchRequest>) => {
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value))
          }
        })
      }
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<VendorsPaginatedResponse>(`/vendors${query}`)
    },
    
    create: (data: any) =>
      this.request<VendorResponse>('/vendors', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    get: (id: string) =>
      this.request<VendorResponse>(`/vendors/${id}`),
    
    update: (id: string, data: any) =>
      this.request<VendorResponse>(`/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<void>(`/vendors/${id}`, {
        method: 'DELETE'
      }),
    
    getCategories: () =>
      this.request<any[]>('/vendors/categories'),
    
    getStats: () =>
      this.request<any>('/vendors/stats'),
    
    getCategoryStats: () =>
      this.request<any[]>('/vendors/stats/categories')
  }
  
  // Guests API
  guests = {
    list: (params?: Partial<GuestSearchRequest>) => {
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value))
          }
        })
      }
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<GuestsPaginatedResponse>(`/guests${query}`)
    },
    
    create: (data: any) =>
      this.request<GuestResponse>('/guests', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    get: (id: string) =>
      this.request<GuestResponse>(`/guests/${id}`),
    
    update: (id: string, data: any) =>
      this.request<GuestResponse>(`/guests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    delete: (id: string) =>
      this.request<void>(`/guests/${id}`, {
        method: 'DELETE'
      }),
    
    updateRsvp: (id: string, data: any) =>
      this.request<GuestResponse>(`/guests/${id}/rsvp`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    bulkUpdate: (data: { guestIds: string[], updates: any }) =>
      this.request<{ count: number }>('/guests/bulk', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    
    getStats: () =>
      this.request<any>('/guests/stats')
  }
  
  // Budget API
  budget = {
    getSummary: () =>
      this.request<BudgetSummaryResponse>('/budget/summary'),
    
    getAnalytics: () =>
      this.request<any>('/budget/analytics'),
    
    reallocate: (data: { allocations: Array<{ categoryId: string, amount: number }> }) =>
      this.request<BudgetCategoryResponse[]>('/budget/reallocate', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    
    categories: {
      list: () =>
        this.request<BudgetCategoryResponse[]>('/budget/categories'),
      
      create: (data: any) =>
        this.request<BudgetCategoryResponse>('/budget/categories', {
          method: 'POST',
          body: JSON.stringify(data)
        }),
      
      update: (id: string, data: any) =>
        this.request<BudgetCategoryResponse>(`/budget/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        }),
      
      delete: (id: string) =>
        this.request<void>(`/budget/categories/${id}`, {
          method: 'DELETE'
        })
    },
    
    expenses: {
      list: (params?: { categoryId?: string }) => {
        const queryParams = new URLSearchParams()
        if (params?.categoryId) queryParams.append('categoryId', params.categoryId)
        
        const query = queryParams.toString() ? `?${queryParams}` : ''
        return this.request<BudgetExpenseResponse[]>(`/budget/expenses${query}`)
      },
      
      create: (data: any) =>
        this.request<BudgetExpenseResponse>('/budget/expenses', {
          method: 'POST',
          body: JSON.stringify(data)
        }),
      
      update: (id: string, data: any) =>
        this.request<BudgetExpenseResponse>(`/budget/expenses/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        }),
      
      delete: (id: string) =>
        this.request<void>(`/budget/expenses/${id}`, {
          method: 'DELETE'
        })
    }
  }
  
  // Dashboard API
  dashboard = {
    getStats: () =>
      this.request<any>('/dashboard/stats'),
    
    getActivity: (limit?: number) => {
      const queryParams = new URLSearchParams()
      if (limit) queryParams.append('limit', limit.toString())
      
      const query = queryParams.toString() ? `?${queryParams}` : ''
      return this.request<any[]>(`/dashboard/activity${query}`)
    }
  }
  
  // Settings API
  settings = {
    wedding: {
      get: () =>
        this.request<any>('/settings/wedding'),
      
      update: (data: any) =>
        this.request<any>('/settings/wedding', {
          method: 'PUT',
          body: JSON.stringify(data)
        })
    },
    
    preferences: {
      get: () =>
        this.request<any>('/settings/preferences'),
      
      update: (data: any) =>
        this.request<any>('/settings/preferences', {
          method: 'PUT',
          body: JSON.stringify(data)
        })
    }
  }
}

// Export the client instance
export const enterpriseApi = new EnterpriseApiClient()

// Export types for easier import
export type { VendorResponse, VendorSearchRequest } from '@/features/vendors/dto'
export type { GuestResponse, GuestSearchRequest } from '@/features/guests/dto'
export type { BudgetSummaryResponse, BudgetCategoryResponse, BudgetExpenseResponse } from '@/features/budget/dto'
export type { CoupleResponse, CoupleCreateRequest, CoupleUpdateRequest } from '@/features/couples/dto'