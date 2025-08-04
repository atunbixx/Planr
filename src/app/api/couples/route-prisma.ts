import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Create Prisma client with correct Supabase URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || 'postgresql://postgres.gpfxxbhowailwllpgphe:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZnh4Ymhvd2FpbHdsbHBncGhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg4MzIxMiwiZXhwIjoyMDY4NDU5MjEyfQ.JpJUU-ZsuWQjAlTzNysTEGHNoIFnC_5x0CKhzk7H2Xk@db.gpfxxbhowailwllpgphe.supabase.co:5432/postgres'
    }
  }
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      clerk_user_id,
      email,
      partner1_name,
      partner2_name,
      wedding_style,
      wedding_date,
      venue_name,
      venue_location,
      guest_count_estimate,
      budget_total,
      onboarding_completed = true
    } = body

    // Validate required fields
    if (!clerk_user_id || !partner1_name) {
      return NextResponse.json(
        { error: 'Missing required fields: clerk_user_id and partner1_name' },
        { status: 400 }
      )
    }

    // First, ensure user exists in users table
    const user = await prisma.user.upsert({
      where: { clerk_user_id },
      update: {
        email: email || undefined,
        first_name: partner1_name.split(' ')[0],
        last_name: partner1_name.split(' ').slice(1).join(' ') || undefined,
      },
      create: {
        clerk_user_id,
        email: email || `${clerk_user_id}@placeholder.com`,
        first_name: partner1_name.split(' ')[0],
        last_name: partner1_name.split(' ').slice(1).join(' ') || undefined,
      }
    })

    // Create or update couple record
    const couple = await prisma.couple.upsert({
      where: { user_id: user.id },
      update: {
        partner1_name,
        partner2_name,
        wedding_style,
        wedding_date: wedding_date ? new Date(wedding_date) : undefined,
        venue_name,
        venue_location,
        guest_count_estimate,
        budget_total: budget_total ? parseFloat(budget_total) : undefined,
        onboarding_completed,
      },
      create: {
        user_id: user.id,
        partner1_name,
        partner2_name,
        wedding_style,
        wedding_date: wedding_date ? new Date(wedding_date) : undefined,
        venue_name,
        venue_location,
        guest_count_estimate,
        budget_total: budget_total ? parseFloat(budget_total) : undefined,
        onboarding_completed,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Couple profile created successfully',
      data: couple
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clerk_user_id = searchParams.get('clerk_user_id')

    if (!clerk_user_id) {
      return NextResponse.json(
        { error: 'clerk_user_id is required' },
        { status: 400 }
      )
    }

    // Get user and their couple data
    const user = await prisma.user.findUnique({
      where: { clerk_user_id },
      include: { couple: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}