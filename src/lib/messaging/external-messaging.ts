import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { Resend } from 'resend';

// Initialize services
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface SendMessageOptions {
  vendorId: string;
  coupleId: string;
  conversationId: string;
  message: string;
  coupleName: string;
  mediaUrls?: string[];
  method?: 'sms' | 'whatsapp' | 'email' | 'all';
}

interface MessageTemplate {
  sms: string;
  whatsapp: string;
  email: {
    subject: string;
    body: string;
  };
}

export async function sendMessageToVendor(options: SendMessageOptions) {
  const {
    vendorId,
    coupleId,
    conversationId,
    message,
    coupleName,
    mediaUrls = [],
    method = 'all'
  } = options;

  try {
    // Get vendor contact details
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('name, email, phone, business_name')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      throw new Error('Vendor not found');
    }

    // Get vendor preferences
    const { data: vendorPrefs } = await supabase
      .from('couple_vendors')
      .select('preferred_contact_method')
      .eq('vendor_id', vendorId)
      .eq('couple_id', coupleId)
      .single();

    const preferredMethod = vendorPrefs?.preferred_contact_method || 'all';
    const finalMethod = method === 'all' ? preferredMethod : method;

    // Generate message templates with conversation ID
    const templates = generateMessageTemplates({
      vendorName: vendor.name,
      coupleName,
      message,
      conversationId,
      mediaUrls
    });

    const results = {
      sms: false,
      whatsapp: false,
      email: false,
      errors: [] as string[]
    };

    // Send via SMS
    if ((finalMethod === 'all' || finalMethod === 'phone') && vendor.phone) {
      try {
        await sendSMS(vendor.phone, templates.sms, mediaUrls);
        results.sms = true;
      } catch (error) {
        console.error('SMS send error:', error);
        results.errors.push(`SMS failed: ${error}`);
      }
    }

    // Send via WhatsApp
    if ((finalMethod === 'all' || finalMethod === 'phone') && vendor.phone) {
      try {
        await sendWhatsApp(vendor.phone, templates.whatsapp, mediaUrls);
        results.whatsapp = true;
      } catch (error) {
        console.error('WhatsApp send error:', error);
        results.errors.push(`WhatsApp failed: ${error}`);
      }
    }

    // Send via Email
    if ((finalMethod === 'all' || finalMethod === 'email') && vendor.email) {
      try {
        await sendEmail(
          vendor.email,
          vendor.name,
          templates.email.subject,
          templates.email.body,
          mediaUrls
        );
        results.email = true;
      } catch (error) {
        console.error('Email send error:', error);
        results.errors.push(`Email failed: ${error}`);
      }
    }

    // Log outbound message
    await supabase.from('outbound_message_log').insert({
      vendor_id: vendorId,
      couple_id: coupleId,
      conversation_id: conversationId,
      message_content: message,
      sms_sent: results.sms,
      whatsapp_sent: results.whatsapp,
      email_sent: results.email,
      errors: results.errors,
      metadata: {
        vendor_name: vendor.name,
        couple_name: coupleName,
        media_count: mediaUrls.length
      }
    });

    return results;

  } catch (error) {
    console.error('External messaging error:', error);
    throw error;
  }
}

async function sendSMS(phoneNumber: string, message: string, mediaUrls: string[] = []) {
  const messageData: any = {
    body: message,
    to: phoneNumber,
    from: process.env.TWILIO_PHONE_NUMBER!
  };

  // Add media URLs for MMS
  if (mediaUrls.length > 0) {
    messageData.mediaUrl = mediaUrls.slice(0, 5); // Twilio supports max 5 media items
  }

  const result = await twilioClient.messages.create(messageData);
  return result.sid;
}

