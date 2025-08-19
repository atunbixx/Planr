import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { GuestHandler } from '@/features/guests/api/guest.handler'

const handler = new GuestHandler()

export const POST = requireOnboarding(async (request: AuthenticatedRequest) => {
  const coupleId = request.user!.id
  return handler.bulkUpdate(request as any, coupleId)
})

