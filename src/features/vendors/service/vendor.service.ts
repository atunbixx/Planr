import { PrismaClient } from '@prisma/client'
import { RepositoryResult, createErrorResult, createSuccessResult } from '@/lib/repositories/BaseRepository'

/**
 * Vendor service for public and authenticated vendor operations
 */
export class VendorService {
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
  }

  /**
   * Get vendor by slug (public endpoint for SSR)
   * Uses DirectoryVendor as the public directory source. We treat id as the slug.
   */
  async getVendorBySlug(slug: string): Promise<RepositoryResult<PublicVendor | null>> {
    try {
      const v = await this.prisma.directoryVendor.findUnique({
        where: { id: slug },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          region: true,
          priceBand: true,
          averageRating: true,
          reviewCount: true,
          shortDescription: true,
          description: true,
          photos: true,
          website: true,
          email: true,
          phone: true,
          address: true,
          tags: true,
          updatedAt: true,
          createdAt: true,
          isSuspended: true,
        }
      })

      if (!v || v.isSuspended) return createSuccessResult(null)

      const images: VendorImage[] = []
      if (v.photos) {
        try {
          // photos may be a JSON array or a single URL string
          const parsed = JSON.parse(v.photos)
          if (Array.isArray(parsed)) {
            parsed.forEach((url: string, idx: number) => {
              images.push({ id: `${v.id}_img_${idx}`, url, alt: `${v.name} photo ${idx+1}`, isPrimary: idx===0, order: idx })
            })
          }
        } catch {
          images.push({ id: `${v.id}_img_0`, url: v.photos, alt: `${v.name} photo`, isPrimary: true, order: 0 })
        }
      }

      const pricing: PricingInfo = {
        startingPrice: 0,
        currency: 'NGN',
        priceRange: v.priceBand || '',
        packages: []
      }

      const features = (v.tags ? v.tags.split(',').map(s=>s.trim()).filter(Boolean) : [])
      const location = [v.city, v.region].filter(Boolean).join(', ')

      const publicVendor: PublicVendor = {
        id: v.id,
        slug: v.id,
        businessName: v.name,
        description: v.description || v.shortDescription || '',
        category: v.category,
        location,
        contactEmail: v.email || '',
        contactPhone: v.phone || undefined,
        website: v.website || undefined,
        socialMedia: v.website?.includes('instagram.com') ? { instagram: v.website } : { },
        images,
        pricing,
        availability: { isAvailable: true, bookingLeadTime: 30, workingDays: ['Mon','Tue','Wed','Thu','Fri','Sat'], workingHours: { start: '09:00', end: '17:00' } },
        features,
        reviews: [],
        rating: v.averageRating || 0,
        reviewCount: v.reviewCount || 0,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }

      return createSuccessResult(publicVendor)
    } catch (error) {
      console.error('Error getting vendor by slug:', error)
      return createErrorResult('Failed to get vendor', 'VENDOR_GET_FAILED', 500)
    }
  }

  /**
   * Get popular vendors for static generation
   */
  async getPopularVendors(limit: number = 50): Promise<RepositoryResult<PopularVendor[]>> {
    try {
      const vendors = await this.prisma.directoryVendor.findMany({
        where: { isSuspended: false },
        select: {
          id: true,
          name: true,
          category: true,
          averageRating: true,
          reviewCount: true,
          updatedAt: true,
        },
        orderBy: [
          { averageRating: 'desc' },
          { reviewCount: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: limit,
      })

      const popularVendors: PopularVendor[] = vendors.map(v => ({
        slug: v.id,
        businessName: v.name,
        category: v.category,
        rating: v.averageRating || 0,
        reviewCount: v.reviewCount || 0,
        lastUpdated: v.updatedAt,
      }))
      return createSuccessResult(popularVendors)
    } catch (error) {
      console.error('Error getting popular vendors:', error)
      return createErrorResult('Failed to get popular vendors', 'POPULAR_VENDORS_FAILED', 500)
    }
  }

  /**
   * Get vendor categories for navigation
   */
  async getVendorCategories(): Promise<RepositoryResult<VendorCategory[]>> {
    try {
      const categories = await this.prisma.directoryVendor.groupBy({
        by: ['category'],
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      })

      const vendorCategories: VendorCategory[] = categories.map(cat => ({
        name: cat.category,
        count: cat._count.category,
        slug: cat.category.toLowerCase().replace(/\s+/g, '-')
      }))

      return createSuccessResult(vendorCategories)
    } catch (error) {
      console.error('Error getting vendor categories:', error)
      return createErrorResult(
        'Failed to get vendor categories',
        'CATEGORIES_FAILED',
        500
      )
    }
  }

  /**
   * Search vendors by category and location
   */
  async searchVendors(params: VendorSearchParams): Promise<RepositoryResult<VendorSearchResult>> {
    try {
      const {
        category,
        location,
        minRating = 0,
        maxPrice,
        page = 1,
        limit = 20
      } = params

      const skip = (page - 1) * limit

      // Build where clause
      const where: any = {
        isSuspended: false,
        averageRating: { gte: minRating },
      }

      if (category) {
        where.category = { contains: category, mode: 'insensitive' }
      }

      if (location) {
        where.region = { contains: location, mode: 'insensitive' }
      }

      // Get total count
      const total = await this.prisma.directoryVendor.count({ where })

      // Get vendors
      const vendors = await this.prisma.directoryVendor.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          shortDescription: true,
          category: true,
          city: true,
          region: true,
          photos: true,
          priceBand: true,
          averageRating: true,
          reviewCount: true,
        },
        orderBy: [
          { averageRating: 'desc' },
          { reviewCount: 'desc' }
        ],
        skip,
        take: limit
      })

      const searchResults: VendorSearchItem[] = vendors.map(v => ({
        id: v.id,
        slug: v.id,
        businessName: v.name,
        description: v.description || v.shortDescription || '',
        category: v.category,
        location: [v.city, v.region].filter(Boolean).join(', '),
        images: ((): VendorImage[] => {
          const arr: VendorImage[] = []
          if (v.photos) {
            try {
              const parsed = JSON.parse(v.photos)
              if (Array.isArray(parsed)) {
                parsed.forEach((url: string, idx: number) => arr.push({ id: `${v.id}_img_${idx}`, url, alt: `${v.name} photo ${idx+1}`, isPrimary: idx===0, order: idx }))
              }
            } catch { arr.push({ id: `${v.id}_img_0`, url: v.photos!, alt: `${v.name} photo`, isPrimary: true, order: 0 }) }
          }
          return arr
        })(),
        pricing: { startingPrice: 0, currency: 'NGN', priceRange: v.priceBand || '', packages: [] },
        rating: v.averageRating || 0,
        reviewCount: v.reviewCount || 0,
      }))

      const result: VendorSearchResult = {
        vendors: searchResults,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }

      return createSuccessResult(result)
    } catch (error) {
      console.error('Error searching vendors:', error)
      return createErrorResult(
        'Failed to search vendors',
        'VENDOR_SEARCH_FAILED',
        500
      )
    }
  }

  /**
   * Increment vendor view count (for analytics)
   */
  async incrementViewCount(slug: string): Promise<RepositoryResult<boolean>> {
    try {
      // DirectoryVendor model does not track views; noop.
      return createSuccessResult(false)
    } catch (error) {
      console.error('Error incrementing view count:', error)
      // Don't fail the request if view count update fails
      return createSuccessResult(false)
    }
  }

  /**
   * Check if vendor slug exists (for validation)
   */
  async isSlugAvailable(slug: string): Promise<RepositoryResult<boolean>> {
    try {
      const vendor = await this.prisma.vendor.findUnique({
        where: { slug },
        select: { id: true }
      })

      return createSuccessResult(!vendor)
    } catch (error) {
      console.error('Error checking slug availability:', error)
      return createErrorResult(
        'Failed to check slug availability',
        'SLUG_CHECK_FAILED',
        500
      )
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect()
    } catch (error) {
      console.error('Error during vendor service cleanup:', error)
    }
  }
}

