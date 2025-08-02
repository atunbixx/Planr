import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'

// GET /api/couples - Get current user's couple data
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const couple = await prisma.couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: user.id },
          { partner2_user_id: user.id }
        ]
      }
    })

    if (!couple) {
      return createErrorResponse('Couple not found', 404)
    }

    return createSuccessResponse(couple)
  } catch (error) {
    console.error('Get couple error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// POST /api/couples - Create couple profile
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const {
      partner1_name,
      partner2_name,
      wedding_date,
      venue_name,
      venue_location,
      guest_count_estimate,
      total_budget,
      wedding_style
    } = body

    // Check if couple already exists
    const existingCouple = await prisma.couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: user.id },
          { partner2_user_id: user.id }
        ]
      }
    })

    if (existingCouple) {
      return createErrorResponse('Couple profile already exists', 400)
    }

    const couple = await prisma.couples.create({
      data: {
        partner1_user_id: user.id,
        partner1_name,
        partner2_name,
        wedding_date: wedding_date ? new Date(wedding_date) : null,
        venue_name,
        venue_location,
        guest_count_estimate: guest_count_estimate ? parseInt(guest_count_estimate) : null,
        total_budget: total_budget ? parseFloat(total_budget) : null,
        wedding_style: wedding_style || 'traditional'
      }
    })

    return createSuccessResponse(couple, 'Couple profile created successfully')
  } catch (error) {
    console.error('Create couple error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// PUT /api/couples - Update couple profile
export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const {
      partner1_name,
      partner2_name,
      wedding_date,
      venue_name,
      venue_location,
      guest_count_estimate,
      total_budget,
      wedding_style
    } = body

    const couple = await prisma.couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: user.id },
          { partner2_user_id: user.id }
        ]
      }
    })

    if (!couple) {
      return createErrorResponse('Couple not found', 404)
    }

    const updatedCouple = await prisma.couples.update({
      where: { id: couple.id },
      data: {
        partner1_name,
        partner2_name,
        wedding_date: wedding_date ? new Date(wedding_date) : null,
        venue_name,
        venue_location,
        guest_count_estimate: guest_count_estimate ? parseInt(guest_count_estimate) : null,
        total_budget: total_budget ? parseFloat(total_budget) : null,
        wedding_style: wedding_style || couple.wedding_style
      }
    })

    return createSuccessResponse(updatedCouple, 'Couple profile updated successfully')
  } catch (error) {
    console.error('Update couple error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}