import { NextRequest } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { passwordChangeSchema } from '@/types/settings'
import { z } from 'zod'

// PUT /api/settings/password - Change user password
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
      validatedData = passwordChangeSchema.parse(body)
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

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: validatedData.currentPassword
    })

    if (signInError) {
      return createErrorResponse('Current password is incorrect', 401)
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return createErrorResponse('Failed to update password', 500)
    }

    return createSuccessResponse(
      null,
      'Password updated successfully'
    )
  } catch (error) {
    console.error('Password change error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}