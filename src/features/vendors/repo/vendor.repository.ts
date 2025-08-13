import { prisma } from '@/lib/prisma'
import { Vendor, Prisma } from '@prisma/client'
import { BaseRepository } from '@/lib/repositories/BaseRepository'

export class VendorRepository extends BaseRepository<Vendor> {
  async findById(id: string): Promise<Vendor | null> {
    return this.executeQuery(() =>
      prisma.vendor.findUnique({ 
        where: { id },
        include: {
          vendorCategories: true
        }
      })
    )
  }

  async findByCoupleId(coupleId: string, filters?: {
    categoryId?: string
    status?: string
    priority?: string
  }): Promise<Vendor[]> {
    return this.executeQuery(() => {
      const where: Prisma.VendorWhereInput = { coupleId }
      
      if (filters?.categoryId) where.categoryId = filters.categoryId
      if (filters?.status) where.status = filters.status
      if (filters?.priority) where.priority = filters.priority

      return prisma.vendor.findMany({ 
        where,
        include: {
          vendorCategories: true,
          _count: {
            select: {
              expenses: true,
              couple_vendor_tasks: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    })
  }

  async findByEmail(email: string, coupleId: string): Promise<Vendor | null> {
    return this.executeQuery(() =>
      prisma.vendor.findFirst({ 
        where: { 
          email,
          coupleId 
        },
        include: {
          vendorCategories: true
        }
      })
    )
  }

  async create(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.executeQuery(() =>
      prisma.vendor.create({ 
        data,
        include: {
          vendorCategories: true
        }
      })
    )
  }

  async createMany(data: Prisma.VendorCreateManyInput[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.vendor.createMany({ data })
    )
  }

  async update(id: string, data: Prisma.VendorUpdateInput): Promise<Vendor> {
    return this.executeQuery(() =>
      prisma.vendor.update({ 
        where: { id },
        data,
        include: {
          vendorCategories: true
        }
      })
    )
  }

  async updateStatus(id: string, status: string): Promise<Vendor> {
    return this.executeQuery(() =>
      prisma.vendor.update({
        where: { id },
        data: { 
          status,
          contractSigned: status === 'booked' ? true : undefined
        },
        include: {
          vendorCategories: true
        }
      })
    )
  }

  async delete(id: string): Promise<Vendor> {
    return this.executeQuery(() =>
      prisma.vendor.delete({ 
        where: { id },
        include: {
          vendorCategories: true
        }
      })
    )
  }

  async deleteMany(ids: string[]): Promise<{ count: number }> {
    return this.executeQuery(() =>
      prisma.vendor.deleteMany({ 
        where: { 
          id: { in: ids } 
        } 
      })
    )
  }

  async getStatsByCoupleId(coupleId: string): Promise<{
    total: number
    booked: number
    pending: number
    declined: number
    totalEstimatedCost: number
    totalActualCost: number
    contractsSigned: number
    byCategory: Array<{
      categoryId: string
      categoryName: string
      count: number
      totalCost: number
    }>
  }> {
    return this.executeQuery(async () => {
      const vendors = await prisma.vendor.findMany({
        where: { coupleId },
        include: {
          vendorCategories: true
        }
      })

      const total = vendors.length
      const booked = vendors.filter(v => v.status === 'booked').length
      const pending = vendors.filter(v => ['potential', 'contacted', 'quote_requested', 'in_discussion'].includes(v.status)).length
      const declined = vendors.filter(v => v.status === 'declined').length
      const contractsSigned = vendors.filter(v => v.contractSigned).length

      const totalEstimatedCost = vendors.reduce((sum, v) => sum + (v.estimatedCost?.toNumber() || 0), 0)
      const totalActualCost = vendors.reduce((sum, v) => sum + (v.actualCost?.toNumber() || 0), 0)

      // Group by category
      const byCategory = vendors.reduce((acc, vendor) => {
        if (!vendor.categoryId || !vendor.vendorCategories) return acc
        
        const categoryId = vendor.categoryId
        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryId,
            categoryName: vendor.vendorCategories.name,
            count: 0,
            totalCost: 0
          }
        }
        
        acc[categoryId].count++
        acc[categoryId].totalCost += vendor.actualCost?.toNumber() || vendor.estimatedCost?.toNumber() || 0
        
        return acc
      }, {} as Record<string, any>)

      return {
        total,
        booked,
        pending,
        declined,
        totalEstimatedCost,
        totalActualCost,
        contractsSigned,
        byCategory: Object.values(byCategory)
      }
    })
  }

  async getUpcomingMeetings(coupleId: string, days: number = 30): Promise<Vendor[]> {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return this.executeQuery(() =>
      prisma.vendor.findMany({
        where: {
          coupleId,
          meetingDate: {
            gte: new Date(),
            lte: futureDate
          }
        },
        include: {
          vendorCategories: true
        },
        orderBy: { meetingDate: 'asc' }
      })
    )
  }

  async attachContract(vendorId: string, contractUrl: string): Promise<Vendor> {
    return this.executeQuery(() =>
      prisma.vendor.update({
        where: { id: vendorId },
        data: {
          contractUrl,
          contractSigned: true
        },
        include: {
          vendorCategories: true
        }
      })
    )
  }
}