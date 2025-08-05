import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the user and all related data
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
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    // Prepare export data
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: clerkUser.emailAddresses[0]?.emailAddress || '',
        version: '1.0'
      },
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        createdAt: dbUser.createdAt,
        preferences: dbUser.preferences
      },
      couples: dbUser.couples.map(couple => ({
        id: couple.id,
        partnerName: couple.partnerName,
        weddingDate: couple.weddingDate,
        venue: couple.venue,
        location: couple.location,
        expectedGuests: couple.expectedGuests,
        totalBudget: couple.totalBudget,
        weddingStyle: couple.weddingStyle,
        createdAt: couple.createdAt,
        updatedAt: couple.updatedAt,
        guests: couple.guests.map(guest => ({
          id: guest.id,
          name: guest.name,
          email: guest.email,
          phone: guest.phone,
          address: guest.address,
          relationship: guest.relationship,
          side: guest.side,
          plusOneAllowed: guest.plusOneAllowed,
          plusOneName: guest.plusOneName,
          rsvpStatus: guest.rsvpStatus,
          attendingCount: guest.attendingCount,
          dietaryRestrictions: guest.dietaryRestrictions,
          specialRequests: guest.specialRequests,
          notes: guest.notes,
          invitationSentAt: guest.invitationSentAt,
          rsvpDeadline: guest.rsvpDeadline,
          createdAt: guest.createdAt
        })),
        vendors: couple.vendors?.map(vendor => ({
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          contactName: vendor.contactName,
          email: vendor.email,
          phone: vendor.phone,
          website: vendor.website,
          address: vendor.address,
          notes: vendor.notes,
          rating: vendor.rating,
          budgetAllocated: vendor.budgetAllocated,
          finalCost: vendor.finalCost,
          contractSigned: vendor.contractSigned,
          depositPaid: vendor.depositPaid,
          status: vendor.status,
          createdAt: vendor.createdAt
        })) || [],
        tasks: couple.tasks?.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          status: task.status,
          dueDate: task.dueDate,
          completedAt: task.completedAt,
          createdAt: task.createdAt
        })) || [],
        budgetItems: couple.budgetItems?.map(item => ({
          id: item.id,
          category: item.category,
          itemName: item.itemName,
          estimatedCost: item.estimatedCost,
          actualCost: item.actualCost,
          paid: item.paid,
          notes: item.notes,
          createdAt: item.createdAt
        })) || [],
        photos: couple.photos?.map(photo => ({
          id: photo.id,
          publicId: photo.publicId,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl,
          caption: photo.caption,
          tags: photo.tags,
          uploadedAt: photo.uploadedAt
        })) || []
      }))
    }

    // Create JSON blob
    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    // Return as downloadable file
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="wedding-data-export-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}