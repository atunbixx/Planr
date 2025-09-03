import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { NotificationHandler } from '@/features/notifications/api/notification.handler'

const handler = new NotificationHandler()

async function postHandler(request: AuthenticatedRequest, { params }: { params: { id: string } }) {
  const userId = request.user!.id
  return handler.markRead(request, userId, params.id)
}

export const POST = requireOnboarding(postHandler)

