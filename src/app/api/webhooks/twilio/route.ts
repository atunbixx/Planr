import { NextRequest, NextResponse } from 'next/server';
import { smsService } from '@/lib/messaging/sms-service';
import { supabase } from '@/lib/supabase';

// Twilio webhook for message status updates
export async function POST(request: NextRequest) {
  try {
    // Parse the form-encoded body from Twilio
    const formData = await request.formData();
    const payload: any = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    const { 
      MessageSid, 
      MessageStatus, 
      From, 
      To, 
      ErrorCode, 
      ErrorMessage,
      Body // For incoming messages
    } = payload;

    console.log('Twilio webhook received:', { MessageSid, MessageStatus, From, To });

    // Handle incoming messages
    if (Body && !MessageStatus) {
      await smsService.handleIncomingMessage(payload);
      return NextResponse.json({ success: true });
    }

    // Handle status updates
    if (MessageStatus && MessageSid) {
      await smsService.handleWebhook(payload);

      // Update message log in database
      const statusMap: Record<string, string> = {
        'sent': 'sent',
        'delivered': 'delivered',
        'failed': 'failed',
        'undelivered': 'failed'
      };

      const dbStatus = statusMap[MessageStatus] || MessageStatus;

      const updateData: any = {
        status: dbStatus,
        updated_at: new Date().toISOString()
      };

      if (MessageStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      if (ErrorCode || ErrorMessage) {
        updateData.error_message = `${ErrorCode}: ${ErrorMessage}`;
      }

      const { error } = await supabase
        .from('message_logs')
        .update(updateData)
        .eq('external_id', MessageSid);

      if (error) {
        console.error('Error updating message log:', error);
      }
    }

    // Twilio expects a 200 OK response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Twilio webhook error:', error);
    // Still return 200 to prevent Twilio from retrying
    return NextResponse.json({ success: false });
  }
}