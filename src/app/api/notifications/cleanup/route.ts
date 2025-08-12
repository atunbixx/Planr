import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notifications/notification-service'

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you might want to add API key authentication)
    const authHeader = request.headers.get('authorization')
    const internalKey = process.env.INTERNAL_API_KEY
    
    if (internalKey && authHeader !== `Bearer ${internalKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Clean up expired notifications
    const deletedCount = await notificationService.cleanupExpiredNotifications()

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired notifications`,
      deletedCount
    })
  } catch (error) {
    console.error('Error in notification cleanup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}