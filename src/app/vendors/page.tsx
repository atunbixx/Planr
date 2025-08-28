'use client'

import { useState, useEffect } from 'react'
import { listDirectoryVendors } from '@/lib/api/vendors.public.client'
import type { DirectoryVendorListItem } from '@/contracts/vendors-public'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Star, MapPin, Phone, Mail, Instagram, Heart } from 'lucide-react'

type PublicVendor = DirectoryVendorListItem

const VENDOR_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'venue', label: 'Venues' },
  { value: 'photography', label: 'Photography' },
  { value: 'catering', label: 'Catering' },
  { value: 'flowers', label: 'Flowers & Decor' },
  { value: 'music', label: 'Music & DJ' },
  { value: 'cake', label: 'Cakes & Desserts' },
  { value: 'attire', label: 'Attire & Beauty' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'other', label: 'Other Services' }
]

export default function PublicVendorsPage() {
  const [vendors, setVendors] = useState<PublicVendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<PublicVendor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch vendors from database
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        setError(null)
        const vendorData = await listDirectoryVendors()
        setVendors(vendorData)
        setFilteredVendors(vendorData)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load vendors'
        console.error('Error fetching vendors:', msg)
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  useEffect(() => {
    let filtered = vendors

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => 
        vendor.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(vendor => 
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.region?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort: featured first, then by rating
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return (b.averageRating || 0) - (a.averageRating || 0)
    })

    setFilteredVendors(filtered)
  }, [vendors, searchQuery, selectedCategory])

  const toggleFavorite = (vendorId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(vendorId)) {
        newFavorites.delete(vendorId)
      } else {
        newFavorites.add(vendorId)
      }
      return newFavorites
    })
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      venue: '🏛️',
      photography: '📸',
      catering: '🍽️',
      flowers: '🌸',
      music: '🎵',
      cake: '🎂',
      attire: '👗',
      transportation: '🚗',
      other: '🏢'
    }
    return icons[category] || '🏢'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Wedding Vendor Directory
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover and connect with the best wedding vendors in your area. From venues to photographers, find everything you need for your perfect day.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Vendors
              </label>
              <Input
                placeholder="Search by name, location, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''}
            {selectedCategory !== 'all' && (
              <span> in {VENDOR_CATEGORIES.find(c => c.value === selectedCategory)?.label}</span>
            )}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Loading vendors...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we fetch the latest vendor information.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to load vendors
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Vendor Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(vendor => (
            <Card key={vendor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Vendor Image */}
              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600">
                {vendor.photos ? (
                  <img 
                    src={vendor.photos} 
                    alt={vendor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl">
                      {getCategoryIcon(vendor.category.toLowerCase())}
                    </div>
                  </div>
                )}
                
                {/* Featured Badge */}
                {vendor.featured && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-yellow-500 text-white">
                      Featured
                    </Badge>
                  </div>
                )}
                
                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(vendor.id)}
                  className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      favorites.has(vendor.id) 
                        ? 'text-red-500 fill-current' 
                        : 'text-gray-400'
                    }`} 
                  />
                </button>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {vendor.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {vendor.category}
                    </p>
                  </div>
                  {vendor.priceBand && (
                    <Badge variant="outline">
                      {vendor.priceBand}
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                {vendor.averageRating && (
                  <div className="flex items-center gap-1 mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(vendor.averageRating!)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {vendor.averageRating} ({vendor.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                {vendor.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {vendor.description}
                  </p>
                )}

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {(vendor.city || vendor.region) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {vendor.city}{vendor.region && vendor.city ? `, ${vendor.region}` : vendor.region}
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Phone className="w-4 h-4" />
                      {vendor.phone}
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Instagram className="w-4 h-4" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600">
                        View Instagram
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link href={`/vendors/${vendor.id}`} className="flex-1">
                    <Button className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => vendor.website && window.open(vendor.website, '_blank')}
                  >
                    <Instagram className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No vendors found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Try adjusting your search criteria or browse all categories.
            </p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all') }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
