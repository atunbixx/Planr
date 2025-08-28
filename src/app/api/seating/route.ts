import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  // Returns { success: true, data: { tables, stats } }
  return await seatingHandler.getSeatingChart(request, userId)
}

async function postHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  // Create a new table
  return await seatingHandler.createTable(request, userId)
}

export const GET = requireOnboarding(getHandler)
export const POST = requireOnboarding(postHandler)

