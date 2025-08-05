import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { auth } from '@clerk/nextjs/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configure web-push (you'll need to add these env vars)
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
    const { subscription, preferences } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
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

    // Check if subscription table exists, create if needed
    const { error: tableError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      // Create table
      await supabaseAdmin.rpc('exec', {
        sql: `
          CREATE TABLE IF NOT EXISTS push_subscriptions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            preferences JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(couple_id, endpoint)
          );

          CREATE INDEX IF NOT EXISTS idx_push_subscriptions_couple_id ON push_subscriptions(couple_id);
          CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
        `
      })
    }

    // Upsert subscription
    const { data: savedSubscription, error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert({
        couple_id: coupleId,
        user_id: userData.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        preferences: preferences || {
          taskReminders: true,
          vendorUpdates: true,
          photoNotifications: true,
          budgetAlerts: true
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'couple_id,endpoint'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving subscription:', error)
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      )
    }

    // Send welcome notification
    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: 'Wedding Planner Notifications Enabled!',
        body: 'You\'ll now receive important updates about your wedding planning.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        url: '/dashboard'
      }))
    } catch (notificationError) {
      console.error('Error sending welcome notification:', notificationError)
      // Don't fail the subscription if notification fails
    }

    return NextResponse.json({
      success: true,
      subscriptionId: savedSubscription.id
    })

  } catch (error) {
    console.error('Error in push subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      )
    }

    // Get user data
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

    // Delete subscription
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('couple_id', coupleId)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Error deleting subscription:', error)
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting push subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}