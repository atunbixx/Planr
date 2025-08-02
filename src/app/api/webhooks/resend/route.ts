import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { headers } from 'next/headers';

// Initialize Supabase client with service role key
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

interface ResendWebhookPayload {
  type: 'email.sent' | 'email.delivered' | 'email.complained' | 'email.bounced' | 'email.received';
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
    attachments?: Array<{
      filename: string;
      content: string; // base64 encoded
      content_type: string;
      size: number;
    }>;
    // For received emails
    envelope?: {
      from: string;
      to: string[];
    };
    in_reply_to?: string;
    message_id?: string;
  };
}

// Rate limiting
const RATE_LIMIT_WINDOW = 10 * 1000; // 10 seconds
const RATE_LIMIT_MAX_MESSAGES = 1;
const emailRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const webhookSignature = headersList.get('resend-signature');
    const webhookTimestamp = headersList.get('resend-timestamp');
    const webhookId = headersList.get('resend-id');

    const body = await request.text();
    const payload: ResendWebhookPayload = JSON.parse(body);

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && webhookSignature && webhookTimestamp) {
      const signingSecret = process.env.RESEND_WEBHOOK_SECRET!;
      const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
      const expectedSignature = crypto
        .createHmac('sha256', signingSecret)
        .update(signedContent)
        .digest('hex');

      if (webhookSignature !== `v1=${expectedSignature}`) {
        console.error('Invalid Resend webhook signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check timestamp to prevent replay attacks (5 minutes)
      const timestamp = parseInt(webhookTimestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime - timestamp > 300) {
        console.error('Webhook timestamp too old');
        return NextResponse.json({ error: 'Timestamp expired' }, { status: 401 });
      }
    }

    // Only process received emails (vendor replies)
    if (payload.type !== 'email.received') {
      return NextResponse.json({ message: 'Webhook type not processed' }, { status: 200 });
    }

    const { data } = payload;
    const fromEmail = data.from || data.envelope?.from;
    const emailContent = data.text || data.html || '';
    const subject = data.subject || '';

    if (!fromEmail || !emailContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Clean and normalize email
    const vendorEmail = fromEmail.toLowerCase().trim();

    // Rate limiting
    const now = Date.now();
    const rateLimit = emailRateLimitMap.get(vendorEmail);
    
    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= RATE_LIMIT_MAX_MESSAGES) {
          return NextResponse.json({ 
            message: 'Rate limit exceeded' 
          }, { status: 429 });
        }
        rateLimit.count++;
      } else {
        emailRateLimitMap.set(vendorEmail, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      emailRateLimitMap.set(vendorEmail, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Find vendor by email
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, phone')
      .eq('email', vendorEmail)
      .single();

    if (vendorError || !vendor) {
      console.error('Vendor not found for email:', vendorEmail);
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Extract conversation ID from subject or email body
    let conversationId: string | null = null;
    let cleanContent = emailContent;
    
    // Check subject for conversation ID [#conv123]
    const subjectMatch = subject.match(/\[#conv(\w+)\]/);
    if (subjectMatch) {
      conversationId = subjectMatch[1];
    }
    
    // Also check body for conversation ID
    if (!conversationId) {
      const bodyMatch = emailContent.match(/\[#conv(\w+)\]/);
      if (bodyMatch) {
        conversationId = bodyMatch[1];
        cleanContent = emailContent.replace(/\[#conv\w+\]\s*/, '');
      }
    }

    // Clean email content (remove signatures, quoted text, etc.)
    cleanContent = cleanEmailContent(cleanContent);

    // Find conversation
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

    // Process attachments
    const attachments = [];
    if (data.attachments && data.attachments.length > 0) {
      for (const attachment of data.attachments) {
        const uploadedUrl = await uploadEmailAttachment(
          attachment,
          vendor.id
        );
        if (uploadedUrl) {
          attachments.push({
            url: uploadedUrl,
            type: attachment.content_type,
            filename: attachment.filename,
            size: attachment.size
          });
        }
      }
    }

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('vendor_messages')
      .insert({
        vendor_id: conversation.vendor_id,
        couple_id: conversation.couple_id,
        thread_id: conversation.id,
        sender_type: 'vendor',
        sender_name: vendor.name,
        message_type: attachments.length > 0 ? 'document' : 'text',
        content: cleanContent,
        attachments: attachments,
        metadata: {
          source: 'email',
          email_id: data.email_id,
          message_id: data.message_id,
          in_reply_to: data.in_reply_to,
          vendor_email: vendorEmail,
          original_subject: subject
        }
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Store attachments in message_media table
    if (attachments.length > 0 && message) {
      const mediaRecords = attachments.map((attachment, index) => ({
        message_id: message.id,
        media_type: getMediaTypeFromMime(attachment.type),
        file_name: attachment.filename,
        file_size: attachment.size,
        mime_type: attachment.type,
        storage_path: attachment.url,
        display_order: index
      }));

      await supabase.from('message_media').insert(mediaRecords);
    }

    console.log('Resend webhook processed successfully:', {
      vendor: vendor.id,
      conversation: conversation.id,
      message: message?.id,
      attachments: attachments.length
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Resend webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function uploadEmailAttachment(
  attachment: {
    filename: string;
    content: string;
    content_type: string;
    size: number;
  },
  vendorId: string
): Promise<string | null> {
  try {
    // Decode base64 content
    const buffer = Buffer.from(attachment.content, 'base64');
    
    // Generate safe filename
    const safeFilename = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `messages/${vendorId}/${Date.now()}_${safeFilename}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(path, buffer, {
        contentType: attachment.content_type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('attachments')
      .getPublicUrl(path);

    return publicUrl;
  } catch (error) {
    console.error('Error processing attachment:', error);
    return null;
  }
}

function cleanEmailContent(content: string): string {
  // Remove email signatures
  content = content.split(/^--\s*$/m)[0];
  content = content.split(/^Sent from my/m)[0];
  
  // Remove quoted text (lines starting with >)
  const lines = content.split('\n');
  const cleanLines = [];
  let inQuote = false;
  
  for (const line of lines) {
    if (line.trim().startsWith('>')) {
      inQuote = true;
    } else if (line.trim() === '' && inQuote) {
      // Empty line might end quote
      continue;
    } else if (!line.trim().startsWith('>') && !inQuote) {
      cleanLines.push(line);
    }
  }
  
  content = cleanLines.join('\n').trim();
  
  // Remove common email footers
  content = content.replace(/^On .+ wrote:$/m, '');
  content = content.replace(/^From: .+$/m, '');
  content = content.replace(/^To: .+$/m, '');
  content = content.replace(/^Subject: .+$/m, '');
  content = content.replace(/^Date: .+$/m, '');
  
  // Remove multiple newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  return content.trim();
}

function getMediaTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  return 'document';
}