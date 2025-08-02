import { useState, useCallback, useMemo } from 'react'
import { useApiQuery, useApiMutation, useOptimisticUpdate } from './base'
import { vendorsApi, VendorWithDetails, VendorFilters } from '../services/vendors'
import { VendorInsert, VendorUpdate, VendorStatus } from '@/types/database'
import { QueryOptions, MutationOptions } from '../types'

// Get vendors with filters
export function useVendors(filters?: VendorFilters, options?: QueryOptions) {
  return useApiQuery(
    () => vendorsApi.getVendors(filters),
    {
      refetchOnWindowFocus: true,
      ...options
    }
  )
}

// Get single vendor
export function useVendor(id: string, options?: QueryOptions) {
  return useApiQuery(
    () => vendorsApi.getVendor(id),
    {
      enabled: !!id,
      ...options
    }
  )
}

// Create vendor
export function useCreateVendor(
  options?: MutationOptions<VendorWithDetails, VendorInsert>
) {
  return useApiMutation(
    (data) => vendorsApi.createVendor(data),
    options
  )
}

// Update vendor
export function useUpdateVendor(
  options?: MutationOptions<VendorWithDetails, { id: string; data: VendorUpdate }>
) {
  return useApiMutation(
    ({ id, data }) => vendorsApi.updateVendor(id, data),
    options
  )
}

// Delete vendor
export function useDeleteVendor(
  options?: MutationOptions<{ success: boolean }, string>
) {
  return useApiMutation(
    (id) => vendorsApi.deleteVendor(id),
    options
  )
}

// Update vendor status
export function useUpdateVendorStatus(
  options?: MutationOptions<VendorWithDetails, { 
    id: string; 
    status: VendorStatus; 
    notes?: string 
  }>
) {
  return useApiMutation(
    ({ id, status, notes }) => vendorsApi.updateStatus(id, status, notes),
    options
  )
}

// Book vendor
export function useBookVendor(
  options?: MutationOptions<VendorWithDetails, { 
    id: string; 
    details: Parameters<typeof vendorsApi.bookVendor>[1] 
  }>
) {
  return useApiMutation(
    ({ id, details }) => vendorsApi.bookVendor(id, details),
    options
  )
}

// Compare vendors
export function useCompareVendors(
  vendorIds: string[],
  options?: QueryOptions
) {
  return useApiQuery(
    () => vendorsApi.compareVendors(vendorIds),
    {
      enabled: vendorIds.length >= 2,
      ...options
    }
  )
}

// Get vendor recommendations
export function useVendorRecommendations(
  category: string,
  preferences?: Parameters<typeof vendorsApi.getRecommendations>[1],
  options?: QueryOptions
) {
  return useApiQuery(
    () => vendorsApi.getRecommendations(category as any, preferences),
    {
      enabled: !!category,
      ...options
    }
  )
}

// Search vendors
export function useSearchVendors(
  query: string,
  searchOptions?: Parameters<typeof vendorsApi.searchVendors>[1],
  options?: QueryOptions
) {
  return useApiQuery(
    () => vendorsApi.searchVendors(query, searchOptions),
    {
      enabled: query.length >= 2,
      ...options
    }
  )
}

// Vendor analytics
export function useVendorAnalytics(options?: QueryOptions) {
  return useApiQuery(
    () => vendorsApi.getAnalytics(),
    {
      refetchInterval: 60000, // Refetch every minute
      ...options
    }
  )
}

// Composite hook for vendor management
export function useVendorManagement() {
  const [filters, setFilters] = useState<VendorFilters>({})
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  
  const { data, error, isLoading, refetch } = useVendors(filters)
  
  const createVendor = useCreateVendor({
    onSuccess: () => {
      refetch()
    }
  })
  
  const updateVendor = useUpdateVendor({
    onSuccess: () => {
      refetch()
    }
  })
  
  const deleteVendor = useDeleteVendor({
    onSuccess: () => {
      refetch()
    }
  })
  
  const updateStatus = useUpdateVendorStatus({
    onSuccess: () => {
      refetch()
    }
  })
  
  const bookVendor = useBookVendor({
    onSuccess: () => {
      refetch()
    }
  })

  // Filter helpers
  const updateFilters = useCallback((newFilters: Partial<VendorFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])
  
  // Selection helpers
  const toggleVendorSelection = useCallback((vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }, [])
  
  const selectAllVendors = useCallback(() => {
    if (data?.data) {
      setSelectedVendors(data.data.map(v => v.id))
    }
  }, [data])
  
  const clearSelection = useCallback(() => {
    setSelectedVendors([])
  }, [])

  // Computed values
  const vendors = useMemo(() => data?.data || [], [data])
  const totalCount = useMemo(() => data?.count || 0, [data])
  const hasMore = useMemo(() => data?.hasMore || false, [data])
  
  const selectedVendorDetails = useMemo(() => 
    vendors.filter(v => selectedVendors.includes(v.id)),
    [vendors, selectedVendors]
  )

  return {
    // Data
    vendors,
    totalCount,
    hasMore,
    error,
    isLoading,
    
    // Filters
    filters,
    updateFilters,
    clearFilters,
    
    // Selection
    selectedVendors,
    selectedVendorDetails,
    toggleVendorSelection,
    selectAllVendors,
    clearSelection,
    
    // Actions
    createVendor: createVendor.mutate,
    updateVendor: updateVendor.mutate,
    deleteVendor: deleteVendor.mutate,
    updateStatus: updateStatus.mutate,
    bookVendor: bookVendor.mutate,
    refetch,
    
    // Loading states
    isCreating: createVendor.isLoading,
    isUpdating: updateVendor.isLoading,
    isDeleting: deleteVendor.isLoading
  }
}

// Hook for vendor comparison
export function useVendorComparison() {
  const [vendorIds, setVendorIds] = useState<string[]>([])
  
  const { data, error, isLoading } = useCompareVendors(vendorIds)
  
  const addVendor = useCallback((vendorId: string) => {
    setVendorIds(prev => 
      prev.includes(vendorId) ? prev : [...prev, vendorId]
    )
  }, [])
  
  const removeVendor = useCallback((vendorId: string) => {
    setVendorIds(prev => prev.filter(id => id !== vendorId))
  }, [])
  
  const clearComparison = useCallback(() => {
    setVendorIds([])
  }, [])
  
  return {
    vendorIds,
    comparison: data,
    error,
    isLoading,
    canCompare: vendorIds.length >= 2,
    addVendor,
    removeVendor,
    clearComparison
  }
}