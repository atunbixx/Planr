'use client'

import { useState, useEffect } from 'react'
import { VendorMarketplace } from '@/components/marketplace/VendorMarketplace'
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters'
import { MarketplaceSearch } from '@/components/marketplace/MarketplaceSearch'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Search, Filter, Grid, List } from 'lucide-react'

export default function MarketplacePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vendor Marketplace
        </h1>
        <p className="text-gray-600">
          Discover and connect with trusted wedding vendors in your area
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <MarketplaceFilters />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search and View Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1">
                  <MarketplaceSearch />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Marketplace */}
          <Tabs defaultValue="featured" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="nearby">Nearby</TabsTrigger>
              <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
            </TabsList>
            
            <TabsContent value="featured">
              <VendorMarketplace viewMode={viewMode} category="featured" />
            </TabsContent>
            
            <TabsContent value="recommended">
              <VendorMarketplace viewMode={viewMode} category="recommended" />
            </TabsContent>
            
            <TabsContent value="nearby">
              <VendorMarketplace viewMode={viewMode} category="nearby" />
            </TabsContent>
            
            <TabsContent value="top-rated">
              <VendorMarketplace viewMode={viewMode} category="top-rated" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}