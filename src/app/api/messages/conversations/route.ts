import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'

// GET /api/messages/conversations - List all conversations for the authenticated couple
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

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

    // Get all vendor conversations with latest message
    const { data: conversations, error: conversationsError } = await supabase
      .rpc('get_latest_vendor_messages', {
        p_couple_id: couple.id
      })

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      return createErrorResponse('Failed to fetch conversations', 500)
    }

    // Transform the data to match frontend expectations
    const formattedConversations = conversations?.map(conv => ({
      vendorId: conv.vendor_id,
      vendorName: conv.vendor_name,
      lastMessage: {
        id: conv.latest_message_id,
        content: conv.latest_message_content,
        type: conv.latest_message_type,
        timestamp: conv.latest_message_time
      },
      unreadCount: conv.unread_count,
      hasAttachments: conv.latest_message_type !== 'text'
    })) || []

    return createSuccessResponse({
      conversations: formattedConversations,
      totalUnread: formattedConversations.reduce((sum, conv) => sum + Number(conv.unreadCount), 0)
    })

  } catch (error) {
    console.error('Conversations API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}