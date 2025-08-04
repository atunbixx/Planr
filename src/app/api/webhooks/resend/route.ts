import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/messaging/email-service';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Verify webhook signature from Resend
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('webhook-signature');
    const rawBody = await request.text();
    
    // Verify signature if webhook secret is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { type, data } = payload;

    console.log('Resend webhook received:', { type, emailId: data.email_id });

    // Handle webhook event
    await emailService.handleWebhook(payload, signature || undefined);

    // Update message log in database based on event type
    if (data.email_id) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      switch (type) {
        case 'email.sent':
          updateData.status = 'sent';
          updateData.sent_at = new Date().toISOString();
          break;
        case 'email.delivered':
          updateData.status = 'delivered';
          updateData.delivered_at = new Date().toISOString();
          break;
        case 'email.bounced':
          updateData.status = 'bounced';
          updateData.error_message = data.bounce?.message || 'Email bounced';
          break;
        case 'email.complained':
          updateData.status = 'complained';
          updateData.error_message = 'Recipient marked as spam';
          break;
        case 'email.opened':
          updateData.opened_at = new Date().toISOString();
          break;
        case 'email.clicked':
          updateData.clicked_at = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('message_logs')
        .update(updateData)
        .eq('external_id', data.email_id);

      if (error) {
        console.error('Error updating message log:', error);
      }

      // Handle unsubscribe for complaints
      if (type === 'email.complained' && data.to) {
        const { error: prefError } = await supabase
          .from('message_preferences')
          .update({
            email_opt_in: false,
            unsubscribed: true,
            unsubscribed_at: new Date().toISOString()
          })
          .eq('entity_type', 'guest')
          .or(`entity_type.eq.vendor`)
          .ilike('email', data.to[0]);

        if (prefError) {
          console.error('Error updating preferences:', prefError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend webhook error:', error);
    // Still return 200 to prevent Resend from retrying
    return NextResponse.json({ success: false });
  }
}