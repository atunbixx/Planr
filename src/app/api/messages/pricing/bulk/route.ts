import { NextRequest } from 'next/server'
import { MessagingHandler } from '@/features/messaging/handlers/messaging.handler'

// Initialize handler
const messagingHandler = new MessagingHandler()

/**
 * POST /api/messages/pricing/bulk
 * Calculate pricing for multiple messages
 * Public endpoint - no authentication required
 */
export async function POST(request: NextRequest) {
  return messagingHandler.getBulkPricing(request)
}