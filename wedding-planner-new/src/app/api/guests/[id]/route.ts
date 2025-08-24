import { NextRequest, NextResponse } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { GuestHandler } from '@/features/guests/api/guest.handler'

const guestHandler = new GuestHandler()

// GET /api/guests/[id] - Get a specific guest
async function getHandler(request: AuthenticatedRequest, guestId: string) {
  return guestHandler.getGuest(guestId)
}

// PUT /api/guests/[id] - Update a guest
async function putHandler(request: AuthenticatedRequest, guestId: string) {
  return guestHandler.updateGuest(request, guestId)
}

// DELETE /api/guests/[id] - Delete a guest
async function deleteHandler(request: AuthenticatedRequest, guestId: string) {
  return guestHandler.deleteGuest(guestId)
}

export const GET = requireOnboarding(async (request: AuthenticatedRequest) => {
  const guestId = request.url.split('/').pop()!
  return getHandler(request, guestId)
})

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const guestId = request.url.split('/').pop()!
  return putHandler(request, guestId)
})

export const DELETE = requireOnboarding(async (request: AuthenticatedRequest) => {
  const guestId = request.url.split('/').pop()!
  return deleteHandler(request, guestId)
})