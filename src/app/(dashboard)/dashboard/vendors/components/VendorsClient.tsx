'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AddVendorDialog from './AddVendorDialog'
import VendorList from './VendorList'
import { enterpriseApi, type VendorResponse } from '@/lib/api/enterprise-client'

interface VendorStats {
  totalVendors: number
  byStatus: Record<string, number>
  totalEstimatedCost: number
  contractedVendors: number
  pendingDeadlines: number
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export default function VendorsClient() {
  const { user, isSignedIn, isLoading } = useSupabaseAuth()
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [stats, setStats] = useState<VendorStats>({
    totalVendors: 0,
    byStatus: {},
    totalEstimatedCost: 0,
    contractedVendors: 0,
    pendingDeadlines: 0
  })
  const [categories] = useState<Category[]>([
    { id: 'venue', name: 'Venue', icon: '🏛️', color: '#8B5CF6' },
    { id: 'catering', name: 'Catering', icon: '🍽️', color: '#F59E0B' },
    { id: 'photography', name: 'Photography', icon: '📸', color: '#EF4444' },
    { id: 'videography', name: 'Videography', icon: '🎥', color: '#3B82F6' },
    { id: 'music', name: 'Music/DJ', icon: '🎵', color: '#10B981' },
    { id: 'flowers', name: 'Flowers', icon: '💐', color: '#F97316' },
    { id: 'transportation', name: 'Transportation', icon: '🚗', color: '#6366F1' },
    { id: 'cake', name: 'Wedding Cake', icon: '🎂', color: '#EC4899' },
    { id: 'beauty', name: 'Hair & Makeup', icon: '💄', color: '#8B5CF6' },
    { id: 'officiant', name: 'Officiant', icon: '👨‍💼', color: '#059669' },
    { id: 'decorations', name: 'Decorations', icon: '🎀', color: '#DC2626' },
    { id: 'other', name: 'Other', icon: '📝', color: '#6B7280' }
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVendors = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch vendors and stats in parallel
      const [vendorsResponse, statsResponse] = await Promise.all([
        enterpriseApi.vendors.list(),
        enterpriseApi.vendors.getStats()
      ])
      
      setVendors(vendorsResponse.data)
      setStats(statsResponse)
      
    } catch (err) {
      console.error('Error fetching vendors:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      fetchVendors()
    }
  }, [isLoading, isSignedIn])

  if (loading) {
    return (
      <div className="px-8 py-12">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200/50 rounded-sm mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200/50 rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 data-testid="vendors-page-title" className="text-5xl font-light tracking-wide text-gray-900 mb-2 uppercase">Vendors</h1>
        <p className="text-lg font-light text-gray-600">Manage your wedding vendors and track contracts</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p data-testid="total-vendors" className="text-3xl font-light text-gray-900">{stats?.totalVendors || 0}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Total Vendors</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-[#7a9b7f]">{stats?.contractedVendors || 0}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Contracted</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-amber-600">{stats?.pendingDeadlines || 0}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Pending</p>
          <p className="text-xs font-light text-gray-500 mt-1">Deadlines</p>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm text-center">
          <p className="text-3xl font-light text-gray-900">${(stats?.totalEstimatedCost || 0).toLocaleString()}</p>
          <p className="text-xs font-medium tracking-[0.2em] text-gray-500 uppercase mt-2">Estimated Cost</p>
          <p className="text-xs font-light text-gray-500 mt-1">Total budget</p>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 rounded-sm text-sm">
          {error}
        </div>
      )}

      {/* Vendors List */}
      <div className="bg-white rounded-sm shadow-sm">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Your Vendors</h2>
              <p className="text-sm font-light text-gray-600 mt-1">Track vendors, manage contracts, and stay organized</p>
            </div>
            <AddVendorDialog categories={categories} onVendorAdded={fetchVendors}>
              <Button data-testid="add-vendor-button" className="bg-[#7a9b7f] hover:bg-[#6a8b6f] text-white rounded-sm px-4 py-2 text-sm font-light tracking-wider uppercase">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </AddVendorDialog>
          </div>
        </div>
        
        <div className="p-8">
          {vendors.length === 0 ? (
            <div data-testid="empty-vendors" className="text-center py-12 text-gray-500 font-light">
              No vendors added yet. Start by adding your first vendor.
            </div>
          ) : (
            <VendorList data-testid="vendor-list" vendors={vendors} categories={categories} />
          )}
        </div>
      </div>
    </div>
  )
}