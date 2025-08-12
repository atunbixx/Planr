import { BaseRepository } from './base.repository'
import { Vendor, Prisma } from '@prisma/client'

export class VendorRepository extends BaseRepository<Vendor> {
  protected model = this.prisma.vendor

  async findByCouple(coupleId: string, options?: {
    status?: string
    categoryId?: string
    priority?: string
    skip?: number
    take?: number
    orderBy?: any
  }): Promise<Vendor[]> {
    const where: Prisma.VendorWhereInput = { coupleId }
    
    if (options?.status) where.status = options.status
    if (options?.categoryId) where.categoryId = options.categoryId
    if (options?.priority) where.priority = options.priority

    return await this.model.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        vendorCategories: true
      }
    })
  }

  async findWithCategory(vendorId: string): Promise<Vendor | null> {
    return await this.model.findUnique({
      where: { id: vendorId },
      include: {
        vendorCategories: true
      }
    })
  }

  async countByStatus(coupleId: string, status: string): Promise<number> {
    return await this.model.count({
      where: {
        coupleId,
        status
      }
    })
  }

  async getTotalCosts(coupleId: string): Promise<{
    estimated: number
    actual: number
  }> {
    const vendors = await this.findByCouple(coupleId)
    
    return vendors.reduce((totals, vendor) => ({
      estimated: totals.estimated + Number(vendor.estimatedCost || 0),
      actual: totals.actual + Number(vendor.actualCost || 0)
    }), { estimated: 0, actual: 0 })
  }

  async findByCategory(coupleId: string, categoryId: string): Promise<Vendor[]> {
    return await this.findByCouple(coupleId, { categoryId })
  }

  async updateStatus(vendorId: string, status: string): Promise<Vendor> {
    return await this.update(vendorId, { status })
  }

  async updateContract(vendorId: string, signed: boolean, actualCost?: number): Promise<Vendor> {
    const data: Prisma.VendorUpdateInput = {
      contractSigned: signed
    }
    
    if (actualCost !== undefined) {
      data.actualCost = actualCost
    }

    return await this.update(vendorId, data)
  }
}

// Export singleton instance
export const vendorRepository = new VendorRepository()