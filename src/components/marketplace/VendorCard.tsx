import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MapPin, Phone, Mail, Bookmark, Heart } from 'lucide-react'
import { MarketplaceVendor } from '@/types/marketplace'
import { cn } from '@/utils/cn'

interface VendorCardProps {
  vendor: MarketplaceVendor
  onAction: (vendorId: string, action: 'contact' | 'bookmark' | 'request-quote') => void
  isBookmarked?: boolean
}

export function VendorCard({ vendor, onAction, isBookmarked = false }: VendorCardProps) {
  const [isBookmarking, setIsBookmarking] = useState(false)

  const handleBookmark = async () => {
    setIsBookmarking(true)
    try {
      await onAction(vendor.id, 'bookmark')
    } finally {
      setIsBookmarking(false)
    }
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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <div className="aspect-video relative overflow-hidden rounded-t-lg">
          <img
            src={vendor.portfolio_images[0] || '/placeholder-vendor.jpg'}
            alt={vendor.business_name}
            className="object-cover w-full h-full"
          />
          {vendor.featured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {vendor.verified && (
            <Badge className="absolute top-2 right-2 bg-green-500 text-white">
              Verified
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 bg-white/90 hover:bg-white"
          onClick={handleBookmark}
          disabled={isBookmarking}
        >
          <Heart
            className={cn(
              'h-4 w-4',
              isBookmarked ? 'fill-red-500 text-red-500' : 'text-gray-400'
            )}
          />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {vendor.business_name}
            </h3>
            <Badge className={cn('text-xs', getCategoryColor(vendor.category))}>
              {vendor.category}
            </Badge>
          </div>
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
              {vendor.average_rating.toFixed(1)} ({vendor.total_reviews})
            </span>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {vendor.city}, {vendor.state}
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {vendor.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-3">
          {vendor.specialties.slice(0, 3).map((specialty) => (
            <Badge key={specialty} variant="outline" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {vendor.specialties.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{vendor.specialties.length - 3} more
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
              onClick={() => onAction(vendor.id, 'contact')}
            >
              <Phone className="h-4 w-4 mr-1" />
              Contact
            </Button>
            <Button
              size="sm"
              onClick={() => onAction(vendor.id, 'request-quote')}
            >
              Get Quote
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}