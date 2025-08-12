import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { supabase_user_id: user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ 
        role: null,
        permissions: [],
        error: 'User not found in database'
      })
    }

    // Check if user is the owner (couple)
    const couple = await prisma.couple.findFirst({
      where: { userId: dbUser.id }
    })

    if (couple) {
      // Owners have all permissions
      return NextResponse.json({
        role: 'owner',
        permissions: [
          'view',
          'edit',
          'manage_guests',
          'edit_guests',
          'manage_budget',
          'view_budget',
          'manage_vendors',
          'view_schedule',
          'manage_tasks',
          'manage_photos',
          'view_photos',
          'manage_own_vendor'
        ]
      })
    }

    // Check if user is a wedding couple owner
    const weddingCouple = await prisma.couples.findFirst({
      where: {
        OR: [
          { partner1_user_id: dbUser.id },
          { partner2_user_id: dbUser.id }
        ]
      }
    })

    if (weddingCouple) {
      // Wedding couple owners have all permissions
      return NextResponse.json({
        role: 'owner',
        permissions: [
          'view',
          'edit',
          'manage_guests',
          'edit_guests',
          'manage_budget',
          'view_budget',
          'manage_vendors',
          'view_schedule',
          'manage_tasks',
          'manage_photos',
          'view_photos',
          'manage_own_vendor'
        ]
      })
    }

    // Check collaborator permissions
    const collaborator = await prisma.couple_collaborators.findFirst({
      where: {
        user_id: dbUser.id,
        status: 'accepted'
      }
    })

    if (collaborator) {
      return NextResponse.json({
        role: collaborator.role,
        permissions: collaborator.permissions
      })
    }

    // No permissions found
    return NextResponse.json({
      role: null,
      permissions: []
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}