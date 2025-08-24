import { NextRequest } from 'next/server'
import { MessagingHandler } from '@/features/messaging/handlers/messaging.handler'

// Initialize handler
const messagingHandler = new MessagingHandler()

/**
 * POST /api/messages/send
 * Send a single message
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  return messagingHandler.sendMessage(request)
}