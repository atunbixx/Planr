import { NextRequest } from 'next/server'
import { requireOnboarding, AuthenticatedRequest } from '@/lib/auth/middleware'
import { TaskHandler } from '@/features/tasks/api/task.handler'

const taskHandler = new TaskHandler()

async function postHandler(request: AuthenticatedRequest) {
  const userId = request.user!.id
  return await taskHandler.createFromTemplate(request, userId)
}

export const POST = requireOnboarding(postHandler)