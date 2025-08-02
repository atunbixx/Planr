import { useState, useEffect } from 'react'
import { VendorSearchFilters, VendorWithStats } from '@/lib/services/vendors.service'

interface UseVendorsResult {
  vendors: VendorWithStats[]
  loading: boolean
  error: string | null
  searchVendors: (filters: VendorSearchFilters) => Promise<void>
  createSampleVendors: () => Promise<void>
}

export function useVendors(): UseVendorsResult {
  const [vendors, setVendors] = useState<VendorWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchVendors = async (filters: VendorSearchFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.city) params.append('city', filters.city)
      if (filters.state) params.append('state', filters.state)
      if (filters.minRating) params.append('minRating', filters.minRating.toString())
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters.verified !== undefined) params.append('verified', filters.verified.toString())

      const response = await fetch(`/api/vendors?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search vendors')
      }

      setVendors(data.data.vendors)
    } catch (err: any) {
      setError(err.message)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const createSampleVendors = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create sample vendors')
      }

      // Refresh the vendors list
      await searchVendors()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load vendors on mount
  useEffect(() => {
    searchVendors()
  }, [])

  return {
    vendors,
    loading,
    error,
    searchVendors,
    createSampleVendors
  }
}