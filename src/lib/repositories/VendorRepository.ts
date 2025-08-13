/**
 * VendorRepository - Single source of truth for vendor data access
 * Provides consistent vendor operations across all handlers
 */

import { prisma } from '@/lib/prisma'

export interface VendorData {
  id: string
  businessName: string
  contactName: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  categoryId: string | null
  status: string
  priority: string
  rating: number | null
  estimatedCost: number | null
  actualCost: number | null
  contractSigned: boolean
  notes: string | null
  createdAt: Date | null
  updatedAt: Date | null
  category?: VendorCategoryData | null
}

export interface VendorCategoryData {
  id: string
  name: string
  icon: string
  color: string
  description: string | null
}

export interface VendorStats {
  total: number
  potential: number
  contacted: number
  quoted: number
  booked: number
  completed: number
  totalEstimatedCost: number
  totalActualCost: number
}

export interface VendorCosts {
  estimated: number
  actual: number
}

export interface VendorsResponse {
  vendors: VendorData[]
  categories: VendorCategoryData[]
  stats: VendorStats
  costs: VendorCosts
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface CreateVendorData {
  businessName: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  categoryId?: string
  status?: string
  priority?: string
  rating?: number
  estimatedCost?: number
  actualCost?: number
  contractSigned?: boolean
  notes?: string
}

export interface UpdateVendorData {
  businessName?: string
  contactName?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  categoryId?: string
  status?: string
  priority?: string
  rating?: number
  estimatedCost?: number
  actualCost?: number
  contractSigned?: boolean
  notes?: string
}

export interface VendorFilters {
  status?: string
  categoryId?: string
  priority?: string
  contractSigned?: boolean
  search?: string
}

export interface PaginationOptions {
  page?: number
  pageSize?: number
}

export class VendorRepository {
  /**
   * Get all vendors for a couple with pagination and filtering
   */
  async getVendors(
    coupleId: string, 
    filters: VendorFilters = {}, 
    pagination: PaginationOptions = {}
  ): Promise<VendorsResponse> {
    try {
      const page = pagination.page || 1
      const pageSize = pagination.pageSize || 50
      const skip = (page - 1) * pageSize

      // Build where clause
      const where: any = { coupleId }
      
      if (filters.status) where.status = filters.status
      if (filters.categoryId) where.categoryId = filters.categoryId
      if (filters.priority) where.priority = filters.priority
      if (filters.contractSigned !== undefined) where.contractSigned = filters.contractSigned
      if (filters.search) {
        where.OR = [
          { businessName: { contains: filters.search, mode: 'insensitive' } },
          { contactName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      }

      // Get vendors with pagination
      const [vendors, total, categories, stats] = await Promise.all([
        prisma.vendor.findMany({
          where,
          include: {
            vendorCategory: true
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: pageSize
        }),
        prisma.vendor.count({ where }),
        this.getCategories(coupleId),
        this.getStats(coupleId)
      ])

      const transformedVendors = vendors.map(vendor => this.transformVendor(vendor))
      const costs = this.calculateCosts(vendors)

      return {
        vendors: transformedVendors,
        categories,
        stats,
        costs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    } catch (error) {
      console.error('Error getting vendors:', error)
      throw new Error('Failed to get vendors')
    }
  }

  /**
   * Get vendor by ID
   */
  async findById(vendorId: string): Promise<VendorData | null> {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        include: {
          vendorCategory: true
        }
      })

      return vendor ? this.transformVendor(vendor) : null
    } catch (error) {
      console.error('Error getting vendor by ID:', error)
      throw new Error('Failed to get vendor')
    }
  }

  /**
   * Find vendor by couple and name/category combination
   */
  async findByCoupleAndNameCategory(coupleId: string, name: string, category: string): Promise<VendorData | null> {
    try {
      const vendor = await prisma.vendor.findFirst({
        where: {
          coupleId,
          businessName: name,
          vendorCategory: {
            name: category
          }
        },
        include: {
          vendorCategory: true
        }
      })

      return vendor ? this.transformVendor(vendor) : null
    } catch (error) {
      console.error('Error finding vendor by couple and name/category:', error)
      throw new Error('Failed to find vendor')
    }
  }

  /**
   * Create new vendor with transaction support
   */
  async createVendor(coupleId: string, data: CreateVendorData, tx: any = null): Promise<VendorData> {
    try {
      const client = tx || prisma
      const vendor = await client.vendor.create({
        data: {
          coupleId,
          name: data.businessName,
          businessName: data.businessName,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          website: data.website,
          address: data.address,
          categoryId: data.categoryId,
          status: data.status || 'potential',
          priority: data.priority || 'medium',
          rating: data.rating,
          estimatedCost: data.estimatedCost,
          actualCost: data.actualCost,
          contractSigned: data.contractSigned || false,
          notes: data.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          vendorCategory: true
        }
      })

      return this.transformVendor(vendor)
    } catch (error) {
      console.error('Error creating vendor:', error)
      throw new Error('Failed to create vendor')
    }
  }

  /**
   * Update vendor with transaction support
   */
  async updateVendor(vendorId: string, data: UpdateVendorData, tx: any = null): Promise<VendorData> {
    try {
      const client = tx || prisma
      const updateData: any = { ...data, updatedAt: new Date() }
      
      // Update name field if businessName is provided
      if (data.businessName) {
        updateData.name = data.businessName
      }

      const vendor = await client.vendor.update({
        where: { id: vendorId },
        data: updateData,
        include: {
          vendorCategory: true
        }
      })

      return this.transformVendor(vendor)
    } catch (error) {
      console.error('Error updating vendor:', error)
      throw new Error('Failed to update vendor')
    }
  }

  /**
   * Delete vendor with transaction support
   */
  async deleteVendor(vendorId: string, tx: any = null): Promise<void> {
    try {
      const client = tx || prisma
      await client.vendor.delete({
        where: { id: vendorId }
      })
    } catch (error) {
      console.error('Error deleting vendor:', error)
      throw new Error('Failed to delete vendor')
    }
  }

  /**
   * Get vendor categories
   */
  async getCategories(coupleId: string): Promise<VendorCategoryData[]> {
    try {
      const categories = await prisma.vendorCategory.findMany({
        orderBy: { name: 'asc' }
      })

      return categories.map(cat => this.transformCategory(cat))
    } catch (error) {
      console.error('Error getting vendor categories:', error)
      throw new Error('Failed to get vendor categories')
    }
  }

  /**
   * Get vendor statistics
   */
  async getStats(coupleId: string): Promise<VendorStats> {
    try {
      const statusStats = await prisma.vendor.groupBy({
        by: ['status'],
        where: { coupleId },
        _count: true,
        _sum: {
          estimatedCost: true,
          actualCost: true
        }
      })

      const stats: VendorStats = {
        total: 0,
        potential: 0,
        contacted: 0,
        quoted: 0,
        booked: 0,
        completed: 0,
        totalEstimatedCost: 0,
        totalActualCost: 0
      }

      statusStats.forEach(stat => {
        stats.total += stat._count
        stats.totalEstimatedCost += Number(stat._sum.estimatedCost || 0)
        stats.totalActualCost += Number(stat._sum.actualCost || 0)

        switch (stat.status) {
          case 'potential':
            stats.potential = stat._count
            break
          case 'contacted':
          case 'in_discussion':
            stats.contacted += stat._count
            break
          case 'quote_requested':
          case 'quoted':
            stats.quoted += stat._count
            break
          case 'booked':
          case 'contracted':
            stats.booked += stat._count
            break
          case 'completed':
            stats.completed = stat._count
            break
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting vendor stats:', error)
      throw new Error('Failed to get vendor stats')
    }
  }

  /**
   * Search vendors with pagination and enhanced filtering (Admin functionality)
   */
  async search(params: any): Promise<{ data: VendorData[], pagination: any }> {
    try {
      const {
        search,
        status,
        categoryId,
        contractSigned,
        coupleId,
        page = 1,
        pageSize = 20,
        sortBy = 'businessName',
        sortOrder = 'asc'
      } = params

      const where: any = {}
      
      if (coupleId) where.coupleId = coupleId
      if (status) where.status = status
      if (categoryId) where.categoryId = categoryId
      if (contractSigned !== undefined) where.contractSigned = contractSigned

      if (search) {
        where.OR = [
          { businessName: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } }
        ]
      }

      const total = await prisma.vendor.count({ where })
      const totalPages = Math.ceil(total / pageSize)
      const skip = (page - 1) * pageSize

      const vendors = await prisma.vendor.findMany({
        where,
        include: {
          vendorCategory: true
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize
      })

      return {
        data: vendors.map(vendor => this.transformVendor(vendor)),
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Error searching vendors:', error)
      throw new Error('Failed to search vendors')
    }
  }

  /**
   * Search vendors by query (simple search)
   */
  async searchVendors(coupleId: string, query: string): Promise<VendorData[]> {
    try {
      const vendors = await prisma.vendor.findMany({
        where: {
          coupleId,
          OR: [
            { businessName: { contains: query, mode: 'insensitive' } },
            { contactName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          vendorCategory: true
        },
        orderBy: { businessName: 'asc' }
      })

      return vendors.map(vendor => this.transformVendor(vendor))
    } catch (error) {
      console.error('Error searching vendors:', error)
      throw new Error('Failed to search vendors')
    }
  }

  /**
   * Get vendor statistics by couple
   */
  async getStatsByCouple(coupleId: string): Promise<VendorStats> {
    return this.getStats(coupleId)
  }

  /**
   * Get category statistics by couple
   */
  async getCategoryStatsByCouple(coupleId: string): Promise<any> {
    try {
      const categoryStats = await prisma.vendor.groupBy({
        by: ['categoryId'],
        where: { coupleId },
        _count: true,
        _sum: {
          estimatedCost: true,
          actualCost: true
        }
      })

      const categoriesWithStats = await Promise.all(
        categoryStats.map(async (stat) => {
          const category = stat.categoryId ? 
            await prisma.vendorCategory.findUnique({
              where: { id: stat.categoryId }
            }) : null

          return {
            categoryId: stat.categoryId,
            categoryName: category?.name || 'Uncategorized',
            vendorCount: stat._count,
            totalEstimatedCost: Number(stat._sum.estimatedCost || 0),
            totalActualCost: Number(stat._sum.actualCost || 0)
          }
        })
      )

      return categoriesWithStats
    } catch (error) {
      console.error('Error getting category stats by couple:', error)
      throw new Error('Failed to get category statistics')
    }
  }

  /**
   * Bulk update vendors
   */
  async bulkUpdate(vendorIds: string[], data: UpdateVendorData, tx: any = null): Promise<number> {
    try {
      const client = tx || prisma
      const updateData = { ...data, updatedAt: new Date() }
      
      // Update name field if businessName is provided
      if (data.businessName) {
        updateData.name = data.businessName
      }

      const result = await client.vendor.updateMany({
        where: {
          id: { in: vendorIds }
        },
        data: updateData
      })

      return result.count
    } catch (error) {
      console.error('Error bulk updating vendors:', error)
      throw new Error('Failed to bulk update vendors')
    }
  }

  /**
   * Find vendors by couple and category
   */
  async findByCoupleAndCategory(coupleId: string, categoryId: string): Promise<VendorData[]> {
    try {
      const vendors = await prisma.vendor.findMany({
        where: {
          coupleId,
          categoryId
        },
        include: {
          vendorCategory: true
        },
        orderBy: { businessName: 'asc' }
      })

      return vendors.map(vendor => this.transformVendor(vendor))
    } catch (error) {
      console.error('Error finding vendors by couple and category:', error)
      throw new Error('Failed to find vendors by category')
    }
  }

  /**
   * Find vendors with upcoming deadlines
   */
  async findWithUpcomingDeadlines(coupleId: string, days: number = 30): Promise<VendorData[]> {
    try {
      // This would require a deadlines table or field - for now return empty array
      // In a full implementation, you'd join with a deadlines/tasks table
      console.warn('findWithUpcomingDeadlines not fully implemented - requires deadlines schema')
      return []
    } catch (error) {
      console.error('Error finding vendors with upcoming deadlines:', error)
      throw new Error('Failed to find vendors with upcoming deadlines')
    }
  }

  /**
   * Transform vendor to API format
   */
  private transformVendor(vendor: any): VendorData {
    return {
      id: vendor.id,
      businessName: vendor.businessName || vendor.name || '',
      contactName: vendor.contactName || null,
      email: vendor.email || null,
      phone: vendor.phone || null,
      website: vendor.website || null,
      address: vendor.address || null,
      categoryId: vendor.categoryId || null,
      status: vendor.status || 'potential',
      priority: vendor.priority || 'medium',
      rating: vendor.rating || null,
      estimatedCost: vendor.estimatedCost ? Number(vendor.estimatedCost) : null,
      actualCost: vendor.actualCost ? Number(vendor.actualCost) : null,
      contractSigned: vendor.contractSigned || false,
      notes: vendor.notes || null,
      createdAt: vendor.createdAt || null,
      updatedAt: vendor.updatedAt || null,
      category: vendor.vendorCategory ? this.transformCategory(vendor.vendorCategory) : null
    }
  }

  /**
   * Transform category to API format
   */
  private transformCategory(category: any): VendorCategoryData {
    return {
      id: category.id,
      name: category.name,
      icon: category.icon || '🏢',
      color: category.color || '#667eea',
      description: category.description || null
    }
  }

  /**
   * Calculate total costs from vendors
   */
  private calculateCosts(vendors: any[]): VendorCosts {
    return {
      estimated: vendors.reduce((sum, vendor) => sum + Number(vendor.estimatedCost || 0), 0),
      actual: vendors.reduce((sum, vendor) => sum + Number(vendor.actualCost || 0), 0)
    }
  }
}