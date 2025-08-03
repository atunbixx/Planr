import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-middleware/auth'
import { z } from 'zod'

// Vendor registration schema
const vendorRegistrationSchema = z.object({
  businessName: z.string().min(3).max(200),
  category: z.string(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  description: z.string().min(50).max(2000),
  city: z.string(),
  state: z.string(),
  zipCode: z.string().optional()
})

// POST /api/vendor-dashboard/register - Register as a vendor
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = await requireAuth(request)
    if (!authResult.authenticated) {
      return authResult.response
    }
    
    const body = await request.json()
    
    // Validate input
    const validationResult = vendorRegistrationSchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse(
        `Invalid registration data: ${validationResult.error.issues[0].message}`,
        400
      )
    }
    
    const data = validationResult.data
    
    // Check if user already has a vendor account
    const existingVendor = await prisma.vendor_users.findFirst({
      where: { user_id: authResult.user.id }
    })
    
    if (existingVendor) {
      return createErrorResponse('You already have a vendor account', 400)
    }
    
    // Create vendor account
    const newVendor = await prisma.marketplace_vendors.create({
      data: {
        business_name: data.businessName,
        category: data.category,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        description: data.description,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        verified: false, // Start unverified
        featured: false,
        average_rating: 0,
        total_reviews: 0,
        total_bookings: 0,
        response_rate: 100,
        response_time_hours: 24,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    
    // Link vendor to user
    await prisma.vendor_users.create({
      data: {
        vendor_id: newVendor.id,
        user_id: authResult.user.id,
        role: 'owner',
        created_at: new Date()
      }
    })
    
    return createSuccessResponse({
      message: 'Vendor account created successfully',
      vendorId: newVendor.id
    })
  } catch (error) {
    console.error('Vendor registration error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}