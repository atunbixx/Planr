import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { marketplaceApi } from '@/lib/api/services/marketplace'
import type { MarketplaceVendor } from '@/types/marketplace'

interface MarketplaceSearchProps {
  onSearchResults?: (results: MarketplaceVendor[]) => void
  placeholder?: string
}

export function MarketplaceSearch({ onSearchResults, placeholder = "Search vendors..." }: MarketplaceSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<MarketplaceVendor[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const debouncedQuery = useDebounce(searchQuery, 300)

  const searchVendors = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await marketplaceApi.searchVendors(query, {
        limit: 5,
        verified: true
      })
      setSuggestions(response.data)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Search error:', error)
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedQuery) {
      searchVendors(debouncedQuery)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [debouncedQuery, searchVendors])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (onSearchResults) {
      // For now, we'll let the parent component handle the actual search
      // This could be enhanced to perform real-time search
    }
  }

  const handleSuggestionClick = (vendor: MarketplaceVendor) => {
    setSearchQuery(vendor.business_name)
    setShowSuggestions(false)
    if (onSearchResults) {
      onSearchResults([vendor])
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    if (onSearchResults) {
      onSearchResults([])
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
          <ul className="py-1">
            {suggestions.map((vendor) => (
              <li key={vendor.id}>
                <button
                  onClick={() => handleSuggestionClick(vendor)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                >
                  <img
                    src={vendor.portfolio_images[0] || '/placeholder-vendor.jpg'}
                    alt={vendor.business_name}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <div>
                    <div className="font-medium text-sm">{vendor.business_name}</div>
                    <div className="text-xs text-gray-500">
                      {vendor.category} • {vendor.city}, {vendor.state}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
          <div className="px-4 py-2 text-sm text-gray-500">
            Searching...
          </div>
        </div>
      )}
    </div>
  )
}