async function sendWhatsApp(phoneNumber: string, message: string, mediaUrls: string[] = []) {
  // Ensure phone number has WhatsApp prefix
  const whatsappNumber = phoneNumber.startsWith('whatsapp:') 
    ? phoneNumber 
    : `whatsapp:${phoneNumber}`;

  const messageData: any = {
    body: message,
    to: whatsappNumber,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`
  };

  // Add media URLs
  if (mediaUrls.length > 0) {
    messageData.mediaUrl = mediaUrls.slice(0, 5);
  }

  const result = await twilioClient.messages.create(messageData);
  return result.sid;
}

async function sendEmail(
  toEmail: string,
  vendorName: string,
  subject: string,
  htmlBody: string,
  attachmentUrls: string[] = []
) {
  // Convert attachment URLs to email attachments
  const attachments = [];
  for (const url of attachmentUrls.slice(0, 10)) { // Limit to 10 attachments
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const filename = url.split('/').pop() || 'attachment';
        
        attachments.push({
          filename,
          content: Buffer.from(buffer).toString('base64')
        });
      }
    } catch (error) {
      console.error('Error fetching attachment:', error);
    }
  }

  const result = await resend.emails.send({
    from: `${process.env.WEDDING_PLANNER_NAME} <${process.env.WEDDING_PLANNER_EMAIL}>`,
    to: toEmail,
    subject: subject,
    html: htmlBody,
    attachments: attachments.length > 0 ? attachments : undefined,
    reply_to: process.env.WEDDING_PLANNER_REPLY_EMAIL,
    headers: {
      'X-Entity-Ref-ID': Math.random().toString(36).substring(7),
    }
  });

  return result.data?.id;
}

function generateMessageTemplates(params: {
  vendorName: string;
  coupleName: string;
  message: string;
  conversationId: string;
  mediaUrls: string[];
}): MessageTemplate {
  const { vendorName, coupleName, message, conversationId, mediaUrls } = params;
  
  // Add conversation ID to help with reply routing
  const conversationTag = `[#conv${conversationId}]`;
  
  return {
    sms: `${conversationTag} New message from ${coupleName}:\n\n${message}${mediaUrls.length > 0 ? `\n\n${mediaUrls.length} attachment(s) included` : ''}\n\nReply to this message to respond.`,
    
    whatsapp: `${conversationTag} 💌 *New message from ${coupleName}*\n\n${message}${mediaUrls.length > 0 ? `\n\n📎 ${mediaUrls.length} attachment(s) included` : ''}\n\n_Reply to this message to respond directly._`,
    
    email: {
      subject: `${conversationTag} New message from ${coupleName} - Wedding Planning`,
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .message { background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
            .footer { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; font-size: 14px; }
            .conv-id { color: #666; font-size: 12px; }
            .attachments { margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Message from ${coupleName}</h2>
              <p class="conv-id">Conversation ID: ${conversationTag}</p>
            </div>
            
            <div class="message">
              <p>Hi ${vendorName},</p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              ${mediaUrls.length > 0 ? `
                <div class="attachments">
                  <strong>📎 Attachments (${mediaUrls.length}):</strong>
                  <ul>
                    ${mediaUrls.map((url, i) => `<li><a href="${url}">Attachment ${i + 1}</a></li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p><strong>How to Reply:</strong></p>
              <p>Simply reply to this email and your message will be delivered to ${coupleName}.</p>
              <p style="color: #666; font-size: 12px; margin-top: 10px;">
                Please keep the conversation ID ${conversationTag} in your reply to ensure proper delivery.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }
  };
}

// Function to send notification to couple when vendor replies
export async function notifyBrideOfVendorReply(params: {
  coupleId: string;
  vendorName: string;
  messagePreview: string;
  conversationId: string;
}) {
  const { coupleId, vendorName, messagePreview, conversationId } = params;
  
  try {
    // Get couple's notification preferences
    const { data: couple } = await supabase
      .from('couples')
      .select('partner1_user_id, partner2_user_id')
      .eq('id', coupleId)
      .single();

    if (!couple) return;

    // Get user emails for notification
    const userIds = [couple.partner1_user_id, couple.partner2_user_id].filter(Boolean);
    
    const { data: users } = await supabase
      .from('auth.users')
      .select('email, raw_user_meta_data')
      .in('id', userIds);

    if (!users || users.length === 0) return;

    // Send email notifications to both partners
    for (const user of users) {
      if (user.email) {
        await resend.emails.send({
          from: `${process.env.WEDDING_PLANNER_NAME} <${process.env.WEDDING_PLANNER_EMAIL}>`,
          to: user.email,
          subject: `New message from ${vendorName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h3>You have a new message from ${vendorName}</h3>
              <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;">${messagePreview}</p>
              </div>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages/${conversationId}" 
                   style="background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Message
                </a>
              </p>
            </div>
          `
        });
      }
    }
  } catch (error) {
    console.error('Error notifying bride:', error);
  }
}