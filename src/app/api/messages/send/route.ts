import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { sendMessageToVendor } from '@/lib/messaging/external-messaging';
import { getUserFromCookie } from '@/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get authenticated user
    const user = await getUserFromCookie(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vendor_id,
      content,
      thread_id,
      attachments = [],
      send_external = true
    } = body;

    if (!vendor_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get couple information
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('id, partner1_name, partner2_name')
      .or(`partner1_user_id.eq.${user.id},partner2_user_id.eq.${user.id}`)
      .single();

    if (coupleError || !couple) {
      return NextResponse.json({ error: 'Couple not found' }, { status: 404 });
    }

    // Get or create thread
    let threadId = thread_id;
    if (!threadId) {
      // Check for existing thread
      const { data: existingThread } = await supabase
        .from('message_threads')
        .select('id')
        .eq('vendor_id', vendor_id)
        .eq('couple_id', couple.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingThread) {
        threadId = existingThread.id;
      } else {
        // Create new thread
        const { data: newThread, error: threadError } = await supabase
          .from('message_threads')
          .insert({
            vendor_id,
            couple_id: couple.id,
            subject: 'General Inquiry',
            thread_type: 'general',
            status: 'open'
          })
          .select()
          .single();

        if (threadError) {
          console.error('Error creating thread:', threadError);
          return NextResponse.json(
            { error: 'Failed to create conversation thread' },
            { status: 500 }
          );
        }
        threadId = newThread.id;
      }
    }

    // Create the message in the database
    const { data: message, error: messageError } = await supabase
      .from('vendor_messages')
      .insert({
        vendor_id,
        couple_id: couple.id,
        thread_id: threadId,
        sender_type: 'couple',
        sender_id: user.id,
        sender_name: `${couple.partner1_name || ''} ${couple.partner2_name ? '& ' + couple.partner2_name : ''}`.trim(),
        message_type: attachments.length > 0 ? 'document' : 'text',
        content,
        attachments,
        metadata: {
          sent_via: 'web_app',
          external_messaging_enabled: send_external
        }
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      );
    }

    // Handle attachment uploads to message_media table
    if (attachments.length > 0 && message) {
      const mediaRecords = attachments.map((attachment: any, index: number) => ({
        message_id: message.id,
        media_type: attachment.type || 'document',
        file_name: attachment.filename || `attachment_${index + 1}`,
        file_size: attachment.size || 0,
        mime_type: attachment.mime_type || 'application/octet-stream',
        storage_path: attachment.url,
        display_order: index,
        uploaded_by: user.id
      }));

      const { error: mediaError } = await supabase
        .from('message_media')
        .insert(mediaRecords);

      if (mediaError) {
        console.error('Error storing media records:', mediaError);
      }
    }

    // Send external messages if enabled
    if (send_external) {
      try {
        const coupleName = `${couple.partner1_name || ''} ${couple.partner2_name ? '& ' + couple.partner2_name : ''}`.trim();
        const mediaUrls = attachments.map((a: any) => a.url).filter(Boolean);

        const externalResult = await sendMessageToVendor({
          vendorId: vendor_id,
          coupleId: couple.id,
          conversationId: threadId,
          message: content,
          coupleName: coupleName || 'Your client',
          mediaUrls,
          method: 'all'
        });

        // Update message metadata with external send results
        await supabase
          .from('vendor_messages')
          .update({
            metadata: {
              ...message.metadata,
              external_send_results: externalResult
            }
          })
          .eq('id', message.id);

      } catch (externalError) {
        console.error('External messaging error:', externalError);
        // Don't fail the request if external messaging fails
        // The message is already saved in the database
      }
    }

    return NextResponse.json({
      success: true,
      message: message,
      thread_id: threadId
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}