import { prisma } from '@/lib/prisma'
import type { vendors } from '@prisma/client'

export class VendorsService {
  // Get all vendors for a couple
  static async getVendorsByCouple(coupleId: string) {
    return await prisma.vendors.findMany({
      where: { couple_id: coupleId },
      orderBy: { created_at: 'desc' }
    })
  }

  // Create a new vendor
  static async createVendor(data: {
    couple_id: string
    name: string
    business_name?: string
    category: string
    status: string
    email?: string
    phone?: string
    website?: string
    estimated_cost?: number
    notes?: string
  }): Promise<vendors> {
    return await prisma.vendors.create({
      data: {
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
  }

  // Update vendor
  static async updateVendor(vendorId: string, data: Partial<vendors>): Promise<vendors> {
    return await prisma.vendors.update({
      where: { id: vendorId },
      data: {
        ...data,
        updated_at: new Date()
      }
    })
  }

  // Get vendor with related data
  static async getVendorWithDetails(vendorId: string) {
    return await prisma.vendors.findUnique({
      where: { id: vendorId },
      include: {
        budget_expenses: true,
        tasks: true,
        timeline_items: true,
        vendor_messages: true
      }
    })
  }

  // Get vendors by category
  static async getVendorsByCategory(coupleId: string, category: string) {
    return await prisma.vendors.findMany({
      where: { 
        couple_id: coupleId,
        category: category
      },
      orderBy: { created_at: 'desc' }
    })
  }
}