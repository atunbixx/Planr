import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { vendorInquirySchema } from '@/lib/validations/marketplace'
import { inquiryRateLimit } from '@/lib/api-middleware/rate-limit'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// POST /api/marketplace/vendors/[id]/inquiry - Submit inquiry to vendor
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await inquiryRateLimit(request)
    if (rateLimitResult.limited) {
      return rateLimitResult.response!
    }
    const vendorId = params.id
    const body = await request.json()
    
    // Validate input
    const validationResult = vendorInquirySchema.safeParse({
      ...body,
      vendorId
    })
    
    if (!validationResult.success) {
      return createErrorResponse(
        `Invalid inquiry data: ${validationResult.error.issues[0].message}`,
        400
      )
    }
    
    const inquiryData = validationResult.data
    
    // Get session to link inquiry to couple if logged in
    const session = await getServerSession(authOptions)
    let coupleId = null
    
    if (session?.user?.id) {
      const couple = await prisma.couples.findFirst({
        where: {
          OR: [
            { partner1_user_id: session.user.id },
            { partner2_user_id: session.user.id }
          ]
        }
      })
      coupleId = couple?.id
    }
    
    // Check if vendor exists and is verified
    const vendor = await prisma.marketplace_vendors.findUnique({
      where: { id: vendorId },
      select: { id: true, verified: true, business_name: true }
    })
    
    if (!vendor) {
      return createErrorResponse('Vendor not found', 404)
    }
    
    if (!vendor.verified) {
      return createErrorResponse('Vendor not available for inquiries', 404)
    }
    
    // Create inquiry
    const inquiry = await prisma.vendor_inquiries.create({
      data: {
        vendor_id: vendorId,
        couple_id: coupleId,
        name: inquiryData.name,
        email: inquiryData.email,
        phone: inquiryData.phone,
        event_date: inquiryData.eventDate,
        event_type: inquiryData.eventType,
        guest_count: inquiryData.guestCount,
        budget_range: inquiryData.budgetRange,
        message: inquiryData.message,
        specific_questions: inquiryData.specificQuestions,
        source: 'marketplace',
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        user_agent: request.headers.get('user-agent') || undefined
      }
    })
    
    // TODO: Send email notification to vendor
    // TODO: Send confirmation email to inquirer
    
    return createSuccessResponse({
      id: inquiry.id,
      message: 'Inquiry sent successfully. The vendor will contact you soon.'
    })
  } catch (error) {
    console.error('Vendor inquiry error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}