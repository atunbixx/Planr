import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { vendorService } from '@/lib/db/services'
import { successResponse, BadRequestException } from '@/lib/api/errors'
import { Vendor } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/vendors/[id] - Get vendor details
export const GET = withAuth<RouteParams, Vendor>(async (request, context, params) => {
  const resolvedParams = await params!.params
  const vendorId = resolvedParams.id
  
  const vendor = await vendorService.getVendorDetails(vendorId, context.couple.id)
  
  if (!vendor) {
    throw new BadRequestException('Vendor not found')
  }
  
  return successResponse({ data: vendor })
})

// PATCH /api/vendors/[id] - Update vendor
export const PATCH = withAuth<RouteParams, Vendor>(async (request, context, params) => {
  const resolvedParams = await params!.params
  const vendorId = resolvedParams.id
  const body = await request.json()
  
  const vendor = await vendorService.updateVendor(
    vendorId,
    context.couple.id,
    body
  )
  
  return successResponse({
    message: 'Vendor updated successfully',
    data: vendor
  })
})

// PUT /api/vendors/[id] - Replace vendor (alias for PATCH)
export const PUT = PATCH

// DELETE /api/vendors/[id] - Delete vendor
export const DELETE = withAuth<RouteParams>(async (request, context, params) => {
  const resolvedParams = await params!.params
  const vendorId = resolvedParams.id
  
  // Verify ownership first
  const vendor = await vendorService.getVendorDetails(vendorId, context.couple.id)
  if (!vendor) {
    throw new BadRequestException('Vendor not found')
  }
  
  // Delete the vendor
  await vendorService.delete(vendorId)
  
  return successResponse({
    message: 'Vendor deleted successfully'
  })
})