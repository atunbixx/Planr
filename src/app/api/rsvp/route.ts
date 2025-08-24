import { NextRequest } from 'next/server'
import { RSVPHandler } from '@/features/rsvp/handlers/rsvp.handler'

// Initialize handler
const rsvpHandler = new RSVPHandler()

/**
 * POST /api/rsvp
 * Submit an RSVP response
 */
export async function POST(request: NextRequest) {
  return rsvpHandler.submitRSVP(request)
}

/**
 * GET /api/rsvp?inviteId=xxx
 * Check existing RSVP for an invite
 */
export async function GET(request: NextRequest) {
  return rsvpHandler.checkRSVP(request)
}