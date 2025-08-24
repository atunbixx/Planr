import { NextRequest } from 'next/server'
import { MessagingHandler } from '@/features/messaging/handlers/messaging.handler'

// Initialize handler
const messagingHandler = new MessagingHandler()

/**
 * GET /api/messages/pricing?channel=email&country=NG
 * Get pricing for a specific channel and country
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  return messagingHandler.getPricing(request)
}