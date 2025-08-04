import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { messagingService } from '@/lib/messaging/messaging-service';
import type { MessageRecipient } from '@/lib/messaging/types';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageType, testRecipient, subject, body: messageBody } = body;

    // Validate input
    if (!messageType || !testRecipient || !messageBody) {
      return NextResponse.json(
        { error: 'Message type, recipient, and body are required' },
        { status: 400 }
      );
    }

    // Create test recipient object
    const recipient: MessageRecipient = {
      id: 'test',
      name: 'Test Recipient',
      preferredChannel: messageType,
    };

    if (messageType === 'email') {
      if (!testRecipient.includes('@')) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        );
      }
      recipient.email = testRecipient;
    } else {
      recipient.phone = testRecipient;
    }

    // Send test message
    const status = await messagingService.sendMessage({
      to: recipient,
      type: messageType,
      subject: messageType === 'email' ? subject : undefined,
      body: messageBody,
    });

    return NextResponse.json({
      success: status.status === 'sent',
      status: status.status,
      messageId: status.messageId,
      error: status.error,
    });
  } catch (error) {
    console.error('Test message error:', error);
    return NextResponse.json(
      { error: 'Failed to send test message' },
      { status: 500 }
    );
  }
}