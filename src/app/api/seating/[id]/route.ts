import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { SeatingHandler } from '@/features/seating/api/seating.handler'

const seatingHandler = new SeatingHandler()

async function putHandler(request: AuthenticatedRequest, id: string) {
  const userId = request.user!.id
  return seatingHandler.update(request as any, userId, id)
}

async function deleteHandler(request: AuthenticatedRequest, id: string) {
  const userId = request.user!.id
  return seatingHandler.delete(request as any, userId, id)
}

export const PUT = requireOnboarding(async (request: AuthenticatedRequest) => {
  const id = request.url.split('/').pop()!
  return putHandler(request, id)
})
export const DELETE = requireOnboarding(async (request: AuthenticatedRequest) => {
  const id = request.url.split('/').pop()!
  return deleteHandler(request, id)
})
