'use client'

import { useState, useEffect, useCallback } from 'react'
import { BudgetSummary, BudgetItem, BudgetCategory, CreateBudgetItemData, UpdateBudgetItemData } from '../service/budget.service'

interface UseBudgetOptions {
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseBudgetReturn {
  // Data
  summary: BudgetSummary | null
  items: BudgetItem[]
  categories: BudgetCategory[]
  
  // Loading states
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  error: string | null
  
  // Actions
  refreshSummary: () => Promise<void>
  refreshItems: () => Promise<void>
  refreshCategories: () => Promise<void>
  createItem: (data: CreateBudgetItemData) => Promise<BudgetItem | null>
  updateItem: (id: string, data: UpdateBudgetItemData) => Promise<BudgetItem | null>
  deleteItem: (id: string) => Promise<boolean>
  
  // Utilities
  getTotalBudget: () => number
  getTotalSpent: () => number
  getTotalRemaining: () => number
  getCompletionPercentage: () => number
}

export function useBudget(options: UseBudgetOptions = {}): UseBudgetReturn {
  const { autoRefresh = true, refreshInterval = 60000 } = options // 1 minute default
  
  // State
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [items, setItems] = useState<BudgetItem[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)

  // API call helper
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user-123', // TODO: Replace with actual auth
        ...options.headers
      },
      ...options
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'API request failed')
    }

    return result.data
  }

  // Refresh budget summary
  const refreshSummary = useCallback(async () => {
    try {
      setError(null)
      const data = await apiCall('/api/budget/summary')
      setSummary(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load budget summary'
      setError(errorMessage)
      console.error('Error refreshing budget summary:', err)
    }
  }, [])

  // Refresh budget items
  const refreshItems = useCallback(async () => {
    try {
      setError(null)
      const data = await apiCall('/api/budget/items')
      setItems(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load budget items'
      setError(errorMessage)
      console.error('Error refreshing budget items:', err)
    }
  }, [])

  // Refresh budget categories
  const refreshCategories = useCallback(async () => {
    try {
      setError(null)
      const data = await apiCall('/api/budget/categories')
      setCategories(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load budget categories'
      setError(errorMessage)
      console.error('Error refreshing budget categories:', err)
    }
  }, [])

  // Create budget item
  const createItem = useCallback(async (data: CreateBudgetItemData): Promise<BudgetItem | null> => {
    try {
      setIsCreating(true)
      setError(null)
      
      const newItem = await apiCall('/api/budget/items', {
        method: 'POST',
        body: JSON.stringify(data)
      })

      // Optimistically update local state
      setItems(prev => [...prev, newItem])
      
      // Refresh summary to get updated totals
      await refreshSummary()
      await refreshCategories()
      
      return newItem
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create budget item'
      setError(errorMessage)
      console.error('Error creating budget item:', err)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [refreshSummary, refreshCategories])

  // Update budget item
  const updateItem = useCallback(async (id: string, data: UpdateBudgetItemData): Promise<BudgetItem | null> => {
    try {
      setIsUpdating(true)
      setError(null)
      
      const updatedItem = await apiCall(`/api/budget/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })

      // Optimistically update local state
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item))
      
      // Refresh summary to get updated totals
      await refreshSummary()
      await refreshCategories()
      
      return updatedItem
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update budget item'
      setError(errorMessage)
      console.error('Error updating budget item:', err)
      return null
    } finally {
      setIsUpdating(false)
    }
  }, [refreshSummary, refreshCategories])

  // Delete budget item
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true)
      setError(null)
      
      await apiCall(`/api/budget/items/${id}`, {
        method: 'DELETE'
      })

      // Optimistically update local state
      setItems(prev => prev.filter(item => item.id !== id))
      
      // Refresh summary to get updated totals
      await refreshSummary()
      await refreshCategories()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete budget item'
      setError(errorMessage)
      console.error('Error deleting budget item:', err)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [refreshSummary, refreshCategories])

  // Utility functions (with fallbacks for server-side calculations)
  const getTotalBudget = useCallback(() => {
    return summary?.totalBudget || items.reduce((sum, item) => sum + item.budgetedAmount, 0)
  }, [summary, items])

  const getTotalSpent = useCallback(() => {
    return summary?.totalSpent || items.reduce((sum, item) => sum + item.actualAmount, 0)
  }, [summary, items])

  const getTotalRemaining = useCallback(() => {
    return summary?.totalRemaining || (getTotalBudget() - getTotalSpent())
  }, [summary, getTotalBudget, getTotalSpent])

  const getCompletionPercentage = useCallback(() => {
    return summary?.completionPercentage || (getTotalBudget() > 0 ? (getTotalSpent() / getTotalBudget()) * 100 : 0)
  }, [summary, getTotalBudget, getTotalSpent])

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          refreshSummary(),
          refreshItems(),
          refreshCategories()
        ])
      } catch (err) {
        console.error('Error loading initial budget data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [refreshSummary, refreshItems, refreshCategories])

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshSummary()
      refreshCategories()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, refreshSummary, refreshCategories])

  // Persistence check on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh data when page becomes visible (user returns to tab)
        refreshSummary()
        refreshItems()
        refreshCategories()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshSummary, refreshItems, refreshCategories])

  return {
    // Data
    summary,
    items,
    categories,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error state
    error,
    
    // Actions
    refreshSummary,
    refreshItems,
    refreshCategories,
    createItem,
    updateItem,
    deleteItem,
    
    // Utilities
    getTotalBudget,
    getTotalSpent,
    getTotalRemaining,
    getCompletionPercentage
  }
}