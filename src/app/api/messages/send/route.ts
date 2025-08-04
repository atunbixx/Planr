import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { messagingService } from '@/lib/messaging/messaging-service';
import type { SendMessageRequest, MessageRecipient } from '@/lib/messaging/types';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get couple ID
    const { data: couple, error: coupleError } = await supabase
      .from('wedding_couples')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      recipientIds, 
      recipientType, // 'guest' or 'vendor'
      messageType, // 'email', 'sms', 'whatsapp'
      templateId,
      customSubject,
      customBody,
      variables,
      scheduledFor
    } = body;

    // Fetch recipients based on type
    let recipients: MessageRecipient[] = [];

    if (recipientType === 'guest') {
      const { data: guests, error: guestsError } = await supabase
        .from('wedding_guests')
        .select('id, name, email, phone')
        .eq('couple_id', couple.id)
        .in('id', recipientIds);

      if (guestsError) {
        return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 });
      }

      recipients = guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        preferredChannel: messageType
      }));
    } else if (recipientType === 'vendor') {
      const { data: vendors, error: vendorsError } = await supabase
        .from('couple_vendors')
        .select('id, name, business_name, email, phone')
        .eq('couple_id', couple.id)
        .in('id', recipientIds);

      if (vendorsError) {
        return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
      }

      recipients = vendors.map(vendor => ({
        id: vendor.id,
        name: vendor.business_name || vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        preferredChannel: messageType
      }));
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipients found' }, { status: 400 });
    }

    // Fetch template if provided
    let template = null;
    if (templateId) {
      const { data: templateData, error: templateError } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      template = templateData;
    }

    // If scheduled for future, save to scheduled_messages table
    if (scheduledFor && new Date(scheduledFor) > new Date()) {
      const scheduledMessages = recipients.map(recipient => ({
        couple_id: couple.id,
        recipient_id: recipient.id,
        recipient_email: recipient.email,
        recipient_phone: recipient.phone,
        message_type: messageType,
        template_id: templateId,
        subject: customSubject || template?.subject,
        body: customBody || template?.body || '',
        variables: variables || {},
        scheduled_for: scheduledFor
      }));

      const { error: scheduleError } = await supabase
        .from('scheduled_messages')
        .insert(scheduledMessages);

      if (scheduleError) {
        console.error('Schedule error:', scheduleError);
        return NextResponse.json({ error: 'Failed to schedule messages' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        scheduled: true,
        count: recipients.length,
        scheduledFor 
      });
    }

    // Send messages immediately
    const results = [];
    for (const recipient of recipients) {
      try {
        const messageRequest: SendMessageRequest = {
          to: recipient,
          type: messageType,
          subject: customSubject || template?.subject,
          body: customBody || template?.body || '',
          template: template ? {
            id: template.id,
            name: template.name,
            type: template.type,
            subject: template.subject,
            body: template.body,
            variables: template.variables || []
          } : undefined,
          variables: variables?.[recipient.id] || variables || {}
        };

        const status = await messagingService.sendMessage(messageRequest);
        
        // Log the message
        await messagingService.logMessage(
          couple.id,
          recipient,
          messageType,
          customSubject || template?.subject,
          customBody || template?.body || '',
          status,
          templateId
        );

        results.push({
          recipientId: recipient.id,
          recipientName: recipient.name,
          status: status.status,
          messageId: status.messageId,
          error: status.error
        });
      } catch (error) {
        console.error(`Failed to send to ${recipient.name}:`, error);
        results.push({
          recipientId: recipient.id,
          recipientName: recipient.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({ 
      success: true,
      totalRecipients: recipients.length,
      successCount,
      failedCount,
      results
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send messages' },
      { status: 500 }
    );
  }
}