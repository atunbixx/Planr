import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase-server'
import { z } from 'zod'

// Request validation schemas
const sendMessageSchema = z.object({
  vendorId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  messageType: z.enum(['text', 'image', 'document']).default('text'),
  threadId: z.string().uuid().optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    name: z.string(),
    size: z.number(),
    type: z.string()
  })).optional().default([]),
  metadata: z.record(z.any()).optional().default({})
})

const updateMessageSchema = z.object({
  content: z.string().min(1).max(5000)
})

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    
    // Validate request body
    const validation = sendMessageSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message)
    }

    const { vendorId, content, messageType, threadId, attachments, metadata } = validation.data
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

    // Send the message using the database function
    const { data: messageId, error: sendError } = await supabase
      .rpc('send_vendor_message', {
        p_vendor_id: vendorId,
        p_couple_id: couple.id,
        p_sender_type: 'couple',
        p_sender_id: user.id,
        p_content: content,
        p_message_type: messageType,
        p_thread_id: threadId,
        p_attachments: attachments,
        p_metadata: metadata
      })

    if (sendError) {
      console.error('Error sending message:', sendError)
      return createErrorResponse('Failed to send message', 500)
    }

    // Fetch the created message
    const { data: message, error: fetchError } = await supabase
      .from('vendor_messages')
      .select('*')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      return createErrorResponse('Failed to fetch sent message', 500)
    }

    // Notify vendor about the new message (if they have real-time subscriptions)
    // This is handled by Supabase Realtime automatically

    return createSuccessResponse({
      message: {
        id: message.id,
        vendorId: message.vendor_id,
        threadId: message.thread_id,
        senderType: message.sender_type,
        senderId: message.sender_id,
        senderName: message.sender_name,
        type: message.message_type,
        content: message.content,
        attachments: message.attachments,
        metadata: message.metadata,
        isRead: message.is_read,
        createdAt: message.created_at
      }
    }, 'Message sent successfully')

  } catch (error) {
    console.error('Send message API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// PUT /api/messages/[id] - Update/edit a message
export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const url = new URL(request.url)
    const messageId = url.pathname.split('/').pop()

    if (!messageId) {
      return createErrorResponse('Message ID is required')
    }

    const body = await request.json()
    
    // Validate request body
    const validation = updateMessageSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(validation.error.errors[0].message)
    }

    const { content } = validation.data
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

    // Update the message (RLS will ensure they can only update their own messages)
    const { data: updatedMessage, error: updateError } = await supabase
      .from('vendor_messages')
      .update({
        content,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .eq('sender_type', 'couple')
      .select()
      .single()

    if (updateError || !updatedMessage) {
      return createErrorResponse('Failed to update message or unauthorized', 400)
    }

    return createSuccessResponse({
      message: {
        id: updatedMessage.id,
        content: updatedMessage.content,
        isEdited: updatedMessage.is_edited,
        editedAt: updatedMessage.edited_at
      }
    }, 'Message updated successfully')

  } catch (error) {
    console.error('Update message API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const { user, error: authError } = await requireAuth()
    if (authError) return authError

    const url = new URL(request.url)
    const messageId = url.pathname.split('/').pop()

    if (!messageId) {
      return createErrorResponse('Message ID is required')
    }

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

    // Delete the message (RLS will ensure they can only delete their own messages)
    const { error: deleteError } = await supabase
      .from('vendor_messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .eq('sender_type', 'couple')

    if (deleteError) {
      return createErrorResponse('Failed to delete message or unauthorized', 400)
    }

    return createSuccessResponse(null, 'Message deleted successfully')

  } catch (error) {
    console.error('Delete message API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
}