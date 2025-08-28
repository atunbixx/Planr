import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function postHandler(request: AuthenticatedRequest) {
  const url = new URL(request.url)
  const tableId = url.pathname.split('/').slice(-2, -1)[0]!
  return await seatingHandler.createSeatsForTable(request, tableId)
}

export const POST = requireOnboarding(postHandler)