// Type definitions
export interface PublicVendor {
  id: string
  slug: string
  businessName: string
  description: string
  category: string
  location: string
  contactEmail: string
  contactPhone?: string
  website?: string
  socialMedia?: SocialMediaLinks
  images: VendorImage[]
  pricing: PricingInfo
  availability: AvailabilityInfo
  features: string[]
  reviews: Review[]
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
}

export interface PopularVendor {
  slug: string
  businessName: string
  category: string
  rating: number
  reviewCount: number
  lastUpdated: Date
}

export interface VendorCategory {
  name: string
  count: number
  slug: string
}

export interface VendorSearchParams {
  category?: string
  location?: string
  minRating?: number
  maxPrice?: number
  page?: number
  limit?: number
}

export interface VendorSearchResult {
  vendors: VendorSearchItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface VendorSearchItem {
  id: string
  slug: string
  businessName: string
  description: string
  category: string
  location: string
  images: VendorImage[]
  pricing: PricingInfo
  rating: number
  reviewCount: number
}

export interface SocialMediaLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
  tiktok?: string
}

export interface VendorImage {
  id: string
  url: string
  alt: string
  caption?: string
  isPrimary: boolean
  order: number
}

export interface PricingInfo {
  startingPrice: number
  currency: string
  priceRange: string
  packages?: PricingPackage[]
}

export interface PricingPackage {
  name: string
  price: number
  description: string
  features: string[]
}

export interface AvailabilityInfo {
  isAvailable: boolean
  nextAvailableDate?: Date
  bookingLeadTime: number
  workingDays: string[]
  workingHours: {
    start: string
    end: string
  }
}

export interface Review {
  id: string
  rating: number
  comment: string
  reviewerName: string
  reviewerInitials: string
  createdAt: Date
  isVerified: boolean
}
