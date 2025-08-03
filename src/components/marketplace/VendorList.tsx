import { MarketplaceVendor } from '@/types/marketplace'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MapPin, Phone, Mail, Bookmark, Heart } from 'lucide-react'
import { cn } from '@/utils/cn'

interface VendorListProps {
  vendors: MarketplaceVendor[]
  onVendorAction: (vendorId: string, action: 'contact' | 'bookmark' | 'request-quote') => void
  bookmarkedVendors?: Set<string>
}

export function VendorList({ vendors, onVendorAction, bookmarkedVendors = new Set() }: VendorListProps) {
  if (vendors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No vendors found</p>
      </div>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      venue: 'bg-purple-100 text-purple-800',
      catering: 'bg-orange-100 text-orange-800',
      photography: 'bg-blue-100 text-blue-800',
      videography: 'bg-indigo-100 text-indigo-800',
      florist: 'bg-pink-100 text-pink-800',
      music_dj: 'bg-green-100 text-green-800',
      beauty: 'bg-red-100 text-red-800',
      transportation: 'bg-yellow-100 text-yellow-800',
      attire: 'bg-teal-100 text-teal-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-4">
      {vendors.map((vendor) => (
        <div key={vendor.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            {/* Image */}
            <div className="w-32 h-32 flex-shrink-0">
              <img
                src={vendor.portfolio_images[0] || '/placeholder-vendor.jpg'}
                alt={vendor.business_name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vendor.business_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn('text-xs', getCategoryColor(vendor.category))}>
                      {vendor.category}
                    </Badge>
                    {vendor.featured && (
                      <Badge className="bg-yellow-500 text-white text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {vendor.verified && (
                      <Badge className="bg-green-500 text-white text-xs">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVendorAction(vendor.id, 'bookmark')}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Heart
                    className={cn(
                      'h-4 w-4',
                      bookmarkedVendors.has(vendor.id) ? 'fill-red-500 text-red-500' : ''
                    )}
                  />
                </Button>
              </div>

              <div className="flex items-center mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.floor(vendor.average_rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                  <span className="ml-1 text-sm text-gray-600">
                    {vendor.average_rating.toFixed(1)} ({vendor.total_reviews} reviews)
                  </span>
                </div>
                <span className="mx-2 text-gray-400">•</span>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {vendor.city}, {vendor.state}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {vendor.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {vendor.specialties.slice(0, 4).map((specialty) => (
                  <Badge key={specialty} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {vendor.specialties.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{vendor.specialties.length - 4} more
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900">
                  {vendor.price_range}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onVendorAction(vendor.id, 'contact')}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Contact
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onVendorAction(vendor.id, 'request-quote')}
                  >
                    Get Quote
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}