import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        couples: {
          include: {
            guests: true,
            vendors: true,
            tasks: true,
            budgetItems: true,
            photos: true
          }
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Start transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      // Delete all related data for each couple
      for (const couple of dbUser.couples) {
        // Delete guests
        await tx.guest.deleteMany({
          where: { coupleId: couple.id }
        })

        // Delete vendors if they exist
        if (couple.vendors && couple.vendors.length > 0) {
          await tx.vendor.deleteMany({
            where: { coupleId: couple.id }
          })
        }

        // Delete tasks if they exist
        if (couple.tasks && couple.tasks.length > 0) {
          await tx.task.deleteMany({
            where: { coupleId: couple.id }
          })
        }

        // Delete budget items if they exist
        if (couple.budgetItems && couple.budgetItems.length > 0) {
          await tx.budgetItem.deleteMany({
            where: { coupleId: couple.id }
          })
        }

        // Delete photos if they exist
        if (couple.photos && couple.photos.length > 0) {
          await tx.photo.deleteMany({
            where: { coupleId: couple.id }
          })
        }

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

    // Delete the user from Clerk
    try {
      const client = await clerkClient()
      await client.users.deleteUser(userId)
    } catch (clerkError) {
      console.error('Error deleting user from Clerk:', clerkError)
      // Continue even if Clerk deletion fails - user data is already deleted from our DB
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
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user and count their data
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        couples: {
          include: {
            _count: {
              select: {
                guests: true,
                vendors: true,
                tasks: true,
                budgetItems: true,
                photos: true
              }
            }
          }
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate data summary
    const dataSummary = {
      couplesCount: dbUser.couples.length,
      guestsCount: dbUser.couples.reduce((sum, couple) => sum + (couple._count?.guests || 0), 0),
      vendorsCount: dbUser.couples.reduce((sum, couple) => sum + (couple._count?.vendors || 0), 0),
      tasksCount: dbUser.couples.reduce((sum, couple) => sum + (couple._count?.tasks || 0), 0),
      budgetItemsCount: dbUser.couples.reduce((sum, couple) => sum + (couple._count?.budgetItems || 0), 0),
      photosCount: dbUser.couples.reduce((sum, couple) => sum + (couple._count?.photos || 0), 0)
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