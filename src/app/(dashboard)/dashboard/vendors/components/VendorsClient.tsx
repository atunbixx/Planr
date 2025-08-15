'use client'

import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '@/lib/auth/client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import AddVendorDialog from './AddVendorDialog'
import VendorList from './VendorList'
import { enterpriseApi, type VendorResponse } from '@/lib/api/enterprise-client'
import { 
  WeddingPageLayout, 
  WeddingPageHeader,
  WeddingStatCard,
  WeddingCard,
  WeddingButton,
  WeddingContentSection
} from '@/components/wedding-theme'

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
      
      // Handle both array and paginated responses
      const vendorArray = Array.isArray(vendorsResponse) 
        ? vendorsResponse 
        : (vendorsResponse?.data || [])
      
      // Transform vendor summary response to full vendor response format
      const fullVendors = vendorArray.map((vendor: any) => ({
        ...vendor,
        specialties: vendor.specialties || [],
        tags: vendor.tags || [],
        coupleId: vendor.coupleId || '', // Will be filled by backend
        createdAt: vendor.createdAt || new Date().toISOString(),
        updatedAt: vendor.updatedAt || new Date().toISOString(),
        businessName: vendor.businessName || vendor.name,
        source: vendor.source || 'manual'
      }))
      
      setVendors(fullVendors)
      setStats(statsResponse || {
        totalVendors: 0,
        byStatus: {},
        totalEstimatedCost: 0,
        contractedVendors: 0,
        pendingDeadlines: 0
      })
      
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
      <WeddingPageLayout>
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
      </WeddingPageLayout>
    )
  }

  return (
    <WeddingPageLayout>
      {/* Header */}
      <WeddingPageHeader
        title="Vendors"
        subtitle="Manage your wedding vendors and track contracts"
        data-testid="vendors-page-title"
      />

      {/* Summary Statistics */}
      <WeddingContentSection>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          <WeddingStatCard
            value={stats?.totalVendors || 0}
            label="Total Vendors"
            data-testid="total-vendors"
          />
          <WeddingStatCard
            value={stats?.contractedVendors || 0}
            label="Contracted"
            valueColor="sage"
          />
          <WeddingStatCard
            value={stats?.pendingDeadlines || 0}
            label="Pending"
            sublabel="Deadlines"
            valueColor="amber"
          />
          <WeddingStatCard
            value={`$${(stats?.totalEstimatedCost || 0).toLocaleString()}`}
            label="Estimated Cost"
            sublabel="Total budget"
          />
        </div>
      </WeddingContentSection>

      {error && (
        <WeddingContentSection>
          <WeddingCard className="bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
          </WeddingCard>
        </WeddingContentSection>
      )}

      {/* Vendors List */}
      <WeddingCard>
        <div className="border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-light tracking-wide text-gray-900 uppercase">Your Vendors</h2>
              <p className="text-sm font-light text-gray-600 mt-1">Track vendors, manage contracts, and stay organized</p>
            </div>
            <AddVendorDialog categories={categories} onVendorAdded={fetchVendors}>
              <WeddingButton data-testid="add-vendor-button" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </WeddingButton>
            </AddVendorDialog>
          </div>
        </div>
        
        <div>
          {vendors.length === 0 ? (
            <div data-testid="empty-vendors" className="text-center py-12 text-gray-500 font-light">
              No vendors added yet. Start by adding your first vendor.
            </div>
          ) : (
            <VendorList data-testid="vendor-list" vendors={vendors} categories={categories} />
          )}
        </div>
      </WeddingCard>
    </WeddingPageLayout>
  )
}