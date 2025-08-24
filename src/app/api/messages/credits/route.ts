import { NextRequest } from 'next/server'
import { MessagingHandler } from '@/features/messaging/handlers/messaging.handler'

// Initialize handler
const messagingHandler = new MessagingHandler()

/**
 * GET /api/messages/credits
 * Get user credit balance
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  return messagingHandler.getCreditBalance(request)
}