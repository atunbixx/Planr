import { MarketplaceVendor } from '@/types/marketplace'
import { VendorCard } from './VendorCard'

interface VendorGridProps {
  vendors: MarketplaceVendor[]
  onVendorAction: (vendorId: string, action: 'contact' | 'bookmark' | 'request-quote') => void
  bookmarkedVendors?: Set<string>
}

export function VendorGrid({ vendors, onVendorAction, bookmarkedVendors = new Set() }: VendorGridProps) {
  if (vendors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No vendors found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
          onAction={onVendorAction}
          isBookmarked={bookmarkedVendors.has(vendor.id)}
        />
      ))}
    </div>
  )
}