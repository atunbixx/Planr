import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { headers } from 'next/headers';

// Initialize Supabase client with service role key for webhook operations
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

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds
const RATE_LIMIT_MAX_MESSAGES = 1;
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface TwilioWebhookBody {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaUrl1?: string;
  MediaUrl2?: string;
  MediaUrl3?: string;
  MediaUrl4?: string;
  MediaContentType0?: string;
  MediaContentType1?: string;
  MediaContentType2?: string;
  MediaContentType3?: string;
  MediaContentType4?: string;
  // WhatsApp specific
  ProfileName?: string;
  WaId?: string;
  // SMS specific
  FromCity?: string;
  FromState?: string;
  FromCountry?: string;
}

interface MediaAttachment {
  url: string;
  type: string;
  filename?: string;
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const twilioSignature = headersList.get('x-twilio-signature');
    
    // Get request body
    const formData = await request.formData();
    const body: Partial<TwilioWebhookBody> = {};
    
    formData.forEach((value, key) => {
      body[key as keyof TwilioWebhookBody] = value.toString();
    });

    // Verify Twilio webhook signature
    if (process.env.NODE_ENV === 'production' && twilioSignature) {
      const authToken = process.env.TWILIO_AUTH_TOKEN!;
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;
      
      const isValid = twilio.validateRequest(
        authToken,
        twilioSignature,
        webhookUrl,
        body
      );

      if (!isValid) {
        console.error('Invalid Twilio signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { From, Body: messageContent, NumMedia } = body;
    
    if (!From || !messageContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Clean phone number (remove WhatsApp prefix if present)
    const phoneNumber = From.replace('whatsapp:', '').replace(/[^\d+]/g, '');
    
    // Rate limiting check
    const rateLimitKey = phoneNumber;
    const now = Date.now();
    const rateLimit = rateLimitMap.get(rateLimitKey);
    
    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= RATE_LIMIT_MAX_MESSAGES) {
          // Send rate limit message back
          return NextResponse.json({ 
            message: 'Rate limit exceeded. Please wait 10 seconds between messages.' 
          }, { status: 429 });
        }
        rateLimit.count++;
      } else {
        // Reset rate limit window
        rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Find vendor by phone number
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, email')
      .eq('phone', phoneNumber)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor not found for phone:', phoneNumber);
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Extract conversation ID from message if present (format: [#conv123] at start of message)
    const conversationMatch = messageContent.match(/^\[#conv(\w+)\]\s*/);
    let conversationId: string | null = null;
    let cleanMessage = messageContent;
    
    if (conversationMatch) {
      conversationId = conversationMatch[1];
      cleanMessage = messageContent.replace(conversationMatch[0], '');
    }

    // Find the most recent conversation with this vendor if no ID provided
    let conversation;
    if (conversationId) {
      const { data, error } = await supabase
        .from('message_threads')
        .select('id, couple_id, vendor_id')
        .eq('id', conversationId)
        .eq('vendor_id', vendor.id)
        .single();
      
      if (!error && data) {
        conversation = data;
      }
    }
    
    if (!conversation) {
      // Get the most recent open conversation
      const { data, error } = await supabase
        .from('message_threads')
        .select('id, couple_id, vendor_id')
        .eq('vendor_id', vendor.id)
        .eq('status', 'open')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        conversation = data;
      }
    }

    if (!conversation) {
      console.error('No active conversation found for vendor:', vendor.id);
      return NextResponse.json({ error: 'No active conversation found' }, { status: 404 });
    }

    // Process media attachments if any
    const attachments: MediaAttachment[] = [];
    if (NumMedia && parseInt(NumMedia) > 0) {
      for (let i = 0; i < parseInt(NumMedia) && i < 5; i++) {
        const mediaUrl = body[`MediaUrl${i}` as keyof TwilioWebhookBody];
        const mediaType = body[`MediaContentType${i}` as keyof TwilioWebhookBody];
        
        if (mediaUrl && mediaType) {
          // Download and upload to Supabase storage
          const uploadedUrl = await uploadMediaToStorage(mediaUrl, mediaType, vendor.id);
          if (uploadedUrl) {
            attachments.push({
              url: uploadedUrl,
              type: mediaType,
              filename: `attachment_${i + 1}`
            });
          }
        }
      }
    }

    // Create the message in the database
    const { data: message, error: messageError } = await supabase
      .from('vendor_messages')
      .insert({
        vendor_id: conversation.vendor_id,
        couple_id: conversation.couple_id,
        thread_id: conversation.id,
        sender_type: 'vendor',
        sender_name: vendor.name,
        message_type: attachments.length > 0 ? 'document' : 'text',
        content: cleanMessage,
        attachments: attachments,
        metadata: {
          source: From.includes('whatsapp:') ? 'whatsapp' : 'sms',
          twilio_message_sid: body.MessageSid,
          vendor_phone: phoneNumber,
          profile_name: body.ProfileName
        }
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Store media attachments in separate table
    if (attachments.length > 0 && message) {
      const mediaRecords = attachments.map((attachment, index) => ({
        message_id: message.id,
        media_type: getMediaType(attachment.type),
        file_name: attachment.filename || `attachment_${index + 1}`,
        file_size: 0, // We'd need to fetch this
        mime_type: attachment.type,
        storage_path: attachment.url,
        display_order: index
      }));

      await supabase.from('message_media').insert(mediaRecords);
    }

    // Log the successful webhook processing
    console.log('Twilio webhook processed successfully:', {
      vendor: vendor.id,
      conversation: conversation.id,
      message: message?.id,
      source: From.includes('whatsapp:') ? 'whatsapp' : 'sms'
    });

    // Return TwiML response (empty to acknowledge receipt)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'text/xml',
        },
      }
    );

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function uploadMediaToStorage(
  mediaUrl: string, 
  mimeType: string, 
  vendorId: string
): Promise<string | null> {
  try {
    // Download media from Twilio
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`
      }
    });

    if (!response.ok) {
      console.error('Failed to download media from Twilio');
      return null;
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate filename
    const extension = mimeType.split('/')[1] || 'bin';
    const filename = `vendor_${vendorId}_${Date.now()}.${extension}`;
    const path = `messages/${vendorId}/${filename}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.error('Error uploading to storage:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(path);

    return publicUrl;
  } catch (error) {
    console.error('Error processing media:', error);
    return null;
  }
}

function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  return 'document';
}