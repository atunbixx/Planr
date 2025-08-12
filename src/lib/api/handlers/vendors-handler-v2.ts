import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler } from '../base-handler'
import { vendorService } from '@/lib/services/vendor.service'

// Validation schemas
const createVendorSchema = z.object({
  businessName: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  category: z.string().optional(),
  status: z.enum(['potential', 'contacted', 'quoted', 'booked', 'completed']).default('potential'),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  contractSigned: z.boolean().default(false)
})

const updateVendorSchema = createVendorSchema.partial()

export class VendorsHandlerV2 extends BaseApiHandler {
  protected model = 'Vendor' as const
  
  async list(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const category = url.searchParams.get('category')
      const status = url.searchParams.get('status')
      
      const result = await vendorService.getVendorsForCouple(coupleId, {
        page,
        pageSize: limit,
        category,
        status
      })
      
      // Get categories
      const categories = await vendorService.getCategories()
      
      // Calculate stats from the vendors
      const stats = result.data.reduce((acc, vendor) => {
        acc.total++
        acc[vendor.status || 'potential']++
        if (vendor.contractSigned) acc.contractsSigned++
        acc.estimatedTotal += Number(vendor.estimatedCost || 0)
        acc.actualTotal += Number(vendor.actualCost || 0)
        return acc
      }, {
        total: 0,
        potential: 0,
        contacted: 0,
        quoted: 0,
        booked: 0,
        completed: 0,
        contractsSigned: 0,
        estimatedTotal: 0,
        actualTotal: 0
      })
      
      return {
        vendors: result.data,
        categories,
        stats: {
          total: stats.total,
          potential: stats.potential,
          contacted: stats.contacted,
          quoted: stats.quoted,
          booked: stats.booked,
          completed: stats.completed
        },
        costs: {
          estimated: stats.estimatedTotal,
          actual: stats.actualTotal
        },
        pagination: result.pagination
      }
    })
  }
  
  async create(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, createVendorSchema)
      
      // Transform to database format
      const dbData = this.transformInput({
        ...data,
        coupleId,
        name: data.businessName // Map businessName to name for database
      })
      
      return await vendorService.createVendor(coupleId, dbData)
    })
  }
  
  async update(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      const data = await this.validateRequest(request, updateVendorSchema)
      
      // Transform to database format
      const dbData = this.transformInput(data)
      if (data.businessName) {
        dbData.name = data.businessName // Map businessName to name for database
      }
      
      return await vendorService.updateVendor(id, coupleId, dbData)
    })
  }
  
  async delete(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      await vendorService.deleteVendor(id, coupleId)
      return { success: true }
    })
  }
}