import { NextRequest } from 'next/server'
import { RSVPHandler } from '@/features/rsvp/handlers/rsvp.handler'

// Initialize handler
const rsvpHandler = new RSVPHandler()

/**
 * GET /api/rsvp/health
 * Health check for RSVP service
 * Public endpoint for monitoring
 */
export async function GET(request: NextRequest) {
  return rsvpHandler.healthCheck(request)
}