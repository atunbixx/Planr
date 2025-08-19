import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function handler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return seatingHandler.assign(request as any, userId)
}

export const POST = requireOnboarding(handler)
