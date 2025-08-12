import { BaseService, PaginationOptions, PaginatedResult } from './base.service'
import { Vendor, Prisma } from '@prisma/client'

export interface CreateVendorDto {
  name: string
  contactName?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  categoryId?: string
  status?: string
  priority?: string
  rating?: number
  estimatedCost?: number
  actualCost?: number
  notes?: string
  meetingDate?: Date
  contractSigned?: boolean
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {}

export interface VendorWithCategory extends Vendor {
  vendorCategories?: any
}

export class VendorService extends BaseService<Vendor> {
  protected entityName = 'vendor'
  protected cachePrefix = 'vendors'

  async getVendorsForCouple(
    coupleId: string,
    options?: PaginationOptions & { status?: string; categoryId?: string }
  ): Promise<PaginatedResult<VendorWithCategory>> {
    const { skip, take, page, pageSize } = this.getPaginationParams(options)

    // Build where clause
    const where: Prisma.VendorWhereInput = {
      coupleId
    }
    if (options?.status) where.status = options.status
    if (options?.categoryId) where.categoryId = options.categoryId

    // Check cache
    const cacheKey = `${this.cachePrefix}:${coupleId}:list:${JSON.stringify(where)}:${page}:${pageSize}`
    const cached = await this.getCached<PaginatedResult<VendorWithCategory>>(cacheKey)
    if (cached) {
      return cached
    }

    // Query with pagination
    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        include: {
          vendorCategories: true
        },
        orderBy: options?.orderBy || [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take
      }),
      this.prisma.vendor.count({ where })
    ])

    const result = this.createPaginatedResult(vendors, total, page, pageSize)
    
    // Cache the result
    await this.setCached(cacheKey, result)

    return result
  }

  async createVendor(coupleId: string, data: CreateVendorDto): Promise<Vendor> {
    const vendor = await this.prisma.vendor.create({
      data: {
        coupleId,
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        website: data.website,
        address: data.address,
        categoryId: data.categoryId,
        status: data.status || 'potential',
        priority: data.priority || 'medium',
        rating: data.rating,
        estimatedCost: data.estimatedCost,
        actualCost: data.actualCost,
        notes: data.notes,
        meetingDate: data.meetingDate,
        contractSigned: data.contractSigned || false
      },
      include: {
        vendorCategories: true
      }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return vendor
  }

  async updateVendor(vendorId: string, coupleId: string, data: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        website: data.website,
        address: data.address,
        categoryId: data.categoryId,
        status: data.status,
        priority: data.priority,
        rating: data.rating,
        estimatedCost: data.estimatedCost,
        actualCost: data.actualCost,
        notes: data.notes,
        meetingDate: data.meetingDate,
        contractSigned: data.contractSigned
      },
      include: {
        vendorCategories: true
      }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)

    return vendor
  }

  async deleteVendor(vendorId: string, coupleId: string): Promise<void> {
    await this.prisma.vendor.delete({
      where: { id: vendorId }
    })

    // Clear cache
    await this.clearEntityCache(coupleId)
  }

  async getVendorsByStatus(coupleId: string, status: string): Promise<Vendor[]> {
    const cacheKey = `${this.cachePrefix}:${coupleId}:status:${status}`
    const cached = await this.getCached<Vendor[]>(cacheKey)
    if (cached) {
      return cached
    }

    const vendors = await this.prisma.vendor.findMany({
      where: {
        coupleId,
        status
      },
      include: {
        vendorCategories: true
      },
      orderBy: [
        { priority: 'desc' },
        { name: 'asc' }
      ]
    })

    await this.setCached(cacheKey, vendors)

    return vendors
  }

  async getVendorCategories(): Promise<any[]> {
    const cacheKey = `${this.cachePrefix}:categories`
    const cached = await this.getCached<any[]>(cacheKey)
    if (cached) {
      return cached
    }

    const categories = await this.prisma.vendorCategory.findMany({
      orderBy: [
        { display_order: 'asc' },
        { name: 'asc' }
      ]
    })

    await this.setCached(cacheKey, categories, 3600) // Cache for 1 hour

    return categories
  }
}

// Export singleton instance
export const vendorService = new VendorService()