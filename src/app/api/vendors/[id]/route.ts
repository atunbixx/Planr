import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'
import { updateVendorSchema } from '@/lib/validation/vendor'

interface RouteParams {
  params: { id: string }
}

// GET /api/vendors/[id] - Get a specific vendor
async function getHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: params.id,
        userId: request.user!.id
      }
    })

    if (!vendor) {
      return NextResponse.json(
        createErrorResponse('Vendor not found'),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vendor
    })
  } catch (error) {
    console.error('Get vendor error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// PUT /api/vendors/[id] - Update a vendor
async function putHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = updateVendorSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.issues.map(e => e.message).join(', ')}`
        ),
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Update vendor
    const vendor = await prisma.vendor.updateMany({
      where: {
        id: params.id,
        userId: request.user!.id
      },
      data: updateData
    })

    if (vendor.count === 0) {
      return NextResponse.json(
        createErrorResponse('Vendor not found'),
        { status: 404 }
      )
    }

    // Fetch and return updated vendor
    const updatedVendor = await prisma.vendor.findUnique({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      data: updatedVendor
    })

  } catch (error) {
    console.error('Update vendor error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// DELETE /api/vendors/[id] - Delete a vendor
async function deleteHandler(request: AuthenticatedRequest, { params }: RouteParams) {
  try {
    const vendor = await prisma.vendor.deleteMany({
      where: {
        id: params.id,
        userId: request.user!.id
      }
    })

    if (vendor.count === 0) {
      return NextResponse.json(
        createErrorResponse('Vendor not found'),
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully'
    })

  } catch (error) {
    console.error('Delete vendor error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export const GET = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return getHandler(request, { params })
})

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return putHandler(request, { params })
})

export const DELETE = requireOnboarding(async (request: AuthenticatedRequest) => {
  const params = { id: request.url.split('/').pop()! }
  return deleteHandler(request, { params })
})