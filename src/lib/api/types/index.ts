// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  success: boolean
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  hasMore: boolean
  nextCursor?: string
}

export interface ApiRequestOptions {
  // Request caching
  cache?: RequestCache
  // Request timeout in ms
  timeout?: number
  // Number of retries
  retries?: number
  // Retry delay in ms
  retryDelay?: number
  // Include credentials
  credentials?: RequestCredentials
  // Custom headers
  headers?: Record<string, string>
  // Signal for request cancellation
  signal?: AbortSignal
}

// Query options for data fetching hooks
export interface QueryOptions {
  enabled?: boolean
  refetchInterval?: number | false
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  retry?: number | false
  retryDelay?: number
  staleTime?: number
  cacheTime?: number
  onSuccess?: (data: any) => void
  onError?: (error: ApiError) => void
}

// Mutation options for data mutation hooks
export interface MutationOptions<TData = any, TVariables = any> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: ApiError, variables: TVariables) => void
  onMutate?: (variables: TVariables) => Promise<any> | any
  onSettled?: (data?: TData, error?: ApiError, variables?: TVariables) => void
}

// Standard query parameters
export interface QueryParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, any>
}

// File upload types
export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  maxSize?: number // in bytes
  allowedTypes?: string[]
}