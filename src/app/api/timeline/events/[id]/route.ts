'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getCoupleId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Find couple by user ID
  const couple = await prisma.wedding_couples.findFirst({
    where: {
      OR: [
        { partner1_user_id: user.id },
        { partner2_user_id: user.id },
        { partner1_email: user.email },
        { partner2_email: user.email }
      ]
    }
  })

  if (!couple) {
    throw new Error('No couple found for user')
  }

  return couple.id
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coupleId = await getCoupleId()
    const eventId = params.id
    
    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 })
    }

    // Check if timeline item belongs to this couple
    const existingItem = await prisma.timeline_items.findFirst({
      where: {
        id: eventId,
        couple_id: coupleId
      }
    })

    if (!existingItem) {
      return NextResponse.json({
        success: false,
        error: 'Timeline event not found'
      }, { status: 404 })
    }

    // Delete timeline item
    await prisma.timeline_items.delete({
      where: { id: eventId }
    })

    return NextResponse.json({
      success: true,
      message: 'Timeline event deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting timeline event:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete timeline event'
    }, { status: 500 })
  }
}