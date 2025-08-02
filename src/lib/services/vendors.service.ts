import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface VendorSearchFilters {
  category?: string
  city?: string
  state?: string
  minRating?: number
  maxPrice?: number
  verified?: boolean
}

export interface VendorWithStats {
  id: string
  business_name: string
  category: string
  city: string
  state: string
  average_rating: number
  total_reviews: number
  verified: boolean
  price_range: string
  contact_email: string
  contact_phone: string
  website: string
  description: string
  specialties: string[]
  portfolio_images: string[]
}

export class VendorsService {
  // Get all vendors with search and filtering
  static async searchVendors(filters: VendorSearchFilters = {}) {
    const where: Prisma.vendorsWhereInput = {}

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive'
      }
    }

    if (filters.state) {
      where.state = filters.state
    }

    if (filters.minRating) {
      where.average_rating = {
        gte: filters.minRating
      }
    }

    if (filters.verified !== undefined) {
      where.verified = filters.verified
    }

    const vendors = await prisma.vendors.findMany({
      where,
      orderBy: [
        { verified: 'desc' },
        { average_rating: 'desc' },
        { total_reviews: 'desc' }
      ],
      take: 50
    })

    return vendors
  }

  // Get vendor by ID with full details
  static async getVendorById(id: string) {
    return await prisma.vendors.findUnique({
      where: { id },
      include: {
        couple_vendors: {
          include: {
            couples: {
              select: {
                id: true,
                partner1_name: true,
                partner2_name: true
              }
            }
          }
        },
        budget_expenses: true,
        tasks: {
          where: {
            completed: false
          }
        }
      }
    })
  }

  // Add vendor to couple's vendor list
  static async addVendorToCouple(coupleId: string, vendorId: string, vendorType: string) {
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: {
        business_name: true,
        contact_email: true,
        contact_phone: true
      }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    return await prisma.couple_vendors.create({
      data: {
        couple_id: coupleId,
        vendor_id: vendorId,
        vendor_name: vendor.business_name,
        vendor_type: vendorType,
        contact_email: vendor.contact_email,
        contact_phone: vendor.contact_phone,
        preferred_contact_method: 'email'
      }
    })
  }

  // Get couple's vendors
  static async getCoupleVendors(coupleId: string) {
    return await prisma.couple_vendors.findMany({
      where: { couple_id: coupleId },
      include: {
        vendors: true
      },
      orderBy: { created_at: 'desc' }
    })
  }

  // Update vendor rating
  static async updateVendorRating(vendorId: string, rating: number, reviewCount?: number) {
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: { average_rating: true, total_reviews: true }
    })

    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const currentTotal = vendor.total_reviews || 0
    const currentRating = vendor.average_rating || 0
    
    const newTotal = currentTotal + (reviewCount || 1)
    const newRating = ((currentRating * currentTotal) + rating) / newTotal

    return await prisma.vendors.update({
      where: { id: vendorId },
      data: {
        average_rating: Math.round(newRating * 100) / 100, // Round to 2 decimal places
        total_reviews: newTotal
      }
    })
  }

  // Get vendor categories with counts
  static async getVendorCategories() {
    const categories = await prisma.vendors.groupBy({
      by: ['category'],
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    })

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count.category
    }))
  }

  // Create sample vendors for testing
  static async createSampleVendors() {
    const sampleVendors = [
      {
        business_name: 'Elegant Events Photography',
        contact_name: 'Sarah Johnson',
        contact_email: 'sarah@elegantevents.com',
        category: 'photography',
        description: 'Professional wedding photography with artistic flair',
        city: 'New York',
        state: 'NY',
        verified: true,
        average_rating: 4.8,
        total_reviews: 127,
        price_range: '$2000-$5000',
        specialties: ['Portrait', 'Candid', 'Artistic'],
        website: 'https://elegantevents.com'
      },
      {
        business_name: 'Blooming Flowers Co',
        contact_name: 'Maria Garcia',
        contact_email: 'maria@bloomingflowers.com',
        category: 'florist',
        description: 'Fresh, beautiful wedding florals and arrangements',
        city: 'Los Angeles',
        state: 'CA',
        verified: true,
        average_rating: 4.9,
        total_reviews: 89,
        price_range: '$800-$3000',
        specialties: ['Bridal Bouquets', 'Centerpieces', 'Ceremony Decor']
      },
      {
        business_name: 'Sweet Celebrations Catering',
        contact_name: 'Chef Michael Brown',
        contact_email: 'chef@sweetcelebrations.com',
        category: 'catering',
        description: 'Gourmet catering for unforgettable wedding celebrations',
        city: 'Chicago',
        state: 'IL',
        verified: true,
        average_rating: 4.7,
        total_reviews: 156,
        price_range: '$50-$150 per person',
        specialties: ['Fine Dining', 'Buffet Style', 'Dietary Restrictions']
      }
    ]

    const created = []
    for (const vendor of sampleVendors) {
      const existing = await prisma.vendors.findFirst({
        where: { contact_email: vendor.contact_email }
      })

      if (!existing) {
        const newVendor = await prisma.vendors.create({
          data: vendor
        })
        created.push(newVendor)
      }
    }

    return created
  }
}