import { NextRequest } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function postHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const seatId = pathParts[pathParts.length - 2] // Get seat ID from path
  return await seatingHandler.assignGuestToSeat(request, seatId)
}

export const POST = requireOnboarding(postHandler)