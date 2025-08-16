import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { createErrorResponse } from '@/lib/auth/jwt'
import { createVendorSchema } from '@/lib/validation/vendor'

// GET /api/vendors - List all vendors for the authenticated user
async function getHandler(request: AuthenticatedRequest) {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: vendors
    })
  } catch (error) {
    console.error('Get vendors error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

// POST /api/vendors - Create a new vendor
async function postHandler(request: AuthenticatedRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = createVendorSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        ),
        { status: 400 }
      )
    }

    const { name, category, priceRange, contact, website } = validationResult.data

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        userId: request.user!.id,
        name,
        category,
        priceRange,
        contact,
        website: website || null
      }
    })

    return NextResponse.json({
      success: true,
      data: vendor
    }, { status: 201 })

  } catch (error) {
    console.error('Create vendor error:', error)
    return NextResponse.json(
      createErrorResponse('Internal server error'),
      { status: 500 }
    )
  }
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)