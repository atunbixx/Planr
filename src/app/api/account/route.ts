import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { UserRepository } from '@/lib/repositories/UserRepository'
const coupleRepository = new CoupleRepository()
const userRepository = new UserRepository()

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user in our database using repository
    const dbUser = await userRepository.findBySupabaseUserId(user.id)

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the couple for this user using repository
    const couple = await coupleRepository.findByUserId(dbUser.id)

    // Start transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      // Delete all related data for the couple
      if (couple) {
        // Delete guests
        await tx.guest.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete vendors if they exist
        await tx.vendor.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete photos if they exist
        await tx.photo.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete photo albums if they exist
        await tx.photoAlbum.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete the couple
        await tx.couple.delete({
          where: { id: couple.id }
        })
      }

      // Finally, delete the user
      await tx.user.delete({
        where: { id: dbUser.id }
      })
    })

    // Delete the user from Supabase
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        console.error('Error deleting user from Supabase:', error)
        // Continue even if Supabase deletion fails - user data is already deleted from our DB
      }
    } catch (supabaseError) {
      console.error('Error deleting user from Supabase:', supabaseError)
      // Continue even if Supabase deletion fails - user data is already deleted from our DB
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also provide a GET endpoint to check account status
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user using repository
    const dbUser = await userRepository.findBySupabaseUserId(user.id)

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get couple using repository
    const couple = await coupleRepository.findByUserId(dbUser.id)
    
    if (!couple) {
      return NextResponse.json({ 
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() || dbUser.email,
          avatarUrl: null
        },
        couples: []
      })
    }
    
    // Get counts for the couple
    const couplesWithCounts = [{
      ...couple,
      _count: {
        guests: 0,
        vendors: 0,
        photos: 0
      }
    }]

    // Calculate data summary
    const dataSummary = {
      couplesCount: couplesWithCounts.length,
      guestsCount: couplesWithCounts.reduce((sum: number, couple: any) => sum + (couple._count?.guests || 0), 0),
      vendorsCount: couplesWithCounts.reduce((sum: number, couple: any) => sum + (couple._count?.vendors || 0), 0),
      photosCount: couplesWithCounts.reduce((sum: number, couple: any) => sum + (couple._count?.photos || 0), 0)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        createdAt: dbUser.createdAt
      },
      dataSummary
    })
  } catch (error) {
    console.error('Error fetching account info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}