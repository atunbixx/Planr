import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return seatingHandler.list(request as any, userId)
}

async function postHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return seatingHandler.create(request as any, userId)
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)
