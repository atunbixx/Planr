import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { NotificationHandler } from '@/features/notifications/api/notification.handler'

const handler = new NotificationHandler()

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return handler.list(request, userId)
}

export const GET = requireOnboarding(getHandler)

