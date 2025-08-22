import { NextRequest } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { TaskHandler } from '@/features/tasks/api/task.handler'

const taskHandler = new TaskHandler()

async function patchHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return await taskHandler.bulkUpdate(request, userId)
}

export const PATCH = requireOnboarding(patchHandler)