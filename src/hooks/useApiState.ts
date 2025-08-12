import { useState, useCallback, useRef, useEffect } from 'react'
import { handleApiError } from '@/lib/api/error-handler'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  isValidating: boolean
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  showErrorToast?: boolean
  retryCount?: number
  dedupingInterval?: number
}

export function useApiState<T>(
  defaultValue: T | null = null,
  options: UseApiOptions = {}
): {
  state: ApiState<T>
  execute: (promise: Promise<any>) => Promise<T>
  setData: (data: T | null) => void
  setError: (error: Error | null) => void
  reset: () => void
} {
  const [state, setState] = useState<ApiState<T>>({
    data: defaultValue,
    loading: false,
    error: null,
    isValidating: false
  })
  
  const lastRequestTime = useRef<number>(0)
  const { 
    onSuccess, 
    onError, 
    showErrorToast = true, 
    dedupingInterval = 2000 
  } = options
  
  const execute = useCallback(async (promise: Promise<any>): Promise<T> => {
    // Deduping: prevent duplicate requests within interval
    const now = Date.now()
    if (dedupingInterval && now - lastRequestTime.current < dedupingInterval) {
      return state.data as T
    }
    lastRequestTime.current = now
    
    setState(prev => ({
      ...prev,
      loading: !prev.data,
      isValidating: !!prev.data,
      error: null
    }))
    
    try {
      const response = await promise
      const data = response.data || response
      
      setState({
        data,
        loading: false,
        error: null,
        isValidating: false
      })
      
      onSuccess?.(data)
      return data
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
        isValidating: false
      }))
      
      if (showErrorToast) {
        handleApiError(error)
      }
      
      onError?.(err)
      throw err
    }
  }, [state.data, onSuccess, onError, showErrorToast, dedupingInterval])
  
  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }))
  }, [])
  
  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])
  
  const reset = useCallback(() => {
    setState({
      data: defaultValue,
      loading: false,
      error: null,
      isValidating: false
    })
  }, [defaultValue])
  
  return {
    state,
    execute,
    setData,
    setError,
    reset
  }
}

// Hook for API calls with automatic retries
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions & { immediate?: boolean } = {}
) {
  const { immediate = true, ...apiOptions } = options
  const { state, execute } = useApiState<T>(null, apiOptions)
  
  useEffect(() => {
    if (immediate) {
      execute(apiCall())
    }
  }, dependencies)
  
  const refetch = useCallback(() => {
    return execute(apiCall())
  }, [execute, apiCall])
  
  return {
    ...state,
    refetch
  }
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>,
  options: UseApiOptions = {}
) {
  const { state, execute, setData, reset } = useApiState<T>(initialData, options)
  
  const update = useCallback(async (optimisticData: T) => {
    const previousData = state.data
    
    // Optimistically update the UI
    setData(optimisticData)
    
    try {
      // Perform the actual update
      const result = await execute(updateFn(optimisticData))
      return result
    } catch (error) {
      // Revert on error
      setData(previousData)
      throw error
    }
  }, [state.data, execute, setData, updateFn])
  
  return {
    ...state,
    update,
    reset
  }
}