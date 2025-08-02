import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/messages/[id]/read - Mark a message as read
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const { id: messageId } = params
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

    // Get the message to verify it belongs to the couple and get vendor ID
    const { data: message, error: messageError } = await supabase
      .from('vendor_messages')
      .select('id, vendor_id, couple_id, is_read')
      .eq('id', messageId)
      .eq('couple_id', couple.id)
      .single()

    if (messageError || !message) {
      return createErrorResponse('Message not found', 404)
    }

    // If already read, return success
    if (message.is_read) {
      return createSuccessResponse({ alreadyRead: true }, 'Message already marked as read')
    }

    // Mark this specific message as read
    const { error: updateError } = await supabase
      .from('vendor_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (updateError) {
      console.error('Error marking message as read:', updateError)
      return createErrorResponse('Failed to mark message as read', 500)
    }

    // Also mark all previous messages in the conversation as read
    await supabase.rpc('mark_messages_as_read', {
      p_vendor_id: message.vendor_id,
      p_couple_id: couple.id,
      p_user_id: user.id
    })

    return createSuccessResponse({
      messageId,
      readAt: new Date().toISOString()
    }, 'Message marked as read')

  } catch (error) {
    console.error('Mark message read API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}