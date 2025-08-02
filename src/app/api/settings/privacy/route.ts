import { NextRequest } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { privacySettingsSchema } from '@/types/settings'
import { z } from 'zod'

// PUT /api/settings/privacy - Update privacy settings
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
      validatedData = privacySettingsSchema.parse(body)
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

    const settingsUpdate = {
      profile_visibility: validatedData.profileVisibility,
      show_budget_to_vendors: validatedData.shareWithVendors,
      allow_guest_photos: validatedData.allowGuestUploads,
      export_format: validatedData.dataExport ? 'pdf' : null,
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
        return createErrorResponse('Failed to create privacy settings', 500)
      }
    } else {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('user_settings')
        .update(settingsUpdate)
        .eq('user_id', user!.id)

      if (updateError) {
        console.error('Error updating settings:', updateError)
        return createErrorResponse('Failed to update privacy settings', 500)
      }
    }

    return createSuccessResponse(
      { privacy: validatedData },
      'Privacy settings updated successfully'
    )
  } catch (error) {
    console.error('Privacy update error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}