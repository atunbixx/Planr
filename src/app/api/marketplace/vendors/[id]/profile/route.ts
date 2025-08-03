import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { vendorProfileUpdateSchema } from '@/lib/validations/marketplace'
import { requireAuth, requireVendorAuth } from '@/lib/api-middleware/auth'
import { getCache, cacheKeys } from '@/lib/cache/memory-cache'

// PUT /api/marketplace/vendors/[id]/profile - Update vendor profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    
    // Check authentication
    const authResult = await requireAuth(request)
    if (!authResult.authenticated) {
      return authResult.response
    }
    
    // Check vendor authorization
    const vendorAuthResult = await requireVendorAuth(vendorId, authResult.user.id)
    if (!vendorAuthResult.authorized) {
      return vendorAuthResult.response
    }
    
    // Only owners and admins can update profile
    if (vendorAuthResult.role !== 'owner' && vendorAuthResult.role !== 'admin') {
      return createErrorResponse('Insufficient permissions', 403)
    }
    
    const body = await request.json()
    
    // Validate input
    const validationResult = vendorProfileUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return createErrorResponse(
        `Invalid profile data: ${validationResult.error.issues[0].message}`,
        400
      )
    }
    
    const updateData = validationResult.data
    
    // Update vendor profile
    const updatedVendor = await prisma.marketplace_vendors.update({
      where: { id: vendorId },
      data: {
        business_name: updateData.businessName,
        contact_name: updateData.contactName,
        description: updateData.description,
        contact_email: updateData.contactEmail,
        contact_phone: updateData.contactPhone,
        website: updateData.website,
        address: updateData.address,
        city: updateData.city,
        state: updateData.state,
        zip_code: updateData.zipCode,
        price_range: updateData.priceRange,
        specialties: updateData.specialties,
        portfolio_images: updateData.portfolioImages,
        portfolio_videos: updateData.portfolioVideos,
        years_in_business: updateData.yearsInBusiness,
        team_size: updateData.teamSize,
        booking_lead_time_days: updateData.bookingLeadTimeDays,
        requires_deposit: updateData.requiresDeposit,
        deposit_percentage: updateData.depositPercentage,
        cancellation_policy: updateData.cancellationPolicy,
        tags: updateData.tags,
        search_keywords: updateData.searchKeywords,
        latitude: updateData.latitude,
        longitude: updateData.longitude,
        updated_at: new Date()
      }
    })
    
    // Invalidate cache
    const cache = getCache()
    await cache.del(cacheKeys.vendorDetail(vendorId))
    await cache.delPattern(cacheKeys.vendorPattern(vendorId))
    await cache.delPattern(cacheKeys.allVendorsPattern())
    
    return createSuccessResponse({
      message: 'Profile updated successfully',
      vendor: updatedVendor
    })
  } catch (error) {
    console.error('Vendor profile update error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// GET /api/marketplace/vendors/[id]/profile - Get vendor profile (for editing)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = params.id
    
    // Check authentication
    const authResult = await requireAuth(request)
    if (!authResult.authenticated) {
      return authResult.response
    }
    
    // Check vendor authorization
    const vendorAuthResult = await requireVendorAuth(vendorId, authResult.user.id)
    if (!vendorAuthResult.authorized) {
      return vendorAuthResult.response
    }
    
    // Get vendor profile
    const vendor = await prisma.marketplace_vendors.findUnique({
      where: { id: vendorId }
    })
    
    if (!vendor) {
      return createErrorResponse('Vendor not found', 404)
    }
    
    return createSuccessResponse(vendor)
  } catch (error) {
    console.error('Vendor profile get error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}