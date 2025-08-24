import { NextRequest } from 'next/server'
import { RSVPHandler } from '@/features/rsvp/handlers/rsvp.handler'

// Initialize handler
const rsvpHandler = new RSVPHandler()

/**
 * GET /api/rsvp/validate?token=xxx
 * Validate an invite token
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  return rsvpHandler.validateInvite(request)
}