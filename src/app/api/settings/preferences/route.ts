import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      currency,
      alertThreshold,
      emailNotifications,
      taskReminders,
      budgetAlerts,
      vendorUpdates,
      timezone,
      language
    } = body

    // Find the user in our database
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update or create user preferences
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        preferences: {
          currency: currency || 'USD',
          alertThreshold: alertThreshold || 85,
          emailNotifications: emailNotifications ?? true,
          taskReminders: taskReminders ?? true,
          budgetAlerts: budgetAlerts ?? true,
          vendorUpdates: vendorUpdates ?? false,
          timezone: timezone || 'America/New_York',
          language: language || 'en'
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      preferences: updatedUser.preferences 
    })
  } catch (error) {
    console.error('Error saving user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the user and their preferences
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        preferences: true
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      currency: 'USD',
      alertThreshold: 85,
      emailNotifications: true,
      taskReminders: true,
      budgetAlerts: true,
      vendorUpdates: false,
      timezone: 'America/New_York',
      language: 'en'
    }

    return NextResponse.json({ 
      success: true, 
      preferences: dbUser.preferences || defaultPreferences
    })
  } catch (error) {
    console.error('Error fetching user preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}