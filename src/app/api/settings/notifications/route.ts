import { NextRequest } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { notificationPreferencesSchema } from '@/types/settings'
import { z } from 'zod'

// PUT /api/settings/notifications - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    // Parse and validate request body
    const body = await request.json()
    
    // Validate using zod schema
    let validatedData
    try {
      validatedData = notificationPreferencesSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(
          `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
          400
        )
      }
      throw error
    }

    const supabase = createServerClient()

    // Map notification preferences to database columns
    const settingsUpdate = {
      email_notifications: validatedData.emailUpdates,
      notify_task_deadlines: validatedData.taskReminders,
      notify_vendor_messages: validatedData.vendorMessages,
      notify_rsvp_updates: validatedData.guestRsvpAlerts,
      notify_payment_reminders: validatedData.budgetAlerts,
      email_frequency: validatedData.dailyDigest ? 'daily' : 
                       validatedData.weeklyReport ? 'weekly' : 'realtime',
      last_updated: new Date().toISOString()
    }

    // Check if user settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user!.id)
      .single()

    if (!existingSettings) {
      // Create settings if they don't exist
      const { error: createError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user!.id,
          ...settingsUpdate
        })

      if (createError) {
        console.error('Error creating settings:', createError)
        return createErrorResponse('Failed to create notification settings', 500)
      }
    } else {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('user_settings')
        .update(settingsUpdate)
        .eq('user_id', user!.id)

      if (updateError) {
        console.error('Error updating settings:', updateError)
        return createErrorResponse('Failed to update notification settings', 500)
      }
    }

    return createSuccessResponse(
      { notifications: validatedData },
      'Notification preferences updated successfully'
    )
  } catch (error) {
    console.error('Notification update error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}