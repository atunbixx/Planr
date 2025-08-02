import { useEffect, useState, useCallback, useRef } from 'react'
import { ApiResponse, ApiError, QueryOptions, MutationOptions } from '../types'

// Base hook for queries
export function useApiQuery<T>(
  queryFn: () => Promise<ApiResponse<T>>,
  options?: QueryOptions
) {
  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState<ApiError | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  
  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController>()

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!options?.enabled && !isRefetch) return

    try {
      if (isRefetch) {
        setIsValidating(true)
      } else {
        setIsLoading(true)
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      const response = await queryFn()

      if (!isMountedRef.current) return

      if (response.success && response.data) {
        setData(response.data)
        setError(undefined)
        options?.onSuccess?.(response.data)
      } else if (response.error) {
        setError(response.error)
        setData(undefined)
        options?.onError?.(response.error)
      }
    } catch (err: any) {
      if (!isMountedRef.current) return
      
      const apiError: ApiError = {
        code: 'UNKNOWN_ERROR',
        message: err.message || 'An unknown error occurred'
      }
      setError(apiError)
      options?.onError?.(apiError)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
        setIsValidating(false)
      }
    }
  }, [queryFn, options])

  // Initial fetch
  useEffect(() => {
    if (options?.enabled !== false) {
      fetchData()
    }

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData, options?.enabled])

  // Refetch interval
  useEffect(() => {
    if (!options?.refetchInterval || options.refetchInterval === false) return

    const interval = setInterval(() => {
      fetchData(true)
    }, options.refetchInterval)

    return () => clearInterval(interval)
  }, [fetchData, options?.refetchInterval])

  // Window focus refetch
  useEffect(() => {
    if (!options?.refetchOnWindowFocus) return

    const handleFocus = () => fetchData(true)
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchData, options?.refetchOnWindowFocus])

  // Reconnect refetch
  useEffect(() => {
    if (!options?.refetchOnReconnect) return

    const handleOnline = () => fetchData(true)
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [fetchData, options?.refetchOnReconnect])

  const refetch = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  return {
    data,
    error,
    isLoading,
    isValidating,
    refetch
  }
}

// Base hook for mutations
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: MutationOptions<TData, TVariables>
) {
  const [data, setData] = useState<TData | undefined>()
  const [error, setError] = useState<ApiError | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const mutate = useCallback(async (variables: TVariables) => {
    try {
      setIsLoading(true)
      setError(undefined)

      // Call onMutate
      const context = await options?.onMutate?.(variables)

      const response = await mutationFn(variables)

      if (!isMountedRef.current) return

      if (response.success && response.data) {
        setData(response.data)
        options?.onSuccess?.(response.data, variables)
        options?.onSettled?.(response.data, undefined, variables)
      } else if (response.error) {
        setError(response.error)
        options?.onError?.(response.error, variables)
        options?.onSettled?.(undefined, response.error, variables)
      }

      return response
    } catch (err: any) {
      if (!isMountedRef.current) return

      const apiError: ApiError = {
        code: 'UNKNOWN_ERROR',
        message: err.message || 'An unknown error occurred'
      }
      setError(apiError)
      options?.onError?.(apiError, variables)
      options?.onSettled?.(undefined, apiError, variables)
      
      return { success: false, error: apiError }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [mutationFn, options])

  const reset = useCallback(() => {
    setData(undefined)
    setError(undefined)
    setIsLoading(false)
  }, [])

  return {
    mutate,
    mutateAsync: mutate,
    data,
    error,
    isLoading,
    isIdle: !isLoading && !data && !error,
    isSuccess: !!data && !error,
    isError: !!error,
    reset
  }
}

// Optimistic update helper
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (current: T, update: any) => T
) {
  const [optimisticData, setOptimisticData] = useState(initialData)
  const [actualData, setActualData] = useState(initialData)

  const updateOptimistic = useCallback((update: any) => {
    setOptimisticData(current => updateFn(current, update))
  }, [updateFn])

  const revert = useCallback(() => {
    setOptimisticData(actualData)
  }, [actualData])

  const confirm = useCallback((data: T) => {
    setActualData(data)
    setOptimisticData(data)
  }, [])

  return {
    data: optimisticData,
    updateOptimistic,
    revert,
    confirm
  }
}