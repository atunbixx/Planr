interface GeocodeResult {
  lat: number
  lng: number
  formattedAddress?: string
}

interface GeocodeOptions {
  provider?: 'google' | 'mapbox' | 'nominatim'
  apiKey?: string
}

/**
 * Simple geocoding service that can use different providers
 * For production, you would configure this with actual API keys
 */
export class GeocodingService {
  private provider: string
  private apiKey?: string

  constructor(options: GeocodeOptions = {}) {
    this.provider = options.provider || 'nominatim' // Free option
    this.apiKey = options.apiKey
  }

  /**
   * Convert an address to coordinates
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    if (!address) return null

    try {
      switch (this.provider) {
        case 'google':
          return await this.geocodeWithGoogle(address)
        case 'mapbox':
          return await this.geocodeWithMapbox(address)
        case 'nominatim':
        default:
          return await this.geocodeWithNominatim(address)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  /**
   * Geocode with Google Maps API
   * Requires API key: process.env.GOOGLE_MAPS_API_KEY
   */
  private async geocodeWithGoogle(address: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not configured')
      return null
    }

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.append('address', address)
    url.searchParams.append('key', this.apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address
      }
    }

    return null
  }

  /**
   * Geocode with Mapbox API
   * Requires API key: process.env.MAPBOX_ACCESS_TOKEN
   */
  private async geocodeWithMapbox(address: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      console.warn('Mapbox access token not configured')
      return null
    }

    const encodedAddress = encodeURIComponent(address)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      return {
        lng: feature.center[0],
        lat: feature.center[1],
        formattedAddress: feature.place_name
      }
    }

    return null
  }

  /**
   * Geocode with Nominatim (OpenStreetMap) - Free option
   * No API key required but has usage limits
   */
  private async geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.append('q', address)
    url.searchParams.append('format', 'json')
    url.searchParams.append('limit', '1')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'WeddingPlannerApp/1.0' // Required by Nominatim
      }
    })

    const data = await response.json()

    if (Array.isArray(data) && data.length > 0) {
      const result = data[0]
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formattedAddress: result.display_name
      }
    }

    return null
  }

  /**
   * Batch geocode multiple addresses
   */
  async geocodeBatch(addresses: string[]): Promise<(GeocodeResult | null)[]> {
    // Add delay between requests to respect rate limits
    const delay = this.provider === 'nominatim' ? 1000 : 100 // 1 second for Nominatim
    const results: (GeocodeResult | null)[] = []

    for (const address of addresses) {
      const result = await this.geocode(address)
      results.push(result)
      
      // Wait before next request
      if (addresses.indexOf(address) < addresses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return results
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in miles
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Get bounding box for a center point and radius (in miles)
   * Returns { minLat, maxLat, minLng, maxLng }
   */
  static getBoundingBox(lat: number, lng: number, radiusMiles: number) {
    const latDelta = radiusMiles / 69.0  // 1 degree latitude ≈ 69 miles
    const lngDelta = radiusMiles / (69.0 * Math.cos(lat * Math.PI / 180))  // Adjust for latitude

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta
    }
  }
}

// Singleton instance with environment configuration
let geocodingService: GeocodingService | null = null

export function getGeocodingService(): GeocodingService {
  if (!geocodingService) {
    const provider = process.env.GEOCODING_PROVIDER as any || 'nominatim'
    const apiKey = process.env.GEOCODING_API_KEY
    
    geocodingService = new GeocodingService({ provider, apiKey })
  }
  
  return geocodingService
}

// Helper function to geocode an address from vendor data
export async function geocodeVendorAddress(vendor: {
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
}): Promise<GeocodeResult | null> {
  const parts = [
    vendor.address,
    vendor.city,
    vendor.state,
    vendor.zip_code,
    vendor.country || 'USA'
  ].filter(Boolean)
  
  if (parts.length === 0) return null
  
  const fullAddress = parts.join(', ')
  const service = getGeocodingService()
  
  return await service.geocode(fullAddress)
}