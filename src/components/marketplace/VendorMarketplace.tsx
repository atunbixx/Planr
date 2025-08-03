'use client'

import { useState, useEffect } from 'react'
import { VendorCard } from './VendorCard'
import { VendorGrid } from './VendorGrid'
import { VendorList } from './VendorList'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { VendorFilters } from '@/types/marketplace'
import { marketplaceApi } from '@/lib/api/marketplace'
import type { MarketplaceVendor } from '@/types/marketplace'

interface VendorMarketplaceProps {
  viewMode: 'grid' | 'list'
  category?: string
  filters?: VendorFilters
}

export function VendorMarketplace({ viewMode, category, filters }: VendorMarketplaceProps) {
  const [vendors, setVendors] = useState<MarketplaceVendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const loadVendors = async (loadMore = false) => {
    try {
      setLoading(true)
      const currentPage = loadMore ? page + 1 : 1
      
      const response = await marketplaceApi.getVendors({
        page: currentPage,
        limit: 12,
        category,
        ...filters,
      })

      if (loadMore) {
        setVendors(prev => [...prev, ...response.data])
        setPage(currentPage)
      } else {
        setVendors(response.data)
        setPage(1)
      }
      
      setTotalCount(response.total)
      setHasMore(response.hasMore)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [category, filters])

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadVendors(true)
    }
  }

  const handleVendorAction = (vendorId: string, action: 'contact' | 'bookmark' | 'request-quote') => {
    // Handle vendor actions
    console.log(`Action ${action} for vendor ${vendorId}`)
  }

  if (loading && vendors.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && vendors.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (vendors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          No vendors found matching your criteria
        </div>
        <Button variant="outline" onClick={() => loadVendors()}>
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {vendors.length} of {totalCount} vendors
        </p>
      </div>

      {viewMode === 'grid' ? (
        <VendorGrid
          vendors={vendors}
          onVendorAction={handleVendorAction}
        />
      ) : (
        <VendorList
          vendors={vendors}
          onVendorAction={handleVendorAction}
        />
      )}

      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
            className="min-w-[200px]"
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}