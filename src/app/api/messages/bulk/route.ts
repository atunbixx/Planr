import { NextRequest } from 'next/server'
import { MessagingHandler } from '@/features/messaging/handlers/messaging.handler'

// Initialize handler
const messagingHandler = new MessagingHandler()

/**
 * POST /api/messages/bulk
 * Send multiple messages in batch
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  return messagingHandler.sendBulkMessages(request)
}