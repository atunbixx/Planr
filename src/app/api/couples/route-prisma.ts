import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@clerk/nextjs/server'

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
      where: { clerkId: clerk_user_id },
      update: {
        email: email || undefined,
        firstName: partner1_name.split(' ')[0],
        lastName: partner1_name.split(' ').slice(1).join(' ') || undefined,
      },
      create: {
        clerkId: clerk_user_id,
        email: email || `${clerk_user_id}@placeholder.com`,
        firstName: partner1_name.split(' ')[0],
        lastName: partner1_name.split(' ').slice(1).join(' ') || undefined,
      }
    })

    // Create or update couple record - first find existing couple for this user
    let couple = await prisma.couple.findFirst({
      where: { userId: user.id }
    })

    if (couple) {
      // Update existing couple
      couple = await prisma.couple.update({
        where: { id: couple.id },
        data: {
          partnerName: partner1_name,
          weddingStyle: wedding_style,
          weddingDate: wedding_date ? new Date(wedding_date) : undefined,
          venue: venue_name,
          location: venue_location,
          expectedGuests: guest_count_estimate,
          totalBudget: budget_total ? parseFloat(budget_total) : undefined,
          onboardingCompleted: onboarding_completed,
        }
      })
    } else {
      // Create new couple
      couple = await prisma.couple.create({
        data: {
          userId: user.id,
          partnerName: partner1_name,
          weddingStyle: wedding_style,
          weddingDate: wedding_date ? new Date(wedding_date) : undefined,
          venue: venue_name,
          location: venue_location,
          expectedGuests: guest_count_estimate,
          totalBudget: budget_total ? parseFloat(budget_total) : undefined,
          onboardingCompleted: onboarding_completed,
        }
      })
    }

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
      where: { clerkId: clerk_user_id },
      include: { couples: true }
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