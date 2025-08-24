import { NextRequest } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function postHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return await seatingHandler.createTable(request, userId)
}

export const POST = requireOnboarding(postHandler)