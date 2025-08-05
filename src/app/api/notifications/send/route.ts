import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { auth } from '@clerk/nextjs/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      title, 
      message, 
      url, 
      icon, 
      recipients = 'all', // 'all' or array of user IDs
      type = 'general' // general, reminder, update, alert
    } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Get user's couple data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        couples (id)
      `)
      .eq('clerk_user_id', userId)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json(
        { error: 'No couple found for user' },
        { status: 400 }
      )
    }

    const coupleId = userData.couples[0].id

    // Get push subscriptions for the couple
    let subscriptionsQuery = supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('couple_id', coupleId)

    // Filter by recipients if specified
    if (recipients !== 'all' && Array.isArray(recipients)) {
      subscriptionsQuery = subscriptionsQuery.in('user_id', recipients)
    }

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { success: true, sent: 0, message: 'No active subscriptions found' }
      )
    }

    // Filter subscriptions based on preferences and notification type
    const filteredSubscriptions = subscriptions.filter(sub => {
      const prefs = sub.preferences || {}
      
      switch (type) {
        case 'reminder':
          return prefs.taskReminders !== false
        case 'vendor':
          return prefs.vendorUpdates !== false
        case 'photo':
          return prefs.photoNotifications !== false
        case 'budget':
          return prefs.budgetAlerts !== false
        default:
          return true // General notifications always sent
      }
    })

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: message,
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      url: url || '/dashboard',
      timestamp: Date.now(),
      tag: `wedding-${type}`,
      requireInteraction: type === 'alert',
      actions: [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ]
    })

    // Send notifications
    const results = await Promise.allSettled(
      filteredSubscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          }

          await webpush.sendNotification(pushSubscription, payload)
          return { success: true, subscriptionId: subscription.id }
        } catch (error: any) {
          console.error(`Failed to send notification to ${subscription.id}:`, error)
          
          // Handle invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription is no longer valid, remove it
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id)
          }
          
          return { success: false, subscriptionId: subscription.id, error: error.message }
        }
      })
    )

    // Count successful sends
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    // Log notification
    try {
      await supabaseAdmin
        .from('notification_logs')
        .insert({
          couple_id: coupleId,
          user_id: userData.id,
          title,
          message,
          type,
          recipients_count: filteredSubscriptions.length,
          sent_count: successful,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Error logging notification:', logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      total: filteredSubscriptions.length,
      failed: filteredSubscriptions.length - successful
    })

  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper endpoint to get notification preferences
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's couple data
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        couples (id)
      `)
      .eq('clerk_user_id', userId)
      .single()

    if (!userData?.couples?.[0]) {
      return NextResponse.json(
        { error: 'No couple found for user' },
        { status: 400 }
      )
    }

    const coupleId = userData.couples[0].id

    // Get user's subscriptions and preferences
    const { data: subscriptions } = await supabaseAdmin
      .from('push_subscriptions')
      .select('preferences')
      .eq('couple_id', coupleId)
      .eq('user_id', userData.id)

    const defaultPreferences = {
      taskReminders: true,
      vendorUpdates: true,
      photoNotifications: true,
      budgetAlerts: true
    }

    const userPreferences = subscriptions?.[0]?.preferences || defaultPreferences

    return NextResponse.json({
      subscribed: subscriptions && subscriptions.length > 0,
      preferences: userPreferences
    })

  } catch (error) {
    console.error('Error getting notification preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}