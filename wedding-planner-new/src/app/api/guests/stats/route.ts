import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { GuestHandler } from '@/features/guests/api/guest.handler'

const handler = new GuestHandler()

export const GET = requireOnboarding(async (request: AuthenticatedRequest) => {
  const coupleId = request.user!.id
  return handler.getGuestStats(coupleId)
})

