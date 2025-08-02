import { useState, useCallback, useMemo } from 'react'
import { useApiQuery, useApiMutation } from './base'
import { budgetApi, BudgetOverview, BudgetCategoryDetail, BudgetItemDetail, BudgetFilters } from '../services/budget'
import { BudgetCategoryInsert, BudgetCategoryUpdate, BudgetItemInsert, BudgetItemUpdate } from '@/types/database'
import { QueryOptions, MutationOptions } from '../types'

// Get budget overview
export function useBudgetOverview(options?: QueryOptions) {
  return useApiQuery(
    () => budgetApi.getOverview(),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      ...options
    }
  )
}

// Get budget analytics
export function useBudgetAnalytics(options?: QueryOptions) {
  return useApiQuery(
    () => budgetApi.getAnalytics(),
    {
      refetchInterval: 60000, // Refetch every minute
      ...options
    }
  )
}

// Categories hooks
export function useBudgetCategories(options?: QueryOptions) {
  return useApiQuery(
    () => budgetApi.getCategories(),
    options
  )
}

export function useBudgetCategory(id: string, options?: QueryOptions) {
  return useApiQuery(
    () => budgetApi.getCategory(id),
    {
      enabled: !!id,
      ...options
    }
  )
}

export function useCreateBudgetCategory(
  options?: MutationOptions<BudgetCategoryDetail, BudgetCategoryInsert>
) {
  return useApiMutation(
    (data) => budgetApi.createCategory(data),
    options
  )
}

export function useUpdateBudgetCategory(
  options?: MutationOptions<BudgetCategoryDetail, { id: string; data: BudgetCategoryUpdate }>
) {
  return useApiMutation(
    ({ id, data }) => budgetApi.updateCategory(id, data),
    options
  )
}

export function useDeleteBudgetCategory(
  options?: MutationOptions<{ success: boolean }, string>
) {
  return useApiMutation(
    (id) => budgetApi.deleteCategory(id),
    options
  )
}

// Items hooks
export function useBudgetItems(filters?: BudgetFilters, options?: QueryOptions) {
  return useApiQuery(
    () => budgetApi.getItems(filters),
    options
  )
}

export function useBudgetItem(id: string, options?: QueryOptions) {
  return useApiQuery(
    () => budgetApi.getItem(id),
    {
      enabled: !!id,
      ...options
    }
  )
}

export function useCreateBudgetItem(
  options?: MutationOptions<BudgetItemDetail, BudgetItemInsert>
) {
  return useApiMutation(
    (data) => budgetApi.createItem(data),
    options
  )
}

export function useUpdateBudgetItem(
  options?: MutationOptions<BudgetItemDetail, { id: string; data: BudgetItemUpdate }>
) {
  return useApiMutation(
    ({ id, data }) => budgetApi.updateItem(id, data),
    options
  )
}

export function useDeleteBudgetItem(
  options?: MutationOptions<{ success: boolean }, string>
) {
  return useApiMutation(
    (id) => budgetApi.deleteItem(id),
    options
  )
}

// Bulk operations
export function useBulkCreateItems(
  options?: MutationOptions<BudgetItemDetail[], BudgetItemInsert[]>
) {
  return useApiMutation(
    (items) => budgetApi.bulkCreateItems(items),
    options
  )
}

export function useBulkUpdateItems(
  options?: MutationOptions<BudgetItemDetail[], { id: string; data: BudgetItemUpdate }[]>
) {
  return useApiMutation(
    (updates) => budgetApi.bulkUpdateItems(updates),
    options
  )
}

// Payment tracking
export function useRecordPayment(
  options?: MutationOptions<{ id: string }, {
    itemId: string;
    payment: Parameters<typeof budgetApi.recordPayment>[1];
  }>
) {
  return useApiMutation(
    ({ itemId, payment }) => budgetApi.recordPayment(itemId, payment),
    options
  )
}

// Templates
export function useBudgetTemplates(
  type?: Parameters<typeof budgetApi.getTemplates>[0],
  options?: QueryOptions
) {
  return useApiQuery(
    () => budgetApi.getTemplates(type),
    options
  )
}

export function useApplyBudgetTemplate(
  options?: MutationOptions<
    { success: boolean; categories_created: number },
    { templateId: string; totalBudget: number }
  >
) {
  return useApiMutation(
    ({ templateId, totalBudget }) => budgetApi.applyTemplate(templateId, totalBudget),
    options
  )
}

