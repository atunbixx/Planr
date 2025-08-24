import { NextRequest } from 'next/server'
import { MessagingHandler } from '@/features/messaging/handlers/messaging.handler'

// Initialize handler
const messagingHandler = new MessagingHandler()

/**
 * GET /api/messages/status?messageId=xxx&providerMessageId=xxx&provider=xxx
 * Get message delivery status
 * Requires authentication (user must own the message)
 */
export async function GET(request: NextRequest) {
  return messagingHandler.getDeliveryStatus(request)
}