import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getUser } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  console.log('=== POST /api/couples - Request received ===')
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    console.log('Step 1: Getting authenticated user from Supabase...')
    
    // Get the authenticated user from Supabase
    const supabaseUser = await getUser()
    console.log('Supabase user ID:', supabaseUser?.id)
    
    if (!supabaseUser) {
      console.error('No authenticated user found')
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Received onboarding data:', JSON.stringify(body, null, 2))
    
    const {
      partner1Name,
      partner2Name,
      weddingStyle,
      weddingDate,
      venueName,
      venueLocation,
      guestCountEstimate,
      totalBudget,
      email
    } = body
    
    // Log data types for debugging
    console.log('Data types:', {
      partner1Name: typeof partner1Name,
      partner2Name: typeof partner2Name,
      weddingStyle: typeof weddingStyle,
      weddingDate: typeof weddingDate,
      venueName: typeof venueName,
      venueLocation: typeof venueLocation,
      guestCountEstimate: typeof guestCountEstimate,
      totalBudget: typeof totalBudget,
      email: typeof email
    })

    // Validate required fields
    if (!partner1Name) {
      return NextResponse.json(
        { error: 'Missing required field: partner1Name' },
        { status: 400 }
      )
    }

    // First, ensure user exists in users table
    let user
    try {
      user = await prisma.user.findUnique({
        where: { supabase_user_id: supabaseUser.id }
      })
      console.log('Found existing user:', user?.id)
    } catch (dbError) {
      console.error('Database error finding user:', dbError)
      throw new Error('Failed to check user existence')
    }

    if (!user) {
      // Create new user
      try {
        user = await prisma.user.create({
          data: {
            supabase_user_id: supabaseUser.id,
            email: email || supabaseUser.email || `${supabaseUser.id}@placeholder.com`,
            firstName: partner1Name.split(' ')[0],
            lastName: partner1Name.split(' ').slice(1).join(' ') || null,
          }
        })
        console.log('Created new user:', user.id)
      } catch (createError) {
        console.error('Error creating user:', createError)
        throw new Error('Failed to create user record')
      }
    } else {
      // Update existing user
      try {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            email: email || user.email,
            firstName: partner1Name.split(' ')[0],
            lastName: partner1Name.split(' ').slice(1).join(' ') || user.lastName,
          }
        })
        console.log('Updated existing user:', user.id)
      } catch (updateError) {
        console.error('Error updating user:', updateError)
        throw new Error('Failed to update user record')
      }
    }

    // Check if couple record exists
    let couple = await prisma.couple.findFirst({
      where: { userId: user.id }
    })

    const coupleData: any = {
      userId: user.id,
      partner1Name: partner1Name,
      partner2Name: partner2Name || '',
      weddingDate: weddingDate ? new Date(weddingDate) : null,
      venueName: venueName || '',
      venueLocation: venueLocation || '',
      guestCountEstimate: parseInt(guestCountEstimate) || 100,
      weddingStyle: weddingStyle || 'traditional',
      onboardingCompleted: true
    }
    
    // Only include totalBudget if it's provided
    if (totalBudget !== undefined && totalBudget !== null && totalBudget !== '') {
      coupleData.totalBudget = parseFloat(totalBudget)
    }

    if (couple) {
      // Update existing couple
      couple = await prisma.couple.update({
        where: { id: couple.id },
        data: coupleData
      })
      console.log('Updated existing couple profile')
    } else {
      // Create new couple
      couple = await prisma.couple.create({
        data: coupleData
      })
      console.log('Created new couple profile')
    }

    // Set cookie to indicate onboarding is complete
    const response = NextResponse.json({
      success: true,
      message: 'Couple profile created successfully',
      data: couple
    })

    // Set cookie for 30 days
    console.log('Setting onboardingCompleted cookie...')
    response.cookies.set('onboardingCompleted', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/' // Ensure cookie is available site-wide
    })
    
    console.log('Cookie should be set. Response headers:', response.headers)

    return response

  } catch (error) {
    console.error('API Error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // More specific error messages
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'A couple profile already exists for this user' },
          { status: 409 }
        )
      }
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid user reference' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUser = await getUser()
    
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user and their couple data
    const user = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get couple data separately
    const couple = await prisma.couple.findFirst({
      where: { userId: user.id }
    })

    return NextResponse.json({
      success: true,
      data: {
        user,
        couple
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}