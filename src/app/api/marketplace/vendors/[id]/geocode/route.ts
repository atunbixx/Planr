import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireVendorAuth } from '@/lib/api-middleware/auth'
import { geocodeVendorAddress } from '@/lib/services/geocoding'
import { getCache, cacheKeys } from '@/lib/cache/memory-cache'

// POST /api/marketplace/vendors/[id]/geocode - Geocode vendor address
export async function POST(
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
    
    // Only owners and admins can geocode
    if (vendorAuthResult.role !== 'owner' && vendorAuthResult.role !== 'admin') {
      return createErrorResponse('Insufficient permissions', 403)
    }
    
    // Get vendor address information
    const vendor = await prisma.marketplace_vendors.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        zip_code: true,
        country: true,
        latitude: true,
        longitude: true
      }
    })
    
    if (!vendor) {
      return createErrorResponse('Vendor not found', 404)
    }
    
    // Check if already geocoded
    if (vendor.latitude && vendor.longitude) {
      return createSuccessResponse({
        message: 'Location already set',
        latitude: vendor.latitude,
        longitude: vendor.longitude
      })
    }
    
    // Check if address is available
    if (!vendor.address && !vendor.city && !vendor.state) {
      return createErrorResponse('No address information available to geocode', 400)
    }
    
    // Geocode the address
    const result = await geocodeVendorAddress(vendor)
    
    if (!result) {
      return createErrorResponse('Unable to geocode address. Please verify the address is correct.', 400)
    }
    
    // Update vendor with coordinates
    const updatedVendor = await prisma.marketplace_vendors.update({
      where: { id: vendorId },
      data: {
        latitude: result.lat,
        longitude: result.lng,
        updated_at: new Date()
      }
    })
    
    // Invalidate cache
    const cache = getCache()
    await cache.del(cacheKeys.vendorDetail(vendorId))
    await cache.delPattern(cacheKeys.vendorPattern(vendorId))
    await cache.delPattern(cacheKeys.allVendorsPattern())
    
    return createSuccessResponse({
      message: 'Location updated successfully',
      latitude: result.lat,
      longitude: result.lng,
      formattedAddress: result.formattedAddress
    })
  } catch (error) {
    console.error('Vendor geocode error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}