// Export
export function useExportBudget(
  format: Parameters<typeof budgetApi.exportBudget>[0],
  options?: QueryOptions
) {
  return useApiQuery(
    () => budgetApi.exportBudget(format),
    {
      enabled: false, // Only fetch when explicitly called
      ...options
    }
  )
}

// Recommendations
export function useBudgetRecommendations(options?: QueryOptions) {
  return useApiQuery(
    () => budgetApi.getRecommendations(),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      ...options
    }
  )
}

// Composite hook for budget management
export function useBudgetManagement() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [itemFilters, setItemFilters] = useState<BudgetFilters>({})
  
  const overview = useBudgetOverview()
  const analytics = useBudgetAnalytics()
  const categories = useBudgetCategories()
  const items = useBudgetItems(itemFilters)
  const recommendations = useBudgetRecommendations()
  
  const createCategory = useCreateBudgetCategory({
    onSuccess: () => {
      overview.refetch()
      categories.refetch()
      analytics.refetch()
    }
  })
  
  const updateCategory = useUpdateBudgetCategory({
    onSuccess: () => {
      overview.refetch()
      categories.refetch()
      analytics.refetch()
    }
  })
  
  const deleteCategory = useDeleteBudgetCategory({
    onSuccess: () => {
      overview.refetch()
      categories.refetch()
      analytics.refetch()
      setActiveCategory(null)
    }
  })
  
  const createItem = useCreateBudgetItem({
    onSuccess: () => {
      overview.refetch()
      items.refetch()
      analytics.refetch()
    }
  })
  
  const updateItem = useUpdateBudgetItem({
    onSuccess: () => {
      overview.refetch()
      items.refetch()
      analytics.refetch()
    }
  })
  
  const deleteItem = useDeleteBudgetItem({
    onSuccess: () => {
      overview.refetch()
      items.refetch()
      analytics.refetch()
    }
  })
  
  const recordPayment = useRecordPayment({
    onSuccess: () => {
      overview.refetch()
      items.refetch()
      analytics.refetch()
    }
  })

  // Computed values
  const totalBudget = useMemo(() => overview.data?.total_budget || 0, [overview.data])
  const totalSpent = useMemo(() => overview.data?.total_spent || 0, [overview.data])
  const totalRemaining = useMemo(() => overview.data?.total_remaining || 0, [overview.data])
  const budgetUtilization = useMemo(() => 
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    [totalBudget, totalSpent]
  )
  
  const categoriesList = useMemo(() => categories.data || [], [categories.data])
  const itemsList = useMemo(() => items.data?.data || [], [items.data])
  
  const activeCategoryData = useMemo(() => 
    categoriesList.find(c => c.id === activeCategory),
    [categoriesList, activeCategory]
  )
  
  const alerts = useMemo(() => analytics.data?.alerts || [], [analytics.data])
  const hasOverspend = useMemo(() => 
    alerts.some(a => a.type === 'overspend' && a.severity === 'error'),
    [alerts]
  )

  // Filter helpers
  const updateItemFilters = useCallback((newFilters: Partial<BudgetFilters>) => {
    setItemFilters(prev => ({ ...prev, ...newFilters }))
  }, [])
  
  const clearItemFilters = useCallback(() => {
    setItemFilters({})
  }, [])

  return {
    // Overview data
    overview: overview.data,
    totalBudget,
    totalSpent,
    totalRemaining,
    budgetUtilization,
    
    // Categories
    categories: categoriesList,
    activeCategory,
    activeCategoryData,
    setActiveCategory,
    
    // Items
    items: itemsList,
    itemFilters,
    updateItemFilters,
    clearItemFilters,
    
    // Analytics
    analytics: analytics.data,
    alerts,
    hasOverspend,
    
    // Recommendations
    recommendations: recommendations.data?.recommendations || [],
    
    // Actions
    createCategory: createCategory.mutate,
    updateCategory: updateCategory.mutate,
    deleteCategory: deleteCategory.mutate,
    createItem: createItem.mutate,
    updateItem: updateItem.mutate,
    deleteItem: deleteItem.mutate,
    recordPayment: recordPayment.mutate,
    
    // Refetch functions
    refetchOverview: overview.refetch,
    refetchCategories: categories.refetch,
    refetchItems: items.refetch,
    refetchAnalytics: analytics.refetch,
    
    // Loading states
    isLoading: overview.isLoading || categories.isLoading,
    isCreating: createCategory.isLoading || createItem.isLoading,
    isUpdating: updateCategory.isLoading || updateItem.isLoading,
    isDeleting: deleteCategory.isLoading || deleteItem.isLoading,
    
    // Error states
    error: overview.error || categories.error || items.error
  }
}