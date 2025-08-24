import { NextRequest } from 'next/server'
import { MessagingHandler } from '@/features/messaging/handlers/messaging.handler'

// Initialize handler
const messagingHandler = new MessagingHandler()

/**
 * GET /api/messages/health
 * Health check for messaging service
 * Public endpoint for monitoring
 */
export async function GET(request: NextRequest) {
  return messagingHandler.healthCheck(request)
}