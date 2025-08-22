import { NextRequest } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { TaskHandler } from '@/features/tasks/api/task.handler'

const taskHandler = new TaskHandler()

async function getHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return await taskHandler.getStats(request, userId)
}

export const GET = requireOnboarding(getHandler)