'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// Custom hook for vendor data with server actions
export function useVendors() {
  const [vendors, setVendors] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const refreshVendors = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vendors')
      if (!response.ok) throw new Error('Failed to fetch vendors')
      
      const data = await response.json()
      setVendors(data.vendors || [])
      setCategories(data.categories || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors')
    } finally {
      setLoading(false)
    }
  }, [])

  const createVendor = useCallback(async (vendorData: any) => {
    try {
      const { createVendor } = await import('@/lib/server/actions')
      const result = await createVendor(vendorData)
      
      if (result.success) {
        await refreshVendors()
        router.refresh() // Refresh server components
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create vendor' }
    }
  }, [refreshVendors, router])

  const updateVendor = useCallback(async (id: string, vendorData: any) => {
    try {
      const { updateVendor } = await import('@/lib/server/actions')
      const result = await updateVendor(id, vendorData)
      
      if (result.success) {
        await refreshVendors()
        router.refresh()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to update vendor' }
    }
  }, [refreshVendors, router])

  const deleteVendor = useCallback(async (id: string) => {
    try {
      const { deleteVendor } = await import('@/lib/server/actions')
      const result = await deleteVendor(id)
      
      if (result.success) {
        await refreshVendors()
        router.refresh()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete vendor' }
    }
  }, [refreshVendors, router])

  useEffect(() => {
    refreshVendors()
  }, [refreshVendors])

  return {
    vendors,
    categories,
    loading,
    error,
    refreshVendors,
    createVendor,
    updateVendor,
    deleteVendor
  }
}

// Custom hook for guest data with server actions
export function useGuests() {
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>({})
  const router = useRouter()

  const refreshGuests = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/guests')
      if (!response.ok) throw new Error('Failed to fetch guests')
      
      const data = await response.json()
      setGuests(data.guests || [])
      setStats(data.rsvpStats || {})
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guests')
    } finally {
      setLoading(false)
    }
  }, [])

  const createGuest = useCallback(async (guestData: any) => {
    try {
      const { createGuest } = await import('@/lib/server/actions')
      const result = await createGuest(guestData)
      
      if (result.success) {
        await refreshGuests()
        router.refresh()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create guest' }
    }
  }, [refreshGuests, router])

  const updateGuest = useCallback(async (id: string, guestData: any) => {
    try {
      const { updateGuest } = await import('@/lib/server/actions')
      const result = await updateGuest(id, guestData)
      
      if (result.success) {
        await refreshGuests()
        router.refresh()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to update guest' }
    }
  }, [refreshGuests, router])

  const deleteGuest = useCallback(async (id: string) => {
    try {
      const { deleteGuest } = await import('@/lib/server/actions')
      const result = await deleteGuest(id)
      
      if (result.success) {
        await refreshGuests()
        router.refresh()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete guest' }
    }
  }, [refreshGuests, router])

  useEffect(() => {
    refreshGuests()
  }, [refreshGuests])

  return {
    guests,
    stats,
    loading,
    error,
    refreshGuests,
    createGuest,
    updateGuest,
    deleteGuest
  }
}

// Custom hook for photos data with server actions  
export function usePhotos() {
  const [photos, setPhotos] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>({})
  const router = useRouter()

  const refreshPhotos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/photos')
      if (!response.ok) throw new Error('Failed to fetch photos')
      
      const data = await response.json()
      setPhotos(data.photos || [])
      setAlbums(data.albums || [])
      setStats(data.stats || {})
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch photos')
    } finally {
      setLoading(false)
    }
  }, [])

  const createPhoto = useCallback(async (photoData: any) => {
    try {
      const { createPhoto } = await import('@/lib/server/actions')
      const result = await createPhoto(photoData)
      
      if (result.success) {
        await refreshPhotos()
        router.refresh()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create photo' }
    }
  }, [refreshPhotos, router])

  const createAlbum = useCallback(async (albumData: any) => {
    try {
      const { createAlbum } = await import('@/lib/server/actions')
      const result = await createAlbum(albumData)
      
      if (result.success) {
        await refreshPhotos()
        router.refresh()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create album' }
    }
  }, [refreshPhotos, router])

  useEffect(() => {
    refreshPhotos()
  }, [refreshPhotos])

  return {
    photos,
    albums,
    stats,
    loading,
    error,
    refreshPhotos,
    createPhoto,
    createAlbum
  }
}

// Custom hook for budget data with server actions
export function useBudget() {
  const [categories, setCategories] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>({})
  const router = useRouter()

  const refreshBudget = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/budget')
      if (!response.ok) throw new Error('Failed to fetch budget')
      
      const data = await response.json()
      setCategories(data.categories || [])
      setExpenses(data.recentExpenses || [])
      setSummary(data.summary || {})
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budget')
    } finally {
      setLoading(false)
    }
  }, [])

  const createCategory = useCallback(async (categoryData: any) => {
    try {
      const { createBudgetCategory } = await import('@/lib/server/actions')
      const result = await createBudgetCategory(categoryData)
      
      if (result.success) {
        await refreshBudget()
        router.refresh()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create category' }
    }
  }, [refreshBudget, router])

  const createExpense = useCallback(async (expenseData: any) => {
    try {
      const { createBudgetExpense } = await import('@/lib/server/actions')
      const result = await createBudgetExpense(expenseData)
      
      if (result.success) {
        await refreshBudget()
        router.refresh()
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create expense' }
    }
  }, [refreshBudget, router])

  useEffect(() => {
    refreshBudget()
  }, [refreshBudget])

  return {
    categories,
    expenses,
    summary,
    loading,
    error,
    refreshBudget,
    createCategory,
    createExpense
  }
}

// Custom hook for dashboard stats
export function useDashboardStats() {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      
      const data = await response.json()
      setStats(data.data || {})
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  return {
    stats,
    loading,
    error,
    refreshStats
  }
}