import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { z } from 'zod'

// Request validation schema
const typingSchema = z.object({
  vendorId: z.string().uuid(),
  isTyping: z.boolean()
})

// POST /api/messages/typing - Update typing status
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    
    // Validate request body
    const validation = typingSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message)
    }

    const { vendorId, isTyping } = validation.data
    const supabase = createServerClient()

    // Get the couple ID for the authenticated user
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single()

    if (coupleError || !couple) {
      return createErrorResponse('Couple not found', 404)
    }

    // Verify vendor belongs to couple
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('couple_id', couple.id)
      .single()

    if (vendorError || !vendor) {
      return createErrorResponse('Vendor not found', 404)
    }

    // Update or insert typing indicator
    const { error: typingError } = await supabase
      .from('typing_indicators')
      .upsert({
        vendor_id: vendorId,
        couple_id: couple.id,
        user_id: user.id,
        user_type: 'couple',
        is_typing: isTyping,
        last_typed_at: new Date().toISOString()
      }, {
        onConflict: 'vendor_id,couple_id,user_id'
      })

    if (typingError) {
      console.error('Error updating typing status:', typingError)
      return createErrorResponse('Failed to update typing status', 500)
    }

    // Clean up old typing indicators
    await supabase.rpc('cleanup_typing_indicators')

    return createSuccessResponse({
      vendorId,
      isTyping,
      timestamp: new Date().toISOString()
    }, 'Typing status updated')

  } catch (error) {
    console.error('Typing indicator API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}