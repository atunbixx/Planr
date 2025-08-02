import { NextRequest } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { profileSettingsSchema } from '@/types/settings'
import { z } from 'zod'

// PUT /api/settings/profile - Update profile settings
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
      validatedData = profileSettingsSchema.parse(body)
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

    // Update auth user metadata for full name and avatar
    if (validatedData.fullName || validatedData.avatarUrl !== undefined) {
      const { error: updateAuthError } = await supabase.auth.updateUser({
        data: {
          full_name: validatedData.fullName,
          avatar_url: validatedData.avatarUrl
        }
      })

      if (updateAuthError) {
        console.error('Error updating auth metadata:', updateAuthError)
        return createErrorResponse('Failed to update profile', 500)
      }
    }

    // Prepare settings update data
    const settingsUpdate: any = {
      last_updated: new Date().toISOString()
    }

    // Map profile fields to database columns
    if (validatedData.weddingDate) {
      settingsUpdate.wedding_date = validatedData.weddingDate
    }
    if (validatedData.partnerName !== undefined) {
      settingsUpdate.partner_name = validatedData.partnerName
    }
    if (validatedData.venue !== undefined) {
      settingsUpdate.venue = validatedData.venue
    }
    if (validatedData.guestCount !== undefined) {
      settingsUpdate.guest_count_estimate = parseInt(validatedData.guestCount) || null
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
        return createErrorResponse('Failed to create settings', 500)
      }
    } else {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('user_settings')
        .update(settingsUpdate)
        .eq('user_id', user!.id)

      if (updateError) {
        console.error('Error updating settings:', updateError)
        return createErrorResponse('Failed to update settings', 500)
      }
    }

    // Update couple information if wedding-related fields changed
    if (validatedData.weddingDate || validatedData.venue || validatedData.guestCount) {
      const { data: couple } = await supabase
        .from('couples')
        .select('id')
        .or(`partner1_user_id.eq.${user!.id},partner2_user_id.eq.${user!.id}`)
        .single()

      if (couple) {
        const coupleUpdate: any = {}
        
        if (validatedData.weddingDate) {
          coupleUpdate.wedding_date = validatedData.weddingDate
        }
        if (validatedData.venue) {
          coupleUpdate.venue_name = validatedData.venue
        }
        if (validatedData.guestCount) {
          coupleUpdate.guest_count_estimate = parseInt(validatedData.guestCount)
        }

        const { error: coupleUpdateError } = await supabase
          .from('couples')
          .update(coupleUpdate)
          .eq('id', couple.id)

        if (coupleUpdateError) {
          console.error('Error updating couple information:', coupleUpdateError)
          // Don't fail the whole request if couple update fails
        }
      }
    }

    return createSuccessResponse(
      { profile: validatedData },
      'Profile updated successfully'
    )
  } catch (error) {
    console.error('Profile update error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}