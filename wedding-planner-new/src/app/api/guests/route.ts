import { NextRequest, NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { GuestHandler } from '@/features/guests/api/guest.handler'

const guestHandler = new GuestHandler()

// GET /api/guests - List all guests for the authenticated couple
async function getHandler(request: AuthenticatedRequest) {
  // Use user ID as couple ID for now (will be properly mapped with couple relationship)
  const coupleId = request.user!.id
  return guestHandler.getGuests(request, coupleId)
}

// POST /api/guests - Create a new guest
async function postHandler(request: AuthenticatedRequest) {
  // Use user ID as couple ID for now (will be properly mapped with couple relationship)  
  const coupleId = request.user!.id
  return guestHandler.createGuest(request, coupleId)
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)