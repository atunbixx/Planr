import { NextRequest } from 'next/server'
import { z } from 'zod'
import { BaseApiHandler } from '../base-handler'
import { VendorService } from '@/features/vendors/service/vendor.service'

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
  private vendorService = new VendorService()
  
  async list(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const coupleId = this.requireCoupleId()
      
      // Parse query parameters
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const category = url.searchParams.get('category')
      const status = url.searchParams.get('status')
      
      const result = await this.vendorService.getVendorsForCouple({
        page,
        pageSize: limit,
        category,
        status
      })
      
      // Get vendor statistics
      const stats = await this.vendorService.getVendorStats()
      
      return {
        vendors: result.data,
        stats,
        pagination: result.pagination
      }
    })
  }
  
  async create(request: NextRequest) {
    return this.handleRequest(request, async () => {
      const data = await this.validateRequest(request, createVendorSchema)
      
      // Transform to enterprise service format
      const createRequest = {
        name: data.businessName,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        website: data.website,
        category: data.category,
        status: data.status,
        estimatedCost: data.estimatedCost,
        contractSigned: data.contractSigned,
        notes: data.notes
      }
      
      return await this.vendorService.createVendor(createRequest)
    })
  }
  
  async update(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      const data = await this.validateRequest(request, updateVendorSchema)
      
      // Transform to enterprise service format
      const updateRequest = {
        ...(data.businessName && { name: data.businessName }),
        ...(data.contactName && { contactName: data.contactName }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.website && { website: data.website }),
        ...(data.category && { category: data.category }),
        ...(data.status && { status: data.status }),
        ...(data.estimatedCost && { estimatedCost: data.estimatedCost }),
        ...(data.contractSigned !== undefined && { contractSigned: data.contractSigned }),
        ...(data.notes && { notes: data.notes })
      }
      
      return await this.vendorService.updateVendor(id, updateRequest)
    })
  }
  
  async delete(request: NextRequest, id: string) {
    return this.handleRequest(request, async () => {
      await this.vendorService.deleteVendor(id)
      return { success: true }
    })
  }
}