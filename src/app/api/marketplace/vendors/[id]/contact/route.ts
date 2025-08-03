import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const contactSchema = z.object({
  vendor_id: z.string().uuid(),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferred_contact: z.enum(['email', 'phone', 'text']).optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  event_date: z.string().optional(),
  budget: z.number().positive().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get couple ID for the authenticated user
    const { data: coupleData, error: coupleError } = await supabase
      .from('couples')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (coupleError || !coupleData) {
      return NextResponse.json(
        { success: false, error: 'Couple profile not found' },
        { status: 404 }
      )
    }

    const coupleId = coupleData.id
    const body = await request.json()
    
    // Validate request body
    const validatedData = contactSchema.parse({
      ...body,
      vendor_id: params.id
    })

    // Verify vendor exists
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, business_name, contact_email, contact_phone')
      .eq('id', params.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Create contact message
    const { data: message, error: messageError } = await supabase
      .from('vendor_messages')
      .insert({
        vendor_id: params.id,
        couple_id: coupleId,
        message_type: 'inquiry',
        content: validatedData.message,
        subject: validatedData.subject,
        preferred_contact: validatedData.preferred_contact || 'email',
        urgency: validatedData.urgency || 'medium',
        event_date: validatedData.event_date,
        budget: validatedData.budget,
        is_read: false,
        sender_type: 'couple'
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error creating message:', messageError)
      return NextResponse.json(
        { success: false, error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Send notification to vendor
    try {
      await supabase.from('notifications').insert({
        user_id: vendor.id, // Assuming vendor user_id is stored in vendors table
        type: 'new_message',
        title: 'New Inquiry',
        message: `New inquiry from ${user.user_metadata?.full_name || 'a couple'}`,
        data: { message_id: message.id }
      })
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.error('Failed to send notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      data: {
        message_id: message.id,
        message: 'Message sent successfully',
        vendor_name: vendor.business_name
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in contact vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}