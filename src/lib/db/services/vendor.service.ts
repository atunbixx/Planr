import { BaseService } from './base.service'
import { Vendor, Prisma } from '@prisma/client'
import { VendorWithRelations, VendorStats } from '@/types/api'
import { BadRequestException } from '@/lib/api/errors'

export class VendorService extends BaseService<Vendor> {
  protected modelName = 'vendor' as const

  // Get vendors for a couple with statistics
  async getVendorsByCouple(coupleId: string): Promise<{
    vendors: VendorWithRelations[]
    stats: VendorStats
    costs: { estimated: number; actual: number }
  }> {
    const vendors = await this.prisma.vendor.findMany({
      where: { coupleId },
      include: {
        expenses: true
      },
      orderBy: [
        { category: 'asc' },
        { businessName: 'asc' }
      ]
    })

    // Calculate statistics
    const stats: VendorStats = {
      total: vendors.length,
      potential: vendors.filter(v => v.status === 'potential').length,
      contacted: vendors.filter(v => v.status === 'contacted').length,
      quoted: vendors.filter(v => v.status === 'quoted').length,
      booked: vendors.filter(v => v.status === 'booked').length,
      completed: vendors.filter(v => v.status === 'completed').length
    }

    // Calculate costs
    const costs = {
      estimated: vendors.reduce((sum, v) => sum + Number(v.estimatedCost || 0), 0),
      actual: vendors.reduce((sum, v) => sum + Number(v.actualCost || 0), 0)
    }

    return { vendors, stats, costs }
  }

  // Search vendors
  async searchVendors(
    coupleId: string,
    searchTerm: string,
    filters?: {
      category?: string
      status?: string
    }
  ): Promise<VendorWithRelations[]> {
    const where: Prisma.VendorWhereInput = {
      coupleId,
      AND: []
    }

    if (searchTerm) {
      where.AND!.push({
        OR: [
          { businessName: { contains: searchTerm, mode: 'insensitive' } },
          { contactName: { contains: searchTerm, mode: 'insensitive' } },
          { notes: { contains: searchTerm, mode: 'insensitive' } }
        ]
      })
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.status) {
      where.status = filters.status as any
    }

    return await this.findMany({
      where,
      include: {
        expenses: true
      },
      orderBy: { businessName: 'asc' }
    })
  }

  // Create vendor with validation
  async createVendor(coupleId: string, data: any): Promise<Vendor> {
    if (!data.businessName) {
      throw new BadRequestException('Business name is required')
    }

    return await this.create({
      ...data,
      coupleId,
      estimatedCost: data.estimatedCost ? Number(data.estimatedCost) : null,
      actualCost: data.actualCost ? Number(data.actualCost) : null,
      contractSigned: data.contractSigned || false,
      status: data.status || 'potential'
    })
  }

  // Update vendor
  async updateVendor(
    id: string, 
    coupleId: string, 
    data: any
  ): Promise<Vendor> {
    // Verify ownership
    const vendor = await this.findFirst({ id, coupleId })
    if (!vendor) {
      throw new BadRequestException('Vendor not found')
    }

    const updateData: any = { ...data }
    
    if (data.estimatedCost !== undefined) {
      updateData.estimatedCost = Number(data.estimatedCost)
    }
    
    if (data.actualCost !== undefined) {
      updateData.actualCost = Number(data.actualCost)
    }

    return await this.update(id, updateData)
  }

  // Get vendors by category
  async getVendorsByCategory(
    coupleId: string, 
    category: string
  ): Promise<VendorWithRelations[]> {
    return await this.findMany({
      where: { coupleId, category },
      include: {
        expenses: true
      },
      orderBy: { businessName: 'asc' }
    })
  }

  // Get vendor with all related data
  async getVendorDetails(
    id: string, 
    coupleId: string
  ): Promise<VendorWithRelations | null> {
    return await this.findFirst(
      { id, coupleId },
      {
        expenses: {
          orderBy: { date: 'desc' }
        }
      }
    )
  }
}