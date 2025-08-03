import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { VendorCategory } from '@/types/database'

interface MarketplaceFiltersProps {
  onFiltersChange?: (filters: any) => void
}

export function MarketplaceFilters({ onFiltersChange }: MarketplaceFiltersProps) {
  const [filters, setFilters] = useState({
    category: 'all',
    minRating: 0,
    maxPrice: 50000,
    verified: false,
    featured: false,
    location: ''
  })

  const categories: { value: string; label: string }[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'venue', label: 'Venue' },
    { value: 'catering', label: 'Catering' },
    { value: 'photography', label: 'Photography' },
    { value: 'videography', label: 'Videography' },
    { value: 'florist', label: 'Florist' },
    { value: 'music_dj', label: 'Music/DJ' },
    { value: 'band', label: 'Band' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'beauty', label: 'Beauty' },
    { value: 'attire', label: 'Attire' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'invitations', label: 'Invitations' },
    { value: 'decoration', label: 'Decoration' },
    { value: 'lighting', label: 'Lighting' },
    { value: 'rentals', label: 'Rentals' },
    { value: 'officiant', label: 'Officiant' },
    { value: 'planner', label: 'Planner' },
    { value: 'cake', label: 'Cake' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'security', label: 'Security' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'other', label: 'Other' }
  ]

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      category: 'all',
      minRating: 0,
      maxPrice: 50000,
      verified: false,
      featured: false,
      location: ''
    }
    setFilters(clearedFilters)
    onFiltersChange?.(clearedFilters)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category */}
        <div>
          <Label className="mb-2 block">Category</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div>
          <Label className="mb-2 block">Location</Label>
          <Select
            value={filters.location}
            onValueChange={(value) => handleFilterChange('location', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              <SelectItem value="new-york">New York</SelectItem>
              <SelectItem value="los-angeles">Los Angeles</SelectItem>
              <SelectItem value="chicago">Chicago</SelectItem>
              <SelectItem value="houston">Houston</SelectItem>
              <SelectItem value="miami">Miami</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating */}
        <div>
          <Label className="mb-2 block">
            Minimum Rating: {filters.minRating}★
          </Label>
          <Slider
            value={[filters.minRating]}
            onValueChange={([value]) => handleFilterChange('minRating', value)}
            max={5}
            min={0}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* Price Range */}
        <div>
          <Label className="mb-2 block">
            Max Price: ${filters.maxPrice.toLocaleString()}
          </Label>
          <Slider
            value={[filters.maxPrice]}
            onValueChange={([value]) => handleFilterChange('maxPrice', value)}
            max={100000}
            min={1000}
            step={1000}
            className="w-full"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={filters.verified}
              onCheckedChange={(checked) => handleFilterChange('verified', checked)}
            />
            <Label htmlFor="verified" className="text-sm">
              Verified vendors only
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={filters.featured}
              onCheckedChange={(checked) => handleFilterChange('featured', checked)}
            />
            <Label htmlFor="featured" className="text-sm">
              Featured vendors only
            </Label>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  )
}