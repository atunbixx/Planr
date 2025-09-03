import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { NotificationHandler } from '@/features/notifications/api/notification.handler'

const handler = new NotificationHandler()

async function postHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return handler.markAllRead(request, userId)
}

export const POST = requireOnboarding(postHandler)

