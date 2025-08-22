import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return await seatingHandler.getSeatingChart(request, userId)
}

export const GET = requireOnboarding(getHandler)
