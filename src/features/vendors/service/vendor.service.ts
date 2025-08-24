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
   */
  async getVendorBySlug(slug: string): Promise<RepositoryResult<PublicVendor | null>> {
    try {
      const vendor = await this.prisma.vendor.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          businessName: true,
          description: true,
          category: true,
          location: true,
          contactEmail: true,
          contactPhone: true,
          website: true,
          socialMedia: true,
          images: true,
          pricing: true,
          availability: true,
          features: true,
          reviews: true,
          rating: true,
          reviewCount: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!vendor) {
        return createSuccessResult(null)
      }

      // Only return active vendors for public access
      if (!vendor.isActive) {
        return createSuccessResult(null)
      }

      // Transform to public vendor format
      const publicVendor: PublicVendor = {
        id: vendor.id,
        slug: vendor.slug,
        businessName: vendor.businessName,
        description: vendor.description,
        category: vendor.category,
        location: vendor.location,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        website: vendor.website,
        socialMedia: vendor.socialMedia as SocialMediaLinks,
        images: vendor.images as VendorImage[],
        pricing: vendor.pricing as PricingInfo,
        availability: vendor.availability as AvailabilityInfo,
        features: vendor.features as string[],
        reviews: vendor.reviews as Review[],
        rating: vendor.rating,
        reviewCount: vendor.reviewCount,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt
      }

      return createSuccessResult(publicVendor)
    } catch (error) {
      console.error('Error getting vendor by slug:', error)
      return createErrorResult(
        'Failed to get vendor',
        'VENDOR_GET_FAILED',
        500
      )
    }
  }

  /**
   * Get popular vendors for static generation
   */
  async getPopularVendors(limit: number = 50): Promise<RepositoryResult<PopularVendor[]>> {
    try {
      const vendors = await this.prisma.vendor.findMany({
        where: {
          isActive: true,
          rating: {
            gte: 4.0
          }
        },
        select: {
          slug: true,
          businessName: true,
          category: true,
          rating: true,
          reviewCount: true,
          updatedAt: true
        },
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: limit
      })

      const popularVendors: PopularVendor[] = vendors.map(vendor => ({
        slug: vendor.slug,
        businessName: vendor.businessName,
        category: vendor.category,
        rating: vendor.rating,
        reviewCount: vendor.reviewCount,
        lastUpdated: vendor.updatedAt
      }))

      return createSuccessResult(popularVendors)
    } catch (error) {
      console.error('Error getting popular vendors:', error)
      return createErrorResult(
        'Failed to get popular vendors',
        'POPULAR_VENDORS_FAILED',
        500
      )
    }
  }

  /**
   * Get vendor categories for navigation
   */
  async getVendorCategories(): Promise<RepositoryResult<VendorCategory[]>> {
    try {
      const categories = await this.prisma.vendor.groupBy({
        by: ['category'],
        where: {
          isActive: true
        },
        _count: {
          category: true
        },
        orderBy: {
          _count: {
            category: 'desc'
          }
        }
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
        isActive: true,
        rating: {
          gte: minRating
        }
      }

      if (category) {
        where.category = {
          contains: category,
          mode: 'insensitive'
        }
      }

      if (location) {
        where.location = {
          contains: location,
          mode: 'insensitive'
        }
      }

      // Get total count
      const total = await this.prisma.vendor.count({ where })

      // Get vendors
      const vendors = await this.prisma.vendor.findMany({
        where,
        select: {
          id: true,
          slug: true,
          businessName: true,
          description: true,
          category: true,
          location: true,
          images: true,
          pricing: true,
          rating: true,
          reviewCount: true
        },
        orderBy: [
          { rating: 'desc' },
          { reviewCount: 'desc' }
        ],
        skip,
        take: limit
      })

      const searchResults: VendorSearchItem[] = vendors.map(vendor => ({
        id: vendor.id,
        slug: vendor.slug,
        businessName: vendor.businessName,
        description: vendor.description,
        category: vendor.category,
        location: vendor.location,
        images: vendor.images as VendorImage[],
        pricing: vendor.pricing as PricingInfo,
        rating: vendor.rating,
        reviewCount: vendor.reviewCount
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
      await this.prisma.vendor.update({
        where: { slug },
        data: {
          viewCount: {
            increment: 1
          }
        }
      })

      return createSuccessResult(true)
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