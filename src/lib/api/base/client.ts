import { createBrowserClient } from '@/lib/supabase-client'
import { ApiRequestOptions, ApiResponse, ApiError } from '../types'
import { createApiError, ErrorCodes, parseSupabaseError, shouldRetry, getRetryDelay } from '../utils/errors'
import { apiLogger } from '../utils/logger'

export class ApiClient {
  private supabase = createBrowserClient()
  private defaultOptions: ApiRequestOptions = {
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    credentials: 'same-origin',
  }

  constructor(private baseUrl: string = '/api') {}

  // Generic request method
  async request<T>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultOptions.timeout,
      retries = this.defaultOptions.retries,
      retryDelay = this.defaultOptions.retryDelay,
      ...fetchOptions
    } = options

    const url = `${this.baseUrl}${endpoint}`
    const startTime = Date.now()
    let lastError: ApiError | null = null

    // Retry loop
    for (let attempt = 0; attempt <= retries!; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout!)

        // Get current session for auth header
        const { data: { session } } = await this.supabase.auth.getSession()
        
        // Merge headers
        const headers = new Headers(fetchOptions.headers)
        if (session?.access_token) {
          headers.set('Authorization', `Bearer ${session.access_token}`)
        }
        if (!headers.has('Content-Type') && fetchOptions.body) {
          headers.set('Content-Type', 'application/json')
        }

        // Make request
        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: options.signal || controller.signal,
        })

        clearTimeout(timeoutId)

        // Parse response
        const responseData = await this.parseResponse<T>(response)
        
        // Log request
        apiLogger.log({
          method: fetchOptions.method || 'GET',
          url,
          status: response.status,
          duration: Date.now() - startTime,
          requestBody: fetchOptions.body ? JSON.parse(fetchOptions.body as string) : undefined,
          responseBody: responseData,
          userId: session?.user?.id,
        })

        // Handle non-2xx responses
        if (!response.ok) {
          lastError = this.handleErrorResponse(response, responseData)
          
          if (shouldRetry(lastError, attempt, retries!)) {
            await this.delay(getRetryDelay(attempt, retryDelay))
            continue
          }
          
          return { success: false, error: lastError }
        }

        return { success: true, data: responseData }

      } catch (error: any) {
        // Handle network/timeout errors
        if (error.name === 'AbortError') {
          lastError = createApiError(ErrorCodes.TIMEOUT, 'Request timed out', 408)
        } else if (!navigator.onLine) {
          lastError = createApiError(ErrorCodes.OFFLINE, 'No internet connection', 0)
        } else {
          lastError = createApiError(ErrorCodes.NETWORK_ERROR, error.message || 'Network error', 0)
        }

        apiLogger.log({
          method: fetchOptions.method || 'GET',
          url,
          duration: Date.now() - startTime,
          error: lastError,
        })

        if (shouldRetry(lastError, attempt, retries!)) {
          await this.delay(getRetryDelay(attempt, retryDelay))
          continue
        }

        return { success: false, error: lastError }
      }
    }

    return { success: false, error: lastError! }
  }

  // HTTP method shortcuts
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // File upload
  async upload<T>(
    endpoint: string,
    formData: FormData,
    options?: ApiRequestOptions & {
      onProgress?: (progress: { loaded: number; total: number }) => void
    }
  ): Promise<ApiResponse<T>> {
    // Note: For progress tracking, we'd need to use XMLHttpRequest
    // For now, using fetch without progress
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        ...options?.headers,
        // Don't set Content-Type for FormData
      },
    })
  }

  // Helper methods
  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      return response.json()
    }
    
    // Handle empty responses
    const text = await response.text()
    if (!text) {
      return {} as T
    }
    
    // Try to parse as JSON anyway
    try {
      return JSON.parse(text)
    } catch {
      return text as unknown as T
    }
  }

  private handleErrorResponse(response: Response, data: any): ApiError {
    // Check if the response has our standard error format
    if (data?.error && typeof data.error === 'object') {
      return data.error
    }
    
    if (data?.error && typeof data.error === 'string') {
      return createApiError(ErrorCodes.INTERNAL_ERROR, data.error, response.status)
    }
    
    // Map status codes to errors
    switch (response.status) {
      case 401:
        return createApiError(ErrorCodes.UNAUTHORIZED, 'Unauthorized', 401)
      case 403:
        return createApiError(ErrorCodes.FORBIDDEN, 'Forbidden', 403)
      case 404:
        return createApiError(ErrorCodes.NOT_FOUND, 'Not found', 404)
      case 429:
        return createApiError(ErrorCodes.RATE_LIMITED, 'Too many requests', 429)
      default:
        return createApiError(
          ErrorCodes.INTERNAL_ERROR,
          data?.message || response.statusText || 'An error occurred',
          response.status
        )
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Default client instance
export const apiClient = new ApiClient()