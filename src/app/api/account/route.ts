import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CoupleRepository } from '@/lib/repositories/CoupleRepository'
import { UserRepository } from '@/lib/repositories/UserRepository'
import { GuestRepository } from '@/features/guests/repo'
import { VendorRepository } from '@/features/vendors/repo'
import { PhotoRepository } from '@/features/photos/repo'
import { ChecklistRepository } from '@/features/checklist/repo'
import { BudgetCategoryRepository } from '@/features/budget/repo'

const coupleRepository = new CoupleRepository()
const userRepository = new UserRepository()
const guestRepository = new GuestRepository()
const vendorRepository = new VendorRepository()
const photoRepository = new PhotoRepository()
const checklistRepository = new ChecklistRepository()
const budgetCategoryRepository = new BudgetCategoryRepository()

export async function DELETE() {
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

    // Get all couples for this user using repository
    const couples = await coupleRepository.findByUserId(dbUser.id)

    // Start transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      // Delete all related data for each couple
      for (const couple of couples) {
        // Delete guests
        await tx.guest.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete vendors if they exist
        await tx.vendor.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete checklist items if they exist
        await tx.checklistItem.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete budget categories if they exist
        await tx.budgetCategory.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete photos if they exist
        await tx.photo.deleteMany({
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

    // Get couples using repository
    const couples = await coupleRepository.findByUserId(dbUser.id)
    
    // Get counts for each couple using repositories
    const couplesWithCounts = await Promise.all(couples.map(async (couple) => {
      const [guestsCount, vendorsCount, photosCount] = await Promise.all([
        guestRepository.countByCoupleId(couple.id),
        vendorRepository.countByCoupleId(couple.id),
        photoRepository.countByCoupleId(couple.id)
      ])
      
      return {
        ...couple,
        _count: {
          guests: guestsCount,
          vendors: vendorsCount,
          photos: photosCount
        }
      }
    }))

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